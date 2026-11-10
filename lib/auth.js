import crypto from "crypto";

export function appUrl(req) {
  return process.env.APP_URL || `https://${req.headers.host}`;
}
export function cookie(name, value, maxAge = 600) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None`;
}
export function clearCookie(name) { return cookie(name, "", 0); }
export function randomState() { return crypto.randomBytes(24).toString("hex"); }
export function signSession(profile) {
  const payload = Buffer.from(JSON.stringify({ ...profile, iat: Date.now() })).toString("base64url");
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
export function verifySession(token) {
  try {
    const [payload, sig] = String(token || "").split(".");
    const secret = process.env.AUTH_SECRET;
    if (!payload || !sig || !secret) return null;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000) return null;
    return data;
  } catch { return null; }
}
export function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map(v => v.trim().split("=")).filter(v => v.length === 2).map(([k, v]) => [k, decodeURIComponent(v)]));
}
export function redirect(res, location, headers = []) {
  res.setHeader("Set-Cookie", headers);
  res.writeHead(302, { Location: location });
  res.end();
}
export async function exchange(url, params) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || data.error?.message || "OAuth exchange failed");
  return data;
}
