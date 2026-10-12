const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const SITE_URL = process.env.SITE_URL || "https://nexoraegypt.vercel.app";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "6746972381");

async function notify(text) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: "HTML" })
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      stripeEnabled: Boolean(STRIPE_SECRET),
      methods: ["cod", "transfer"].concat(STRIPE_SECRET ? ["card"] : [])
    });
  }

  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const method = String(body.method || "cod").toLowerCase();
    const order = body.order || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const total = Number(order.total || 0);
    const orderId = order.id || ("NX-" + Date.now().toString().slice(-8));
    const customer = order.customer || {};

    if (method === "card") {
      if (!STRIPE_SECRET) {
        return res.status(400).json({
          ok: false,
          error: "الدفع بالبطاقة غير مفعّل بعد. أضف STRIPE_SECRET_KEY في Vercel."
        });
      }
      // Amount in EGP — Stripe may use egp if enabled; fallback smallest currency unit
      const line_items = items.map((it) => ({
        price_data: {
          currency: "egp",
          product_data: { name: String(it.name || "منتج").slice(0, 120) },
          unit_amount: Math.max(100, Math.round(Number(it.price || 0) * 100))
        },
        quantity: Math.max(1, Number(it.qty || 1))
      }));
      if (!line_items.length) {
        line_items.push({
          price_data: {
            currency: "egp",
            product_data: { name: "طلب NEXORA " + orderId },
            unit_amount: Math.max(100, Math.round(total * 100))
          },
          quantity: 1
        });
      }

      const params = new URLSearchParams();
      params.set("mode", "payment");
      params.set("success_url", SITE_URL + "/?paid=1&order=" + encodeURIComponent(orderId));
      params.set("cancel_url", SITE_URL + "/?paid=0&order=" + encodeURIComponent(orderId));
      params.set("client_reference_id", orderId);
      params.set("customer_email", customer.email || "");
      params.set("metadata[orderId]", orderId);
      params.set("metadata[phone]", customer.phone || "");
      params.set("metadata[name]", customer.name || "");
      line_items.forEach((li, i) => {
        params.set(`line_items[${i}][price_data][currency]`, li.price_data.currency);
        params.set(`line_items[${i}][price_data][product_data][name]`, li.price_data.product_data.name);
        params.set(`line_items[${i}][price_data][unit_amount]`, String(li.price_data.unit_amount));
        params.set(`line_items[${i}][quantity]`, String(li.quantity));
      });

      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + STRIPE_SECRET,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
      const data = await r.json();
      if (!r.ok) {
        return res.status(400).json({ ok: false, error: data.error?.message || "فشل إنشاء جلسة الدفع" });
      }
      await notify("💳 <b>جلسة دفع Stripe</b>\nطلب: " + orderId + "\nالمبلغ: " + total + " ج.م\nالعميل: " + (customer.name || ""));
      return res.status(200).json({ ok: true, method: "card", url: data.url, sessionId: data.id, orderId });
    }

    // COD or transfer — order already handled client-side; just ack
    await notify(
      (method === "transfer" ? "🏦" : "💵") +
      " <b>طلب جديد — " + (method === "transfer" ? "تحويل" : "عند الاستلام") + "</b>\n" +
      "🆔 " + orderId + "\n💰 " + total + " ج.م\n👤 " + (customer.name || "") +
      "\n📞 " + (customer.phone || "") + "\n📍 " + (customer.address || "")
    );
    return res.status(200).json({ ok: true, method, orderId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
