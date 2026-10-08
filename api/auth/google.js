import { appUrl, cookie, exchange, parseCookies, randomState, redirect, signSession, verifySession } from "../_auth.js";

export default async function handler(req, res) {
  try {
    const base = appUrl(req);
    const callback = `${base}/api/auth/google?callback=1`;
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.AUTH_SECRET) return res.status(503).send("Google login is not configured yet");
    if (!req.query?.callback) {
      const state = randomState();
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: callback, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
      return redirect(res, url.toString(), [cookie("oauth_google_state", state)]);
    }
    const { code, state } = req.query || {};
    const saved = parseCookies(req).oauth_google_state;
    if (!code || !state || state !== saved) return res.status(400).send("Invalid Google login state");
    const token = await exchange("https://oauth2.googleapis.com/token", { code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: "authorization_code" });
    const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
    const user = await r.json();
    if (!r.ok) throw new Error("Could not read Google profile");
    const session = signSession({ id: `google:${user.sub}`, provider: "google", name: user.name || "زائر Google", email: user.email || "", avatar: user.picture || "", phone: "", address: "", bio: "" });
    return redirect(res, "/?social_login=success", [cookie("oauth_google_state", "", 0), cookie("noirtech_session", session, 604800)]);
  } catch (e) { console.error(e); return res.status(500).send("Google login failed"); }
}
