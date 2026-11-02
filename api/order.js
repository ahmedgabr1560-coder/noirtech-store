// /api/order — حفظ الطلبات من المتجر (عام) بدون كلمة سر الأدمن

// Rate limit بسيط في ذاكرة الدالة (لكل instance)
const __rl = globalThis.__ATHAR_RL_ORDER || (globalThis.__ATHAR_RL_ORDER = new Map());
function clientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "");
  return (xf.split(",")[0] || "").trim() || "unknown";
}
function rateLimit(req, limit, windowMs) {
  const key = clientIp(req);
  const now = Date.now();
  let row = __rl.get(key);
  if (!row || now - row.start > windowMs) {
    row = { start: now, count: 0 };
  }
  row.count += 1;
  __rl.set(key, row);
  if (row.count > limit) return false;
  return true;
}

const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA-Order" }
  });
  if (!r.ok) return null;
  const data = await r.json();
  let content = "";
  if (typeof data.content === "string" && data.content.trim()) {
    content = Buffer.from(data.content, "base64").toString("utf8");
  } else {
    const raw = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`, {
      headers: { "User-Agent": "NEXORA-Order" }
    });
    if (!raw.ok) return null;
    content = await raw.text();
  }
  return { content, sha: data.sha };
}

async function ghPut(path, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: "main"
  };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "NEXORA-Order"
    },
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function normalizePhone(v) {
  let phone = String(v || "").replace(/\D/g, "");
  if (phone.startsWith("20") && phone.length >= 12) phone = phone.slice(2);
  if (phone.length === 10 && phone.startsWith("1")) phone = "0" + phone;
  return phone;
}

function sanitizeOrder(order) {
  const customer = order.customer || {};
  const phone = normalizePhone(customer.phone);
  const itemsIn = Array.isArray(order.items) ? order.items : [];
  if (!order.id) return { error: "order id required" };
  if (!itemsIn.length) return { error: "items required" };
  if (!phone || phone.length < 10) return { error: "phone required" };
  const address = String(customer.address || "").trim();
  if (!address) return { error: "address required" };
  const name = String(customer.name || "").trim();
  if (!name || name.length < 2) return { error: "name required" };
  if (address.length < 5) return { error: "address too short" };
  if (itemsIn.length > 40) return { error: "too many items" };

  const items = itemsIn.slice(0, 50).map((item) => {
    const colors = Array.isArray(item.colors)
      ? item.colors.map((c) => String(c).slice(0, 80)).filter(Boolean).slice(0, 20)
      : [];
    return {
      id: Number(item.id) || 0,
      name: String(item.name || "منتج").slice(0, 200),
      qty: Math.max(1, Math.min(99, Number(item.qty) || 1)),
      price: Math.max(0, Number(item.price) || 0),
      lineTotal: Math.max(0, Number(item.lineTotal) || 0),
      color: String(item.color || colors[0] || "").slice(0, 100),
      colors,
      image: String(item.image || "").slice(0, 500)
    };
  });

  return {
    order: {
      id: String(order.id).slice(0, 64),
      at: order.at || new Date().toISOString(),
      status: order.status || "new",
      subtotal: Number(order.subtotal) || 0,
      discount: Number(order.discount) || 0,
      coupon: String(order.coupon || "").slice(0, 40),
      shipping: Number(order.shipping) || 0,
      total: Number(order.total) || 0,
      paymentMethod: String(order.paymentMethod || "cod").slice(0, 30),
      customer: {
        name: String(customer.name || "عميل").slice(0, 120),
        phone,
        email: String(customer.email || "").slice(0, 120),
        address: address.slice(0, 400),
        note: String(customer.note || "").slice(0, 400),
        governorate: String(customer.governorate || "").slice(0, 80),
        center: String(customer.center || "").slice(0, 80),
        governorateId: String(customer.governorateId || "").slice(0, 40),
        centerId: String(customer.centerId || "").slice(0, 40)
      },
      items
    }
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!GH_TOKEN) return res.status(500).json({ ok: false, error: "GITHUB_TOKEN missing" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const raw = body.order || body;
    const cleaned = sanitizeOrder(raw);
    if (cleaned.error) return res.status(400).json({ ok: false, error: cleaned.error });
    const order = cleaned.order;

    let put = { ok: false, data: {} };
    for (let attempt = 0; attempt < 5; attempt++) {
      const f = await ghGet("orders.json");
      let orders = [];
      try { orders = f ? JSON.parse(f.content) : []; } catch { orders = []; }
      if (!Array.isArray(orders)) orders = [];
      const idx = orders.findIndex((o) => String(o.id) === String(order.id));
      if (idx >= 0) orders[idx] = { ...orders[idx], ...order };
      else orders.unshift(order);
      if (orders.length > 500) orders = orders.slice(0, 500);
      put = await ghPut("orders.json", JSON.stringify(orders, null, 2), `Order ${order.id}`, f?.sha);
      if (put.ok) break;
      const msg = String(put.data?.message || "");
      if (!/conflict|sha|does not match/i.test(msg) && put.status !== 409) break;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }

    if (!put.ok) return res.status(500).json({ ok: false, error: "save failed", detail: put.data });

    // إشعار تيليجرام احتياطي من السيرفر (لو العميل فشل)
    try {
      const BOT = process.env.TELEGRAM_BOT_TOKEN || "";
      const CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "");
      if (BOT && CHAT && order) {
        const items = Array.isArray(order.items) ? order.items : [];
        const lines = items.slice(0, 20).map((it, i) => {
          const n = it.name || it.title || "منتج";
          const q = it.qty || it.quantity || 1;
          const c = it.color || it.selectedColor || "";
          return `${i + 1}) ${n} × ${q}${c ? " | لون: " + c : ""}`;
        }).join("\n");
        const text = [
          "🛒 طلب جديد — ATHAR | أثر",
          `رقم: ${order.id || "-"}`,
          `الاسم: ${order.name || order.customerName || "-"}`,
          `هاتف: ${order.phone || "-"}`,
          `المحافظة: ${order.governorate || order.gov || "-"}`,
          `العنوان: ${order.address || "-"}`,
          `الدفع: ${order.paymentMethod || order.payment || "-"}`,
          `الكوبون: ${order.coupon || order.couponCode || "-"}`,
          `الإجمالي: ${order.total || order.grandTotal || "-"}`,
          "",
          "المنتجات:",
          lines || "-",
          order.note ? ("ملاحظة: " + order.note) : ""
        ].filter(Boolean).join("\n");
        await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT, text: text.slice(0, 4000) })
        }).catch(() => {});
      }
    } catch (eTg) {}

    return res.status(200).json({ ok: true, id: order.id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "server error" });
  }
}
