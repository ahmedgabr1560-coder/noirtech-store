// Vercel serverless: /api/notify
// Sends admin notifications via Telegram without exposing bot token to browser

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8737261045:AAGXsJDLKJAf0xsJzegLjWcBX3PUHZlzqow";
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "6746972381");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { type, message, data } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message required" });
    }

    const prefix = {
      order: "🛒 طلب جديد",
      register: "🆕 حساب جديد",
      login: "🔐 تسجيل دخول",
      contact: "✉️ رسالة تواصل",
      profile: "👤 تحديث بروفايل"
    }[type] || "🔔 إشعار";

    const text = `${prefix}\n\n${message.slice(0, 3500)}`;

    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT,
        text,
        disable_web_page_preview: true
      })
    });
    const result = await r.json();
    if (!result.ok) {
      console.error("telegram notify failed", result);
      return res.status(500).json({ ok: false, error: result.description || "telegram failed" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
}
