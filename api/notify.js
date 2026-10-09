// /api/notify — order alerts to Telegram with product photos + full details

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8737261045:AAGXsJDLKJAf0xsJzegLjWcBX3PUHZlzqow";
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "6746972381");

async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

function money(n) {
  try { return Number(n).toLocaleString("ar-EG") + " ج.م"; }
  catch { return String(n) + " ج.م"; }
}

function itemBlock(item, idx) {
  const lines = [];
  lines.push(`${idx}. ${item.name || "منتج"}`);
  if (item.qty) lines.push(`الكمية: ${item.qty}`);
  if (item.price != null) lines.push(`السعر: ${money(item.price)}`);
  if (item.qty && item.price != null) lines.push(`الإجمالي: ${money(item.price * item.qty)}`);
  if (item.category) lines.push(`القسم: ${item.category}`);
  if (item.description) lines.push(`الوصف: ${String(item.description).slice(0, 180)}`);
  if (item.specs && typeof item.specs === "object") {
    const specs = Object.entries(item.specs)
      .slice(0, 8)
      .map(([k, v]) => `• ${k}: ${v}`)
      .join("\n");
    if (specs) lines.push(`المواصفات:\n${specs}`);
  }
  return lines.join("\n");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const type = body.type || "info";
    const message = typeof body.message === "string" ? body.message : "";
    const order = body.order || null;

    // Full order with items + images
    if (type === "order" && order && Array.isArray(order.items) && order.items.length) {
      const c = order.customer || {};
      let summary =
        `🛒 طلب جديد — NEXORA\n` +
        `🆔 ${order.id || "—"}\n\n` +
        `👤 ${c.name || "—"}\n` +
        `📞 ${c.phone || "—"}\n` +
        `📧 ${c.email || "—"}\n` +
        `📍 ${c.address || "—"}\n`;
      if (c.note) summary += `📝 ${c.note}\n`;
      summary += `\n📦 عدد المنتجات: ${order.items.length}\n`;
      summary += `💰 الإجمالي: ${money(order.total || 0)}\n`;
      summary += `\n—— تفاصيل المنتجات ——\n`;

      order.items.forEach((item, i) => {
        summary += `\n${itemBlock(item, i + 1)}\n`;
      });

      summary += `\n✅ تواصل مع العميل لتأكيد التوصيل والدفع`;

      // Telegram message limit ~4096
      const chunks = [];
      let chunk = "";
      for (const line of summary.split("\n")) {
        if ((chunk + "\n" + line).length > 3500) {
          chunks.push(chunk);
          chunk = line;
        } else {
          chunk = chunk ? chunk + "\n" + line : line;
        }
      }
      if (chunk) chunks.push(chunk);

      for (const part of chunks) {
        await tg("sendMessage", {
          chat_id: ADMIN_CHAT,
          text: part,
          disable_web_page_preview: true
        });
      }

      // Send each product photo with caption (name + specs)
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const img = item.image;
        if (!img || !/^https?:\/\//i.test(String(img))) continue;

        let caption = `${i + 1}) ${item.name || "منتج"}`;
        if (item.qty) caption += `\nالكمية: ${item.qty}`;
        if (item.price != null) caption += `\nالسعر: ${money(item.price)}`;
        if (item.description) caption += `\n${String(item.description).slice(0, 120)}`;
        if (item.specs && typeof item.specs === "object") {
          const sp = Object.entries(item.specs)
            .slice(0, 5)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ");
          if (sp) caption += `\n${sp}`;
        }
        caption = caption.slice(0, 1000);

        try {
          await tg("sendPhoto", {
            chat_id: ADMIN_CHAT,
            photo: String(img),
            caption
          });
        } catch (e) {
          console.error("sendPhoto failed", item.name, e);
        }
      }

      return res.status(200).json({ ok: true, mode: "order+photos" });
    }

    // Generic text notification
    if (!message) return res.status(400).json({ error: "message required" });
    const prefix = {
      order: "🛒 طلب",
      register: "🆕 حساب جديد",
      login: "🔐 دخول",
      contact: "✉️ تواصل",
      profile: "👤 بروفايل"
    }[type] || "🔔";

    const result = await tg("sendMessage", {
      chat_id: ADMIN_CHAT,
      text: `${prefix}\n\n${message.slice(0, 3500)}`,
      disable_web_page_preview: true
    });

    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.description || "telegram failed" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
}
