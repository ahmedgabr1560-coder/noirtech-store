import { clearCookie, cookie, parseCookies, verifySession } from "../_auth.js";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const session = verifySession(parseCookies(req).noirtech_session);
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearCookie("noirtech_session"));
    return res.status(200).json({ ok: true });
  }
  return res.status(200).json({ authenticated: Boolean(session), user: session || null });
}
