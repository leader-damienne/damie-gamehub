"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, GAMES, SHOP, TOURNAMENTS, gameById, gameCover } from "@/lib/catalog";
import { MAX_DEPOSIT, MIN_CONVERT, MIN_DEPOSIT, MIN_SWAP_PI, MIN_WITHDRAW, STAKES, TOKEN, formatDgh, parseDghInput, parsePiInput, piToDgh } from "@/lib/economy";
import { api, bootPi, clearPaymentsAuth, ensurePaymentsAuth, hasPiSdk, initPi } from "@/lib/pi-client";
import { APP_NAME } from "@/lib/site";
import type { Pioneer, View } from "@/lib/types";
import GameScreen from "@/games/GameScreen";
import GameBrief from "@/components/GameBrief";

type TourRow = {
  id: string;
  title: string;
  gameId: string;
  entryPi: number;
  prizeLabel: string;
  endsAt: number;
  players: number;
  board: { uid: string; username: string; best: number }[];
};

export default function AppShell() {
  const [view, setView] = useState<View>("lobby");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<string | null>(null);
  const [pioneer, setPioneer] = useState<Pioneer | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const [gameId, setGameId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [tours, setTours] = useState<TourRow[]>([]);
  const [board, setBoard] = useState<{ username: string; score: number; gameId: string }[]>([]);
  const [boardGame, setBoardGame] = useState("all");
  const [stake, setStake] = useState(0);
  const [stakePick, setStakePick] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, { plays: number; players: number }>>({});
  const [boot, setBoot] = useState(false);
  const [depositInput, setDepositInput] = useState("");
  const [swapInput, setSwapInput] = useState("");
  const [convertInput, setConvertInput] = useState("");
  const [payReady, setPayReady] = useState<boolean | null>(null);

  const games = useMemo(
    () => GAMES.filter((g) => category === "all" || g.category === category),
    [category],
  );

  const boosted = Boolean(pioneer && pioneer.boostUntil > Date.now());

  const applyPioneer = useCallback((next: Pioneer) => {
    setPioneer(next);
    try {
      localStorage.setItem("damie.pioneer", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const rememberReceipt = useCallback((paymentId: string, kind: string) => {
    try {
      const list = JSON.parse(localStorage.getItem("damie.receipts") || "[]") as { paymentId: string; kind: string }[];
      if (!list.some((row) => row.paymentId === paymentId)) {
        list.push({ paymentId, kind });
        localStorage.setItem("damie.receipts", JSON.stringify(list.slice(-50)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const recoverPayments = useCallback(
    async (token: string) => {
      const raw = sessionStorage.getItem("damie.incompletePayment");
      if (raw) {
        sessionStorage.removeItem("damie.incompletePayment");
        try {
          const pending = JSON.parse(raw) as { paymentId?: string; txid?: string };
          if (pending.paymentId) {
            const res = await api<{ pioneer?: Pioneer }>("/api/payments/incomplete", token, {
              paymentId: pending.paymentId,
              txid: pending.txid,
            });
            if (res.pioneer) applyPioneer(res.pioneer);
            rememberReceipt(pending.paymentId, "deposit");
          }
        } catch {
          /* continue with receipts */
        }
      }
      try {
        const receipts = JSON.parse(localStorage.getItem("damie.receipts") || "[]") as { paymentId: string }[];
        if (receipts.length) {
          const res = await api<{ pioneer?: Pioneer }>("/api/payments/sync", token, { receipts });
          if (res.pioneer) applyPioneer(res.pioneer);
        }
      } catch {
        /* ignore */
      }
      try {
        const live = await api<{ pioneer?: Pioneer }>("/api/profile", token);
        if (live.pioneer) applyPioneer(live.pioneer);
      } catch {
        /* keep current pioneer */
      }
    },
    [applyPioneer, rememberReceipt],
  );

  const onPiIncomplete = useCallback(
    (payment: PiPaymentDTO) => {
      const token = session || localStorage.getItem("damie.session");
      if (!token) {
        try {
          sessionStorage.setItem(
            "damie.incompletePayment",
            JSON.stringify({
              paymentId: payment.identifier,
              txid: payment.transaction?.txid,
            }),
          );
        } catch {
          /* ignore */
        }
        return;
      }
      void api<{ pioneer?: Pioneer }>("/api/payments/incomplete", token, {
        paymentId: payment.identifier,
        txid: payment.transaction?.txid,
      }).then((res) => {
        if (res.pioneer) applyPioneer(res.pioneer);
        rememberReceipt(payment.identifier, "deposit");
      });
    },
    [applyPioneer, rememberReceipt, session],
  );

  const wakePayments = useCallback(async () => {
    if (!hasPiSdk()) return false;
    try {
      await bootPi();
      await ensurePaymentsAuth(onPiIncomplete);
      setPayReady(true);
      return true;
    } catch {
      setPayReady(false);
      return false;
    }
  }, [onPiIncomplete]);

  const restorePayments = useCallback(
    async (token?: string | null) => {
      const ok = await wakePayments();
      if (token) await recoverPayments(token);
      return ok;
    },
    [recoverPayments, wakePayments],
  );

  const applySession = useCallback((token: string) => {
    setSession(token);
    try {
      localStorage.setItem("damie.session", token);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setBoot(true);
  }, []);

  useEffect(() => {
    if (!boot) return;
    const piToken = sessionStorage.getItem("damie.piToken");
    if (piToken) {
      sessionStorage.removeItem("damie.piToken");
      setError("");
      api<{ session: string; pioneer: Pioneer }>("/api/auth/verify", null, { accessToken: piToken })
        .then(async (data) => {
          applySession(data.session);
          applyPioneer(data.pioneer);
          setView("lobby");
          await restorePayments(data.session);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Connexion Pi impossible");
        });
      return;
    }
    const savedSession = localStorage.getItem("damie.session");
    const savedPioneer = localStorage.getItem("damie.pioneer");
    if (savedSession && savedPioneer) {
      try {
        setSession(savedSession);
        setPioneer(JSON.parse(savedPioneer) as Pioneer);
        setView("lobby");
        restorePayments(savedSession).catch(() => undefined);
      } catch {
        localStorage.removeItem("damie.session");
        localStorage.removeItem("damie.pioneer");
      }
      return;
    }
    void bootPi().catch(() => undefined);
  }, [applyPioneer, applySession, boot, restorePayments]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || !session || !hasPiSdk() || busy) return;
      void wakePayments();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [busy, session, wakePayments]);

  const refreshTours = useCallback(async () => {
    const data = await api<{ tournaments: TourRow[] }>("/api/tournaments", null);
    setTours(data.tournaments);
  }, []);

  const refreshBoard = useCallback(async (id?: string) => {
    const q = id && id !== "all" ? `?gameId=${id}` : "";
    const data = await api<{ board: { username: string; score: number; gameId: string }[] }>(
      `/api/leaderboard${q}`,
      null,
    );
    setBoard(data.board);
  }, []);

  useEffect(() => {
    if (view === "lobby") {
      api<{ games: Record<string, { plays: number; players: number }> }>("/api/stats", null)
        .then((data) => setStats(data.games))
        .catch(() => undefined);
    }
    if (view === "tournaments") refreshTours().catch(() => undefined);
    if (view === "rankings") refreshBoard(boardGame).catch(() => undefined);
  }, [view, boardGame, refreshBoard, refreshTours]);

  async function pay(productId: string, amount: number, memo: string) {
    if (!session || !pioneer) return false;
    if (!hasPiSdk()) {
      setError("Les paiements Pi s’effectuent dans le Pi Browser.");
      return false;
    }
    setBusy(true);
    setError("");
    const createOnce = () =>
      new Promise<void>((resolve, reject) => {
        window.Pi!.createPayment(
          { amount, memo, metadata: { productId, uid: pioneer.uid } },
          {
            onReadyForServerApproval: async (paymentId) => {
              await api("/api/payments/approve", session, { paymentId, productId });
            },
            onReadyForServerCompletion: async (paymentId, txid) => {
              try {
                const res = await api<{ pioneer?: Pioneer; paymentId?: string }>(
                  "/api/payments/complete",
                  session,
                  { paymentId, txid },
                );
                if (res.pioneer) applyPioneer(res.pioneer);
                rememberReceipt(res.paymentId || paymentId, "deposit");
                resolve();
              } catch (err) {
                reject(err instanceof Error ? err : new Error("Paiement incomplet"));
                throw err;
              }
            },
            onCancel: () => reject(new Error("Paiement annulé")),
            onError: (err, payment) => {
              if (payment?.identifier) onPiIncomplete(payment);
              reject(err instanceof Error ? err : new Error("Paiement Pi refusé"));
            },
          },
        );
      });
    try {
      await bootPi();
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if (attempt > 0) clearPaymentsAuth();
          await ensurePaymentsAuth(onPiIncomplete);
          setPayReady(true);
          await createOnce();
          return true;
        } catch (err) {
          lastError = err;
          const raw = err instanceof Error ? err.message : String(err || "");
          if (/annul/i.test(raw)) throw err;
          if (/payments["']?\s*scope/i.test(raw) || /incomplete/i.test(raw) || /unauthor/i.test(raw)) {
            clearPaymentsAuth();
            continue;
          }
          throw err;
        }
      }
      throw lastError instanceof Error ? lastError : new Error("Paiement impossible");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Paiement impossible";
      setError(
        /payments["']?\s*scope/i.test(raw)
          ? "Touchez Autoriser dans Pi, puis Déposer à nouveau. Une fois validé, ça reste actif."
          : raw,
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openWallet() {
    setView("wallet");
    void restorePayments(session);
  }

  function enterWithPi() {
    setError("");
    if (!hasPiSdk()) {
      setError("Ouvrez ce lien dans le Pi Browser, pas Chrome.");
      return;
    }
    setBusy(true);
    void bootPi()
      .then(() => ensurePaymentsAuth(onPiIncomplete))
      .then(async (auth) => {
        if (!auth?.accessToken) throw new Error("Pi n’a pas renvoyé de jeton.");
        const data = await api<{ session: string; pioneer: Pioneer }>("/api/auth/verify", null, {
          accessToken: auth.accessToken,
        });
        applySession(data.session);
        applyPioneer(data.pioneer);
        setPayReady(true);
        setView("lobby");
        await recoverPayments(data.session);
      })
      .catch((err) => {
        clearPaymentsAuth();
        setError(err instanceof Error ? err.message : "Connexion Pi impossible");
      })
      .finally(() => setBusy(false));
  }

  async function submitDeposit() {
    const amount = parsePiInput(depositInput);
    if (amount === null || amount < MIN_DEPOSIT) {
      setError(`Indiquez un dépôt d’au moins ${MIN_DEPOSIT} π.`);
      return;
    }
    if (amount > MAX_DEPOSIT) {
      setError(`Dépôt maximum ${MAX_DEPOSIT} π.`);
      return;
    }
    const ok = await pay(`deposit:${amount}`, amount, `Dep ${amount} Pi`.slice(0, 24));
    if (ok) setDepositInput("");
  }

  async function submitSwapIn() {
    const amount = parsePiInput(swapInput);
    if (amount === null || amount < MIN_SWAP_PI) {
      setError(`Indiquez au moins ${MIN_SWAP_PI} π à échanger.`);
      return;
    }
    if (!pioneer || amount > pioneer.piCredit) {
      setError("Solde π insuffisant pour cet échange.");
      return;
    }
    await walletCall("swap-in", { amount });
    setSwapInput("");
  }

  async function submitConvert() {
    const amount = parseDghInput(convertInput);
    if (amount === null || amount < MIN_CONVERT) {
      setError(`Indiquez au moins ${MIN_CONVERT} ${TOKEN} à échanger.`);
      return;
    }
    if (!pioneer || amount > pioneer.damie) {
      setError(`${TOKEN} insuffisants pour cet échange.`);
      return;
    }
    await walletCall("convert", { amount });
    setConvertInput("");
  }

  async function watchAd() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      if (!hasPiSdk() || !window.Pi?.Ads) {
        setError("Les pubs récompensées s’affichent dans le Pi Browser.");
        return;
      }
      await initPi();
      const ready = await window.Pi.Ads.isAdReady("rewarded");
      if (!ready.ready) await window.Pi.Ads.requestAd("rewarded");
      const shown = await window.Pi.Ads.showAd("rewarded");
      if (shown.type === "rewarded" && shown.result === "AD_REWARDED") {
        const data = await api<{ pioneer: Pioneer }>("/api/ads/verify", session, { adId: shown.adId });
        if (data.pioneer) applyPioneer(data.pioneer);
      } else {
        setError("Pub non récompensée. Réessayez dans le Pi Browser.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publicité indisponible");
    } finally {
      setBusy(false);
    }
  }

  async function finishGame(score: number) {
    if (!session || !gameId) return;
    try {
      const data = await api<{ pioneer: Pioneer; score: number; payout?: number; damie?: number }>(
        "/api/scores",
        session,
        { gameId, score, stake },
      );
      if (data.pioneer) applyPioneer(data.pioneer);
      const live = await api<{ games: Record<string, { plays: number; players: number }> }>("/api/stats", null);
      setStats(live.games);
      if (tournamentId) {
        await api("/api/tournaments", session, {
          action: "score",
          tournamentId,
          score: data.score,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Score non enregistré");
    }
  }

  async function joinTour(t: TourRow) {
    if (!session) return;
    setError("");
    const result = await api<{ ok: boolean; error?: string; pioneer?: Pioneer }>(
      "/api/tournaments",
      session,
      { tournamentId: t.id },
    );
    if (!result.ok) {
      setError(result.error || "Inscription impossible");
      return;
    }
    if (result.pioneer) applyPioneer(result.pioneer);
    setTournamentId(t.id);
    setGameId(t.gameId);
    setView("play");
  }

  async function startGame(id: string, amount: number) {
    if (!session) return;
    setError("");
    try {
      if (amount > 0) {
        const res = await api<{ pioneer?: Pioneer }>("/api/wallet", session, {
          action: "stake",
          amount,
        });
        if (res.pioneer) applyPioneer(res.pioneer);
      }
      setStake(amount);
      setStakePick(null);
      setTournamentId(null);
      setGameId(id);
      setView("play");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise impossible");
    }
  }

  async function walletCall(action: string, extra: Record<string, unknown> = {}) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<{
        pioneer?: Pioneer;
        error?: string;
        pendingWithdraw?: boolean;
        paymentId?: string;
      }>("/api/wallet", session, { action, ...extra });
      if (res.pioneer) applyPioneer(res.pioneer);
      if (action === "withdraw" && res.paymentId) {
        rememberReceipt(res.paymentId, "withdraw");
      }
      if (res.pendingWithdraw && res.paymentId) {
        setError("Envoi des π en cours…");
        for (let i = 0; i < 20; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const status = await api<{ pendingWithdraw?: boolean }>("/api/wallet", session, {
            action: "withdraw-status",
            paymentId: res.paymentId,
          });
          if (!status.pendingWithdraw) {
            setError("");
            return;
          }
        }
        setError("Retrait envoyé à Pi. Les π peuvent mettre une minute à arriver dans le wallet Pioneer.");
      }
    } catch (err) {
      try {
        const live = await api<{ pioneer?: Pioneer }>("/api/profile", session);
        if (live.pioneer) applyPioneer(live.pioneer);
      } catch {
        /* ignore */
      }
      setError(err instanceof Error ? err.message : "Opération impossible");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (!session) return;
    const data = await api<{ pioneer: Pioneer }>("/api/profile", session, { action: "claim" });
    if (data.pioneer) applyPioneer(data.pioneer);
  }

  if (!boot) {
    return (
      <div className="app-root">
        <div className="phone">
          <div className="splash">
            <div className="brand-lock" translate="no">
              {APP_NAME}
            </div>
            <p>Ouverture du lobby…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pioneer) {
    return (
      <div className="app-root">
        <div className="phone">
          <div className="splash">
            <img src="/logo-1024.png" alt={APP_NAME} />
            <div className="brand-lock" translate="no">
              {APP_NAME}
            </div>
            <p>Connexion et paiements uniquement avec Pi. Une autorisation suffit, même après rechargement.</p>
            {error && <div className="warn">{error}</div>}
            <button className="gold-btn" type="button" disabled={busy} onClick={enterWithPi}>
              {busy ? "Autorisez dans Pi…" : "Entrer avec Pi"}
            </button>
            <div className="notice">Touchez Entrer avec Pi, puis Autoriser. Les dépôts restent actifs ensuite.</div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "play" && gameId) {
    return (
      <div className="app-root">
        <div className="phone">
          <GameScreen
            gameId={gameId}
            boosted={boosted}
            lives={pioneer?.lives ?? 0}
            stake={stake}
            skipIntro={!tournamentId}
            onExit={() => {
              setView("lobby");
              setGameId(null);
              setTournamentId(null);
              setStake(0);
            }}
            onFinished={finishGame}
            onUseLife={async () => {
              if (!session) return false;
              try {
                const data = await api<{ pioneer: Pioneer }>("/api/profile", session, { action: "use-life" });
                if (data.pioneer) applyPioneer(data.pioneer);
                return true;
              } catch (err) {
                setError(err instanceof Error ? err.message : "Vie indisponible");
                return false;
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="phone">
        <div className="scroll">
          {view !== "privacy" && (
            <div className="topbar">
              <div className="brand-mini">
                <img src="/logo.png" alt={APP_NAME} />
                <div>
                  <strong className="brand-lock" translate="no">
                    {APP_NAME}
                  </strong>
                  <span>{pioneer.username}</span>
                </div>
              </div>
              <div className="pill" onClick={openWallet} style={{ cursor: "pointer" }}>
                {Number(pioneer?.piCredit || 0).toFixed(2)} π · {formatDgh(pioneer?.damie ?? 0)} {TOKEN}
              </div>
            </div>
          )}

          {error && <div className="warn">{error}</div>}
          {!payReady && payReady !== null && (
            <div className="warn">
              Touchez une fois pour activer les dépôts et retraits Pi. Ça reste valable après rechargement.
              <button
                className="gold-btn"
                style={{ marginTop: 8, width: "100%" }}
                disabled={busy}
                onClick={() => void wakePayments()}
              >
                Activer les paiements Pi
              </button>
            </div>
          )}
            <>
              <div className="hero">
                <div className="hero-row">
                  <div className="hero-copy">
                    <div className="pill brand-lock" translate="no">
                      {APP_NAME}
                    </div>
                    <p className="hello">Bienvenue</p>
                    <h2>{pioneer.username}</h2>
                  </div>
                  <img className="hero-logo" src="/logo.png" alt={APP_NAME} />
                </div>
                <p className="hero-lead">
                  Déposez des π, échangez-les en {TOKEN} pour jouer, puis reconvertissez vos gains en π pour retirer.
                </p>
                <button className="gold-btn" onClick={() => setStakePick("crown-catch")}>
                  Jouer maintenant
                </button>
              </div>

              <div className="section-title">
                <h3>Missions du jour</h3>
                <span>Série {pioneer.streak}j</span>
              </div>
              <div className="missions">
                <div className={`mission ${pioneer.missions.play3 >= 3 ? "on" : ""}`}>
                  Jouer 3 parties <b>{pioneer.missions.play3}/3</b>
                </div>
                <div className={`mission ${pioneer.missions.score500 ? "on" : ""}`}>
                  Atteindre 500 pts <b>{pioneer.missions.score500 ? "OK" : "—"}</b>
                </div>
                <div className={`mission ${pioneer.missions.ad1 ? "on" : ""}`}>
                  Pub récompensée <b>{pioneer.missions.ad1 ? "OK" : "—"}</b>
                </div>
                <div className={`mission ${pioneer.missions.tournament1 ? "on" : ""}`}>
                  Rejoindre un tournoi <b>{pioneer.missions.tournament1 ? "OK" : "—"}</b>
                </div>
                <button className="gold-btn" onClick={claim} disabled={pioneer.missions.claimed}>
                  {pioneer.missions.claimed ? "Récompense déjà prise" : "Réclamer le coffre du jour"}
                </button>
              </div>

              <div className="row">
                {CATEGORIES.map((c) => (
                  <button key={c.id} className={`chip ${category === c.id ? "on" : ""}`} onClick={() => setCategory(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="grid">
                {games.map((g) => (
                  <button
                    key={g.id}
                    className="card"
                    onClick={() => setStakePick(g.id)}
                  >
                    <div className="thumb">
                      <img src={gameCover(g.id)} alt={g.title} />
                    </div>
                    <div className="card-body">
                      <b>{g.title}</b>
                      <small>{g.tagline}</small>
                      <div className="play-btn">
                        JOUER
                        {stats[g.id]
                          ? ` · ${stats[g.id].players} joueur${stats[g.id].players > 1 ? "s" : ""} · ${stats[g.id].plays} partie${stats[g.id].plays > 1 ? "s" : ""}`
                          : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {view === "tournaments" && (
            <>
              <div className="section-title">
                <h3>Tournoi Center</h3>
                <span>{pioneer?.tickets ?? 0} tickets</span>
              </div>
              <div className="list">
                {tours.map((t) => {
                  const def = TOURNAMENTS.find((x) => x.id === t.id);
                  const game = gameById(t.gameId);
                  const remain = Math.max(0, t.endsAt - Date.now());
                  const hrs = Math.floor(remain / 3600000);
                  return (
                    <div key={t.id} className="shop-item">
                      <div className="tour-head">
                        <img className="tour-cover" src={gameCover(t.gameId)} alt="" />
                        <div>
                          <h4>{t.title}</h4>
                          <p>
                            {game?.title} · {t.players} joueurs · {hrs}h restantes
                            <br />
                            Récompense : {def?.prizeLabel}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="price">{t.entryPi === 0 ? "Gratuit" : `${piToDgh(t.entryPi)} ${TOKEN}`}</span>
                        <button className="gold-btn" disabled={busy} onClick={() => joinTour(t)}>
                          Entrer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === "rankings" && (
            <>
              <div className="row">
                <button className={`chip ${boardGame === "all" ? "on" : ""}`} onClick={() => setBoardGame("all")}>
                  Global
                </button>
                {GAMES.map((g) => (
                  <button key={g.id} className={`chip ${boardGame === g.id ? "on" : ""}`} onClick={() => setBoardGame(g.id)}>
                    {g.title}
                  </button>
                ))}
              </div>
              <div className="list">
                {board.length === 0 && <p className="notice">Aucun score encore. Soyez le premier trône.</p>}
                {board.map((row, i) => (
                  <div key={`${row.username}-${i}`} className="list-item">
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span className="rank">{i + 1}</span>
                      <div>
                        <b>{row.username}</b>
                        <div className="notice" style={{ margin: 0 }}>
                          {gameById(row.gameId)?.title || "Global"}
                        </div>
                      </div>
                    </div>
                    <span className="price">{row.score}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === "wallet" && pioneer && (
            <>
              <div className="section-title">
                <h3>Portefeuille</h3>
                <span>100 {TOKEN} = 1 π</span>
              </div>
              <div className="stats">
                <div className="stat">
                  <b>{Number(pioneer.piCredit || 0).toFixed(2)}</b>
                  <span>π à échanger</span>
                </div>
                <div className="stat">
                  <b>{formatDgh(pioneer.damie || 0)}</b>
                  <span>{TOKEN} jouables</span>
                </div>
                <div className="stat">
                  <b>{pioneer.crownScore}</b>
                  <span>Couronnes</span>
                </div>
              </div>
              <div className="shop-item" style={{ marginBottom: 12 }}>
                <h4>Déposer des π</h4>
                <p>
                  Saisissez le montant à envoyer depuis votre wallet Pi. Minimum {MIN_DEPOSIT} π.
                  L’autorisation Pi reste active tant que Damie GameHub reste ouvert.
                </p>
                <div className="amount-row">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Montant en π"
                    value={depositInput}
                    disabled={busy}
                    onChange={(e) => setDepositInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitDeposit();
                    }}
                  />
                  <button className="gold-btn" disabled={busy} onClick={() => void submitDeposit()}>
                    Déposer
                  </button>
                </div>
              </div>
              <div className="shop-item" style={{ marginBottom: 12 }}>
                <h4>Échanger π → {TOKEN}</h4>
                <p>
                  Seuls les {TOKEN} servent aux mises, à la boutique et aux tournois. Minimum{" "}
                  {MIN_SWAP_PI} π.
                </p>
                <div className="amount-row">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={`Max ${Number(pioneer.piCredit || 0).toFixed(2)} π`}
                    value={swapInput}
                    disabled={busy}
                    onChange={(e) => setSwapInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitSwapIn();
                    }}
                  />
                  <button
                    className="gold-btn"
                    disabled={busy || (pioneer.piCredit || 0) < MIN_SWAP_PI}
                    onClick={() => void submitSwapIn()}
                  >
                    Échanger
                  </button>
                </div>
                <button
                  className="ghost-btn"
                  style={{ marginTop: 8, width: "100%" }}
                  disabled={busy || (pioneer.piCredit || 0) < MIN_SWAP_PI}
                  onClick={() => walletCall("swap-in", { amount: pioneer.piCredit })}
                >
                  Tout échanger ({Number(pioneer.piCredit || 0).toFixed(2)} π → {piToDgh(pioneer.piCredit || 0)} {TOKEN})
                </button>
              </div>
              <div className="shop-item" style={{ marginBottom: 12 }}>
                <h4>Échanger {TOKEN} → π</h4>
                <p>
                  Pour retirer vos gains, reconvertissez d’abord vos {TOKEN} en π (min. {MIN_CONVERT}{" "}
                  {TOKEN}).
                </p>
                <div className="amount-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={`Max ${Math.floor(pioneer.damie || 0)} ${TOKEN}`}
                    value={convertInput}
                    disabled={busy}
                    onChange={(e) => setConvertInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitConvert();
                    }}
                  />
                  <button
                    className="gold-btn"
                    disabled={busy || (pioneer.damie || 0) < MIN_CONVERT}
                    onClick={() => void submitConvert()}
                  >
                    Échanger
                  </button>
                </div>
              </div>
              <div className="shop-item" style={{ marginBottom: 12 }}>
                <h4>Retirer vers le wallet Pi</h4>
                <p>Uniquement le solde π. Minimum {MIN_WITHDRAW} π. Envoi vers votre wallet Pioneer.</p>
                <button
                  className="ghost-btn"
                  disabled={busy || (pioneer.piCredit || 0) < MIN_WITHDRAW}
                  onClick={() => walletCall("withdraw", { amount: pioneer.piCredit })}
                >
                  Retirer {Number(pioneer.piCredit || 0).toFixed(2)} π
                </button>
              </div>
              <div className="section-title">
                <h3>Boutique</h3>
                <span>Payée en {TOKEN}</span>
              </div>
              <div className="list">
                {SHOP.map((item) => (
                  <div key={item.id} className="shop-item">
                    <h4>{item.name}</h4>
                    <p>{item.detail}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="price">{piToDgh(item.amount)} {TOKEN}</span>
                      <button
                        className="gold-btn"
                        disabled={busy || (pioneer.damie || 0) < piToDgh(item.amount)}
                        onClick={() => walletCall("buy", { productId: item.id })}
                      >
                        Acheter
                      </button>
                    </div>
                  </div>
                ))}
                <div className="shop-item">
                  <h4>Vie bonus (pub)</h4>
                  <p>Regardez une pub récompensée Pi Ads Network.</p>
                  <button className="ghost-btn" disabled={busy} onClick={watchAd}>
                    Gagner 1 vie + {TOKEN}
                  </button>
                </div>
              </div>
              {(pioneer.ledger || []).length > 0 && (
                <>
                  <div className="section-title">
                    <h3>Historique</h3>
                  </div>
                  <div className="list">
                    {pioneer.ledger.slice(0, 12).map((row, i) => (
                      <div key={`${row.at}-${i}`} className="list-item">
                        <span>{row.memo}</span>
                        <b>{row.amount > 0 ? "+" : ""}{row.amount}</b>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {view === "profile" && pioneer && (
            <>
              <div className="profile-head">
                <div className="avatar">
                  <img src="/logo.png" alt="" />
                </div>
                <h3 style={{ margin: "0 0 4px" }}>{pioneer.username}</h3>
                <span className="notice">Pioneer Damie · authentifié Pi</span>
              </div>
              <div className="stats">
                <div className="stat">
                  <b>{pioneer.crownScore}</b>
                  <span>Couronnes</span>
                </div>
                <div className="stat">
                  <b>{pioneer.gamesPlayed}</b>
                  <span>Parties</span>
                </div>
                <div className="stat">
                  <b>{pioneer.streak}</b>
                  <span>Série</span>
                </div>
              </div>
              <div className="list">
                <div className="list-item">
                  <span>π à échanger / retirer</span>
                  <b>{Number(pioneer.piCredit || 0).toFixed(2)}</b>
                </div>
                <div className="list-item">
                  <span>{TOKEN} jouables</span>
                  <b>{formatDgh(pioneer.damie || 0)}</b>
                </div>
                <div className="list-item">
                  <span>Pièces</span>
                  <b>{pioneer.coins}</b>
                </div>
                <div className="list-item">
                  <span>Tickets</span>
                  <b>{pioneer.tickets}</b>
                </div>
                <div className="list-item">
                  <span>Vies</span>
                  <b>{pioneer.lives}</b>
                </div>
                <div className="list-item">
                  <span>Pubs vues</span>
                  <b>{pioneer.adsWatched}</b>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                {hasPiSdk() && window.Pi?.openShareDialog && (
                  <button
                    className="gold-btn"
                    onClick={() =>
                      window.Pi?.openShareDialog?.(
                        APP_NAME,
                        `Je joue sur ${APP_NAME} — score ${pioneer.crownScore} couronnes.`,
                      )
                    }
                  >
                    Partager dans Pi
                  </button>
                )}
                <button className="ghost-btn" onClick={() => setView("privacy")}>
                  Confidentialité
                </button>
              </div>
            </>
          )}

          {view === "privacy" && (
            <div className="legal">
              <button className="ghost-btn" onClick={() => setView("profile")}>
                Retour
              </button>
              <h3>Confidentialité & règles</h3>
              <p>
                Connexion uniquement via le SDK Pi. Aucun e-mail, téléphone, ou compte tiers.
              </p>
              <p>
                Données conservées : identifiant d’app Pi, nom Pioneer, scores, tickets et couronnes
                nécessaires au jeu, aux tournois et aux classements.
              </p>
              <p>
                Les π déposés doivent être échangés en {TOKEN} pour jouer, miser ou acheter.
                Pour retirer, les {TOKEN} sont reconvertis en π (100 {TOKEN} = 1 π), puis envoyés vers le
                wallet Pi. Pas de monnaie fiat.
              </p>
            </div>
          )}
        </div>

        {view !== "privacy" && (
          <nav className="nav">
            <NavBtn label="Lobby" on={view === "lobby"} icon="grid" onClick={() => setView("lobby")} />
            <NavBtn label="Coupes" on={view === "tournaments"} icon="cup" onClick={() => setView("tournaments")} />
            <NavBtn label="Top" on={view === "rankings"} icon="rank" onClick={() => setView("rankings")} />
            <NavBtn label="Solde" on={view === "wallet"} icon="bag" onClick={openWallet} />
            <NavBtn label="Profil" on={view === "profile"} icon="user" onClick={() => setView("profile")} />
          </nav>
        )}
        {stakePick && pioneer && (
          <div className="overlay">
            <div className="panel panel-brief">
              {gameById(stakePick) && <GameBrief game={gameById(stakePick)!} />}
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {STAKES.map((amount) => (
                  <button
                    key={amount}
                    className="gold-btn"
                    disabled={amount > 0 && (pioneer.damie || 0) < amount}
                    onClick={() => startGame(stakePick, amount)}
                  >
                    {amount === 0 ? `Jouer sans mise · microns ${TOKEN}` : `Miser ${amount} ${TOKEN}`}
                  </button>
                ))}
                <button className="ghost-btn" onClick={() => setStakePick(null)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavBtn({
  label,
  on,
  icon,
  onClick,
}: {
  label: string;
  on: boolean;
  icon: "grid" | "cup" | "rank" | "bag" | "user";
  onClick: () => void;
}) {
  return (
    <button className={on ? "on" : ""} onClick={onClick}>
      {icon === "grid" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="8" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
          <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
      )}
      {icon === "cup" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 5h8v4a4 4 0 0 1-8 0V5Z" />
          <path d="M16 6h2.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M8 6H5.5a2.5 2.5 0 0 0 0 5H8" />
          <path d="M12 13v3M9 20h6" />
        </svg>
      )}
      {icon === "rank" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20V10M12 20V4M20 20v-7" />
        </svg>
      )}
      {icon === "bag" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V7a3 3 0 0 1 6 0v1" />
        </svg>
      )}
      {icon === "user" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
        </svg>
      )}
      {label}
    </button>
  );
}
