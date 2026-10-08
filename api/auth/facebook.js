import { appUrl, cookie, exchange, parseCookies, randomState, redirect, signSession } from "../_auth.js";

export default async function handler(req, res) {
  try {
    const base = appUrl(req);
    const callback = `${base}/api/auth/facebook?callback=1`;
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.AUTH_SECRET) return res.status(503).send("Facebook login is not configured yet");
    if (!req.query?.callback) {
      const state = randomState();
      const url = new URL("https://www.facebook.com/v26.0/dialog/oauth");
      url.search = new URLSearchParams({ client_id: process.env.FACEBOOK_APP_ID, redirect_uri: callback, response_type: "code", scope: "public_profile,email", state });
      return redirect(res, url.toString(), [cookie("oauth_facebook_state", state)]);
    }
    const { code, state } = req.query || {};
    const saved = parseCookies(req).oauth_facebook_state;
    if (!code || !state || state !== saved) return res.status(400).send("Invalid Facebook login state");
    const token = await exchange("https://graph.facebook.com/v26.0/oauth/access_token", { code, client_id: process.env.FACEBOOK_APP_ID, client_secret: process.env.FACEBOOK_APP_SECRET, redirect_uri: callback });
    const r = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(token.access_token)}`);
    const user = await r.json();
    if (!r.ok) throw new Error("Could not read Facebook profile");
    const session = signSession({ id: `facebook:${user.id}`, provider: "facebook", name: user.name || "زائر Facebook", email: user.email || "", avatar: user.picture?.data?.url || "", phone: "", address: "", bio: "" });
    return redirect(res, "/?social_login=success", [cookie("oauth_facebook_state", "", 0), cookie("noirtech_session", session, 604800)]);
  } catch (e) { console.error(e); return res.status(500).send("Facebook login failed"); }
}
