import { appUrl, clearCookie, cookie, exchange, parseCookies, randomState, redirect, signSession, verifySession } from "../lib/auth.js";

export default async function handler(req, res) {
  const provider = String(req.query?.provider || "").toLowerCase();
  if (provider === "session") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const session = verifySession(parseCookies(req).noirtech_session);
    if (req.method === "DELETE") {
      res.setHeader("Set-Cookie", clearCookie("noirtech_session"));
      return res.status(200).json({ ok: true });
    }
    return res.status(200).json({ authenticated: Boolean(session), user: session || null });
  }
  if (provider !== "google" && provider !== "facebook") return res.status(404).send("Unknown auth provider");

  try {
    const base = appUrl(req);
    const callback = `${base}/api/auth/${provider}?callback=1`;
    const configured = provider === "google"
      ? process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      : process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET;
    if (!configured || !process.env.AUTH_SECRET) return res.status(503).send(`${provider} login is not configured yet`);
    const prefix = provider === "google" ? "google" : "facebook";
    if (!req.query?.callback) {
      const state = randomState();
      const url = provider === "google"
        ? new URL("https://accounts.google.com/o/oauth2/v2/auth")
        : new URL("https://www.facebook.com/v26.0/dialog/oauth");
      url.search = provider === "google"
        ? new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: callback, response_type: "code", scope: "openid email profile", state, prompt: "select_account" })
        : new URLSearchParams({ client_id: process.env.FACEBOOK_APP_ID, redirect_uri: callback, response_type: "code", scope: "public_profile,email", state });
      return redirect(res, url.toString(), [cookie(`oauth_${prefix}_state`, state)]);
    }
    const { code, state } = req.query || {};
    const saved = parseCookies(req)[`oauth_${prefix}_state`];
    if (!code || !state || state !== saved) return res.status(400).send(`Invalid ${provider} login state`);
    const token = provider === "google"
      ? await exchange("https://oauth2.googleapis.com/token", { code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: "authorization_code" })
      : await exchange("https://graph.facebook.com/v26.0/oauth/access_token", { code, client_id: process.env.FACEBOOK_APP_ID, client_secret: process.env.FACEBOOK_APP_SECRET, redirect_uri: callback });
    const profileResponse = provider === "google"
      ? await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } })
      : await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(token.access_token)}`);
    const user = await profileResponse.json();
    if (!profileResponse.ok) throw new Error(`Could not read ${provider} profile`);
    const profile = provider === "google"
      ? { id: `google:${user.sub}`, provider: "google", name: user.name || "زائر Google", email: user.email || "", avatar: user.picture || "" }
      : { id: `facebook:${user.id}`, provider: "facebook", name: user.name || "زائر Facebook", email: user.email || "", avatar: user.picture?.data?.url || "" };
    const session = signSession({ ...profile, phone: "", address: "", bio: "" });
    return redirect(res, "/?social_login=success", [cookie(`oauth_${prefix}_state`, "", 0), cookie("noirtech_session", session, 604800)]);
  } catch (e) {
    console.error(e);
    return res.status(500).send(`${provider} login failed`);
  }
}
