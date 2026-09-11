import { Account, Asset, Keypair, Memo, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-base";

const HORIZON = {
  mainnet: { url: "https://api.mainnet.minepi.com", passphrase: "Pi Network" },
  testnet: { url: "https://api.testnet.minepi.com", passphrase: "Pi Testnet" },
};

export function walletSeedForHost(mainnet: boolean) {
  const seed = mainnet
    ? process.env.PI_WALLET_SEED_MAINNET || process.env.PI_WALLET_SEED || ""
    : process.env.PI_WALLET_SEED_TESTNET || process.env.PI_WALLET_SEED || "";
  return seed.trim();
}

export function hasWalletSeed(mainnet: boolean) {
  return Boolean(walletSeedForHost(mainnet));
}

function netFor(network: string | undefined, mainnet: boolean) {
  if (network === HORIZON.mainnet.passphrase) return HORIZON.mainnet;
  if (network === HORIZON.testnet.passphrase) return HORIZON.testnet;
  return mainnet ? HORIZON.mainnet : HORIZON.testnet;
}

function formatPiAmount(amount: number) {
  const text = Number(amount).toFixed(7).replace(/\.?0+$/, "");
  return text || "0";
}

function horizonError(text: string, status: number) {
  try {
    const parsed = JSON.parse(text) as {
      title?: string;
      detail?: string;
      extras?: { result_codes?: { transaction?: string; operations?: string[] } };
    };
    const code =
      parsed.extras?.result_codes?.operations?.[0] || parsed.extras?.result_codes?.transaction || parsed.title || "";
    const blob = `${code} ${parsed.detail || ""}`.toLowerCase();
    if (blob.includes("insufficient") || blob.includes("underfunded") || blob.includes("tx_insufficient_balance")) {
      return "Le App Wallet n’a pas assez de π pour ce retrait. Alimentez-le depuis develop.pinet.com.";
    }
    if (blob.includes("op_no_destination") || blob.includes("no_trust")) {
      return "Le wallet Pioneer du joueur n’est pas prêt à recevoir des π (wallet Mainnet manquant).";
    }
    if (blob.includes("tx_bad_seq") || blob.includes("bad_seq")) {
      return "Séquence Horizon refusée. Réessayez le retrait.";
    }
    return `Envoi blockchain Pi refusé${code ? ` (${code})` : ""} [${status}]`;
  } catch {
    return `Envoi blockchain Pi refusé [${status}]`;
  }
}

export async function submitA2UOnChain(opts: {
  seed: string;
  amount: number;
  paymentId: string;
  fromAddress: string;
  toAddress: string;
  mainnet: boolean;
  network?: string;
}) {
  const seed = opts.seed.trim();
  if (!seed.startsWith("S") || seed.length !== 56 || !StrKey.isValidEd25519SecretSeed(seed)) {
    throw new Error("PI_WALLET_SEED invalide. La graine du App Wallet doit commencer par S et faire 56 caractères.");
  }
  if (!opts.fromAddress || !opts.toAddress) {
    throw new Error("Wallet de l’app Pi manquant. Dans develop.pinet.com, générez un App Wallet (pas None).");
  }
  if (!opts.paymentId) throw new Error("Identifiant de paiement Pi manquant.");
  if (new TextEncoder().encode(opts.paymentId).length > 28) {
    throw new Error("Identifiant de paiement Pi trop long pour le mémo Horizon.");
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecret(seed);
  } catch {
    throw new Error("PI_WALLET_SEED invalide. La graine du App Wallet doit commencer par S et faire 56 caractères.");
  }
  if (keypair.publicKey() !== opts.fromAddress) {
    throw new Error("PI_WALLET_SEED ne correspond pas au wallet de l’app Pi (adresse différente).");
  }

  const net = netFor(opts.network, opts.mainnet);
  const accountRes = await fetch(`${net.url}/accounts/${opts.fromAddress}`, { cache: "no-store" });
  const accountText = await accountRes.text();
  if (!accountRes.ok) {
    throw new Error(
      accountRes.status === 404
        ? "Le App Wallet n’existe pas encore sur le réseau Pi. Générez-le et alimentez-le dans develop.pinet.com."
        : `Horizon Pi inaccessible [${accountRes.status}]`,
    );
  }
  const accountJson = JSON.parse(accountText) as { sequence?: string };
  if (!accountJson.sequence) throw new Error("Compte App Wallet Pi illisible sur Horizon.");

  const feeRes = await fetch(`${net.url}/fee_stats`, { cache: "no-store" });
  let fee = "100000";
  if (feeRes.ok) {
    try {
      const stats = (await feeRes.json()) as { last_ledger_base_fee?: string };
      const base = Number(stats.last_ledger_base_fee || 100);
      fee = String(Math.max(100, base));
    } catch {
      /* keep default */
    }
  }

  const account = new Account(opts.fromAddress, accountJson.sequence);
  const tx = new TransactionBuilder(account, {
    fee,
    networkPassphrase: net.passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: opts.toAddress,
        asset: Asset.native(),
        amount: formatPiAmount(opts.amount),
      }),
    )
    .addMemo(Memo.text(opts.paymentId))
    .setTimeout(180)
    .build();
  tx.sign(keypair);

  const submit = await fetch(`${net.url}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `tx=${encodeURIComponent(tx.toXDR())}`,
  });
  const submitText = await submit.text();
  if (!submit.ok) throw new Error(horizonError(submitText, submit.status));
  const result = JSON.parse(submitText) as { hash?: string; id?: string; successful?: boolean };
  const txid = result.hash || result.id;
  if (!txid) throw new Error("Transaction Pi envoyée sans identifiant.");
  return String(txid);
}
