// /api/notify — تليجرام + واتساب (Twilio) عند توفر المفاتيح
//
// متغيرات Vercel المطلوبة للواتساب:
// TWILIO_ACCOUNT_SID
// TWILIO_AUTH_TOKEN
// TWILIO_WHATSAPP_FROM   مثال: whatsapp:+14155238886  (رقم Twilio/Sandbox أو رقم معتمد)
// TWILIO_WHATSAPP_TO     مثال: whatsapp:+201283431213 (رقمك لاستقبال إشعارات الطلبات)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "");

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || ""; // whatsapp:+1...
const TWILIO_TO = process.env.TWILIO_WHATSAPP_TO || "";     // whatsapp:+20...

async function tg(method, body) {
  if (!BOT_TOKEN || !ADMIN_CHAT) return { ok: false, skipped: true, reason: "telegram_not_configured" };
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

function waEnabled() {
  return !!(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && TWILIO_TO);
}

async function sendWhatsApp(text) {
  if (!waEnabled()) return { ok: false, skipped: true, reason: "twilio_not_configured" };
  const body = new URLSearchParams();
  body.set("From", TWILIO_FROM);
  body.set("To", TWILIO_TO);
  // واتساب عبر Twilio: حد طول معقول
  body.set("Body", String(text || "").slice(0, 1500));
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("Twilio WA error", r.status, data);
    return { ok: false, status: r.status, data };
  }
  return { ok: true, sid: data.sid };
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
      const payMap = {
        cod: "عند الاستلام",
        vodafone: "فودافون كاش",
        instapay: "إنستا باي",
        transfer: "تحويل بنكي",
        card: "بطاقة"
      };
      const payRaw = order.paymentMethod || order.payment || "";
      const payLabel = payMap[payRaw] || payRaw || "—";
      const coupon = order.coupon || order.couponCode || c.coupon || "";
      const discount = order.discount != null ? Number(order.discount) : 0;
      const email = c.email || order.email || "";
      const lines = [];
      lines.push("🛒 طلب جديد");
      lines.push("🆔 " + (order.id || "—"));
      if (order.at) lines.push("🕒 " + order.at);
      lines.push("👤 " + (c.name || "—"));
      lines.push("📞 " + (c.phone || "—"));
      if (email) lines.push("✉️ " + email);
      const loc = [c.governorate, c.center, c.address].filter(Boolean).join(" — ");
      lines.push("📍 " + (loc || "—"));
      if (c.note) lines.push("📝 ملاحظة: " + c.note);
      if (c.governorateId) lines.push("🏷️ كود محافظة: " + c.governorateId);
      if (c.centerId) lines.push("🏷️ كود مركز: " + c.centerId);
      lines.push("");
      lines.push("📦 المنتجات:");
      lines.push(itemsText || "—");
      lines.push("");
      if (order.subtotal != null) lines.push("🧮 المنتجات: " + money(order.subtotal));
      if (coupon) lines.push("🏷️ كود الخصم: " + String(coupon).toUpperCase());
      if (discount > 0) lines.push("💸 قيمة الخصم: " + money(discount));
      if (order.shipping != null) lines.push("🚚 الشحن: " + (Number(order.shipping) === 0 ? "مجاني" : money(order.shipping)));
      lines.push("💳 الدفع: " + payLabel);
      lines.push("💰 الإجمالي: " + money(order.total || 0));
      // أي حقول إضافية على الطلب
      const known = new Set(["id","at","subtotal","discount","coupon","couponCode","shipping","customer","items","total","status","paymentMethod","payment","shippingFree","shippingLabel"]);
      Object.keys(order || {}).forEach((k) => {
        if (known.has(k)) return;
        const v = order[k];
        if (v == null || v === "") return;
        if (typeof v === "object") {
          try { lines.push("➕ " + k + ": " + JSON.stringify(v)); } catch (e) {}
        } else {
          lines.push("➕ " + k + ": " + String(v));
        }
      });
      lines.push("✅ تواصل مع العميل للتأكيد");
      let text = lines.join("
");

if (text.length > 4000) text = text.slice(0, 3990) + "…";

      await tg("sendMessage", {
        chat_id: ADMIN_CHAT,
        text,
        disable_web_page_preview: true
      });

      // واتساب Twilio (لو المفاتيح متضبطة على Vercel)
      try {
        const wa = await sendWhatsApp(text);
        if (wa && wa.ok) console.log("WhatsApp sent", wa.sid);
        else if (wa && !wa.skipped) console.warn("WhatsApp failed", wa);
      } catch (e) { console.error("WhatsApp exception", e); }

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

      return res.status(200).json({ ok: true, mode: "order-compact", whatsapp: waEnabled() });
    }

    // رسائل عامة (تسجيل / تواصل)
    if (message) {
      const prefix = type === "register" ? "👤 حساب جديد\n" : (type === "contact" ? "✉️ رسالة\n" : (type === "feedback" ? "💬 رأي عميل جديد\n" : ""));
      const full = (prefix + message).slice(0, 4000);
      await tg("sendMessage", {
        chat_id: ADMIN_CHAT,
        text: full,
        disable_web_page_preview: true
      });
      try { await sendWhatsApp(full); } catch (e) { console.error(e); }
      return res.status(200).json({ ok: true, whatsapp: waEnabled() });
    }

    return res.status(400).json({ error: "message required" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
