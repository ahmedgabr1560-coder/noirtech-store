// /api/notify — رسائل طلبات مدمجة لتليجرام

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

function colorsText(item) {
  if (Array.isArray(item.colors) && item.colors.length) return item.colors.filter(Boolean).join("، ");
  return item.color || item.selectedColor || "";
}

function compactItem(item, idx) {
  const cols = colorsText(item);
  const qty = Number(item.qty) || 1;
  const line = item.lineTotal != null ? Number(item.lineTotal) : (Number(item.price || 0) * qty);
  let s = `${idx}) ${item.name || "منتج"} ×${qty}`;
  if (cols) s += ` | 🎨 ${cols}`;
  s += ` = ${money(line)}`;
  if (item.dealLabel) s += ` (${item.dealLabel})`;
  return s;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const type = body.type || "info";
    const message = typeof body.message === "string" ? body.message : "";
    const order = body.order || null;

    if (type === "order" && order && Array.isArray(order.items) && order.items.length) {
      const c = order.customer || {};
      const itemsText = order.items.map((it, i) => compactItem(it, i + 1)).join("\n");
      const pay = order.paymentMethod ? `\n💳 الدفع: ${order.paymentMethod}` : "";
      const note = c.note ? `\n📝 ${c.note}` : "";

      // رسالة واحدة مدمجة
      let text =
        `🛒 طلب جديد\n` +
        `🆔 ${order.id || "—"}\n` +
        `👤 ${c.name || "—"}\n` +
        `📞 ${c.phone || "—"}\n` +
        `📍 ${c.address || "—"}${note}\n` +
        `\n📦 المنتجات:\n${itemsText}\n` +
        `\n💰 الإجمالي: ${money(order.total || 0)}${pay}\n` +
        `✅ تواصل مع العميل للتأكيد`;

      if (text.length > 4000) text = text.slice(0, 3990) + "…";

      await tg("sendMessage", {
        chat_id: ADMIN_CHAT,
        text,
        disable_web_page_preview: true
      });

      // صور المنتجات في رسالة واحدة إن أمكن (media group حتى 10)
      const media = [];
      for (let i = 0; i < order.items.length && media.length < 10; i++) {
        const item = order.items[i];
        const img = item.image;
        if (!img || !/^https?:\/\//i.test(String(img))) continue;
        const cols = colorsText(item);
        let cap = `${i + 1}) ${item.name || "منتج"} ×${item.qty || 1}`;
        if (cols) cap += ` | ${cols}`;
        media.push({
          type: "photo",
          media: String(img),
          caption: media.length === 0 ? cap.slice(0, 1000) : undefined
        });
      }
      if (media.length === 1) {
        await tg("sendPhoto", { chat_id: ADMIN_CHAT, photo: media[0].media, caption: media[0].caption || "" });
      } else if (media.length > 1) {
        // first caption only for group
        media[0].caption = media[0].caption || "صور الطلب";
        await tg("sendMediaGroup", { chat_id: ADMIN_CHAT, media });
      }

      return res.status(200).json({ ok: true, mode: "order-compact" });
    }

    // رسائل عامة (تسجيل / تواصل)
    if (message) {
      const prefix = type === "register" ? "👤 حساب جديد\n" : (type === "contact" ? "✉️ رسالة\n" : "");
      await tg("sendMessage", {
        chat_id: ADMIN_CHAT,
        text: (prefix + message).slice(0, 4000),
        disable_web_page_preview: true
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "message required" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
