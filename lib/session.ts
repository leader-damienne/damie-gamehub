import { createHmac } from "crypto";

function secret() {
  return process.env.SESSION_SECRET || process.env.PI_API_KEY || "damie-gamehub-dev-secret";
}

export function signSession(uid: string, username: string) {
  const payload = Buffer.from(
    JSON.stringify({ uid, username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSession(token: string | null | undefined) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      uid: string;
      username: string;
      exp: number;
    };
    if (!data.uid || data.exp < Date.now()) return null;
    return { uid: data.uid, username: data.username };
  } catch {
    return null;
  }
}

export function bearer(req: Request) {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}
