
// /api/admin — unified admin API for NEXORA (GitHub JSON CMS)
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "nexora2026";

function parseDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], b64: m[2] };
}

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA-Admin" }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}
async function ghPut(path, content, message, sha, rawBase64) {
  // rawBase64: optional already-base64 binary (for images); content used as utf8 text otherwise
  const encoded = rawBase64
    ? String(rawBase64)
    : Buffer.from(content == null ? "" : content, "utf8").toString("base64");
  const body = { message, content: encoded, branch: "main" };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "NEXORA-Admin"
    },
    body: JSON.stringify(body)
  });
  return { ok: r.ok, data: await r.json() };
}

function okAuth(req, body) {
  const secret = body.secret || req.headers["x-admin-secret"] || "";
  return String(secret) === String(ADMIN_SECRET);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!GH_TOKEN) return res.status(500).json({ ok: false, error: "GITHUB_TOKEN missing" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const action = body.action || req.query?.action || "stats";

    // Public-ish read for dashboard needs secret
    if (!okAuth(req, body) && req.method !== "GET") {
      return res.status(401).json({ ok: false, error: "غير مصرح" });
    }
    // GET with secret header
    if (req.method === "GET") {
      const secret = req.headers["x-admin-secret"] || "";
      if (String(secret) !== String(ADMIN_SECRET)) return res.status(401).json({ ok: false, error: "غير مصرح" });
    } else if (!okAuth(req, body)) {
      return res.status(401).json({ ok: false, error: "غير مصرح" });
    }

    if (action === "stats" || (req.method === "GET" && !body.action)) {
      const prodFile = await ghGet("products.json");
      const catFile = await ghGet("categories.json");
      const ordFile = await ghGet("orders.json");
      const expFile = await ghGet("expenses.json");
      const products = prodFile ? JSON.parse(prodFile.content) : [];
      const categories = catFile ? JSON.parse(catFile.content) : { categories: [] };
      const orders = ordFile ? JSON.parse(ordFile.content) : [];
      const expenses = expFile ? JSON.parse(expFile.content) : [];
      const visibleCats = (categories.categories || []).filter(c => c.visible !== false);
      const deliveredOrders = (orders || []).filter(o => ["delivered", "completed"].includes(o.status));
      const completed = deliveredOrders.length;
      const cancelled = (orders || []).filter(o => o.status === "cancelled").length;
      const newOrders = (orders || []).filter(o => o.status === "new" || !o.status).length;
      const sales = deliveredOrders.reduce((s, o) => s + Number(o.total || 0), 0);
      const pendingSales = (orders || [])
        .filter(o => !["delivered", "completed", "cancelled"].includes(o.status || "new"))
        .reduce((s, o) => s + Number(o.total || 0), 0);

      // تكلفة البضاعة من سعر الشراء (costPrice) للطلبات المسلّمة
      const productMap = new Map((products || []).map(p => [String(p.id), p]));
      let cogs = 0;
      let grossProfit = 0;
      for (const o of deliveredOrders) {
        for (const it of (o.items || [])) {
          const qty = Number(it.qty) || 1;
          const sell = Number(it.price != null ? it.price : 0);
          let cost = Number(it.costPrice != null ? it.costPrice : NaN);
          if (Number.isNaN(cost)) {
            const p = productMap.get(String(it.id));
            cost = p ? Number(p.costPrice || 0) : 0;
          }
          cogs += cost * qty;
          grossProfit += (sell - cost) * qty;
        }
      }

      const expList = expenses || [];
      const capitalTotal = expList.filter(e => e.type === "capital").reduce((s, e) => s + Number(e.amount || 0), 0);
      const expTotal = expList.filter(e => e.type !== "capital").reduce((s, e) => s + Number(e.amount || 0), 0);
      // صافي الربح = (سعر البيع − سعر الشراء) للمسلّم − المصروفات التشغيلية (بدون رأس المال)
      const profit = grossProfit - expTotal;
      return res.status(200).json({
        ok: true,
        stats: {
          products: products.length,
          visibleCategories: visibleCats.length,
          totalCategories: (categories.categories || []).length,
          orders: (orders || []).length,
          newOrders,
          completed,
          cancelled,
          sales,
          pendingSales,
          cogs,
          grossProfit,
          capital: capitalTotal,
          expenses: expTotal,
          profit,
          lowStock: products.filter(p => Number(p.stock || 999) < 5).length
        },
        recentOrders: (orders || []).slice(0, 10)
      });
    }

    if (action === "list_products") {
      const f = await ghGet("products.json");
      const products = f ? JSON.parse(f.content) : [];
      return res.status(200).json({ ok: true, products, total: products.length });
    }

    if (action === "delete_product") {
      const id = Number(body.id);
      const f = await ghGet("products.json");
      if (!f) return res.status(404).json({ ok: false, error: "products missing" });
      let products = JSON.parse(f.content);
      const before = products.length;
      products = products.filter(p => Number(p.id) !== id);
      if (products.length === before) return res.status(404).json({ ok: false, error: "product not found" });
      const put = await ghPut("products.json", JSON.stringify(products, null, 2), `Admin: delete product #${id}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "github put failed" });
      return res.status(200).json({ ok: true, total: products.length });
    }

    
    if (action === "update_product") {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ ok: false, error: "id required" });
      const f = await ghGet("products.json");
      if (!f) return res.status(404).json({ ok: false, error: "products missing" });
      let products = [];
      try { products = JSON.parse(f.content); } catch { products = []; }
      if (!Array.isArray(products)) products = [];
      const idx = products.findIndex(p => Number(p.id) === id);
      if (idx < 0) return res.status(404).json({ ok: false, error: "product not found" });
      const prev = products[idx] || {};
      const name = String(body.name || prev.name || "").trim();
      if (!name) return res.status(400).json({ ok: false, error: "name required" });
      let price = Number(body.price);
      if (!Number.isFinite(price)) price = Number(prev.price) || 0;
      let oldPrice = body.oldPrice != null && body.oldPrice !== "" ? Number(body.oldPrice) : prev.oldPrice;
      if (oldPrice != null && !Number.isFinite(Number(oldPrice))) oldPrice = prev.oldPrice;
      let image = String(body.image || prev.image || "").trim();
      let images = Array.isArray(body.images) ? body.images.filter(Boolean) : (prev.images || []);
      // upload data-url images if any
      const finalImages = [];
      for (let i = 0; i < (images || []).length && finalImages.length < 8; i++) {
        const im = images[i];
        if (typeof im !== "string") continue;
        if (im.startsWith("http://") || im.startsWith("https://")) {
          finalImages.push(im);
          continue;
        }
        if (im.startsWith("data:image/")) {
          try {
            const m = im.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!m) continue;
            const ext = (m[1] === "jpeg" ? "jpg" : m[1]).replace("svg+xml", "svg");
            const b64 = m[2];
            const imgPath = `product-images/${id}_${finalImages.length + 1}.${ext}`;
            const up = await ghPut(imgPath, null, `admin: update image ${id}`, null, b64);
            if (up && up.ok) {
              finalImages.push(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${imgPath}?t=${Date.now()}`);
            }
          } catch (e) { console.error(e); }
        }
      }
      if (finalImages.length) {
        images = finalImages;
        image = finalImages[0];
      } else if (image && (!images || !images.length)) {
        images = [image];
      }
      // colors
      let colors = prev.colors || [];
      if (Array.isArray(body.colors)) colors = body.colors;
      else if (typeof body.colors === "string" && body.colors.trim()) {
        colors = body.colors.split(/[,،]/).map(s => s.trim()).filter(Boolean).map(name => ({ name, code: "#888888" }));
      }
      const stock = body.stock != null && body.stock !== "" ? Number(body.stock) : prev.stock;
      const available = body.available != null ? !!body.available : (prev.available !== false);
      const updated = {
        ...prev,
        name,
        price,
        oldPrice: oldPrice != null && Number(oldPrice) > 0 ? Number(oldPrice) : (prev.oldPrice || null),
        costPrice: body.costPrice != null && body.costPrice !== "" ? Number(body.costPrice) : prev.costPrice,
        category: body.category != null ? String(body.category) : prev.category,
        subcategory: body.subcategory != null ? String(body.subcategory) : prev.subcategory,
        brand: body.brand != null ? String(body.brand) : prev.brand,
        description: body.description != null ? String(body.description) : prev.description,
        image: image || prev.image,
        images: (images && images.length) ? images : (prev.images || (prev.image ? [prev.image] : [])),
        colors,
        stock: Number.isFinite(stock) ? stock : prev.stock,
        available,
        badge: body.badge != null ? String(body.badge) : prev.badge,
        updatedAt: new Date().toISOString()
      };
      // offer fields if provided
      if (body.isOffer != null) updated.isOffer = !!body.isOffer;
      if (body.offerType) updated.offerType = String(body.offerType);
      if (body.sourceProductId) updated.sourceProductId = body.sourceProductId;
      if (body.offerMeta) updated.offerMeta = body.offerMeta;
      else if (body.bundle2Price || body.bundle3Price) {
        const tiers = [];
        const b2 = Number(body.bundle2Price || 0);
        const b3 = Number(body.bundle3Price || 0);
        if (b2 > 0) tiers.push({ qty: 2, price: Math.round(b2) });
        if (b3 > 0) tiers.push({ qty: 3, price: Math.round(b3) });
        if (tiers.length) {
          updated.offerMeta = { type: "bundle", tiers };
          updated.isOffer = true;
        }
      }
      products[idx] = updated;
      const put = await ghPut("products.json", JSON.stringify(products, null, 2), `Admin: update product #${id}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: put.data?.message || "فشل الحفظ" });
      return res.status(200).json({ ok: true, product: updated });
    }


    if (action === "toggle_product") {
      const id = Number(body.id);
      const f = await ghGet("products.json");
      if (!f) return res.status(404).json({ ok: false, error: "products missing" });
      const products = JSON.parse(f.content);
      const p = products.find(x => Number(x.id) === id);
      if (!p) return res.status(404).json({ ok: false, error: "not found" });
      p.hidden = !p.hidden;
      const put = await ghPut("products.json", JSON.stringify(products, null, 2), `Admin: toggle product #${id}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed" });
      return res.status(200).json({ ok: true, product: p });
    }

    if (action === "list_categories") {
      const f = await ghGet("categories.json");
      const data = f ? JSON.parse(f.content) : { categories: [] };
      return res.status(200).json({ ok: true, ...data });
    }

    if (action === "toggle_category") {
      const id = String(body.id || "");
      const f = await ghGet("categories.json");
      if (!f) return res.status(404).json({ ok: false, error: "categories missing" });
      const data = JSON.parse(f.content);
      const c = (data.categories || []).find(x => x.id === id);
      if (!c) return res.status(404).json({ ok: false, error: "category not found" });
      // visible defaults true if undefined
      const now = c.visible === false ? true : false;
      c.visible = now;
      const put = await ghPut("categories.json", JSON.stringify(data, null, 2), `Admin: toggle category ${id} -> ${now}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed", detail: put.data });
      return res.status(200).json({ ok: true, category: c });
    }

    if (action === "set_subcategory_visible") {
      const catId = String(body.categoryId || body.catId || "");
      const subId = String(body.subId || body.id || "");
      const visible = body.visible === true || body.visible === "true" || body.visible === 1;
      const f = await ghGet("categories.json");
      if (!f) return res.status(404).json({ ok: false, error: "categories missing" });
      const data = JSON.parse(f.content);
      const c = (data.categories || []).find(x => x.id === catId);
      if (!c) return res.status(404).json({ ok: false, error: "category not found" });
      const s = (c.subs || []).find(x => x.id === subId);
      if (!s) return res.status(404).json({ ok: false, error: "subcategory not found" });
      s.visible = !!visible;
      const put = await ghPut("categories.json", JSON.stringify(data, null, 2), `Admin: sub ${catId}/${subId} visible=${s.visible}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed", detail: put.data });
      return res.status(200).json({ ok: true, subcategory: s, categoryId: catId });
    }

    if (action === "toggle_subcategory") {
      const catId = String(body.categoryId || body.catId || "");
      const subId = String(body.subId || body.id || "");
      const f = await ghGet("categories.json");
      if (!f) return res.status(404).json({ ok: false, error: "categories missing" });
      const data = JSON.parse(f.content);
      const c = (data.categories || []).find(x => x.id === catId);
      if (!c) return res.status(404).json({ ok: false, error: "category not found" });
      const s = (c.subs || []).find(x => x.id === subId);
      if (!s) return res.status(404).json({ ok: false, error: "subcategory not found" });
      s.visible = s.visible === false ? true : false;
      const put = await ghPut("categories.json", JSON.stringify(data, null, 2), `Admin: toggle sub ${catId}/${subId} -> ${s.visible}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed" });
      return res.status(200).json({ ok: true, subcategory: s, categoryId: catId });
    }

    if (action === "set_category_visible") {
      const id = String(body.id || "");
      const visible = !!body.visible;
      const f = await ghGet("categories.json");
      if (!f) return res.status(404).json({ ok: false, error: "categories missing" });
      const data = JSON.parse(f.content);
      const c = (data.categories || []).find(x => x.id === id);
      if (!c) return res.status(404).json({ ok: false, error: "not found" });
      c.visible = visible;
      const put = await ghPut("categories.json", JSON.stringify(data, null, 2), `Admin: set ${id} visible=${visible}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed" });
      return res.status(200).json({ ok: true, category: c });
    }

    if (action === "save_order") {
      const order = body.order;
      if (!order || !order.id) return res.status(400).json({ ok: false, error: "order required" });
      const f = await ghGet("orders.json");
      const orders = f ? JSON.parse(f.content) : [];
      const idx = orders.findIndex(o => String(o.id) === String(order.id));
      if (idx >= 0) orders[idx] = order; else orders.unshift(order);
      const put = await ghPut("orders.json", JSON.stringify(orders.slice(0, 300), null, 2), `Order ${order.id}`, f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "save failed" });
      return res.status(200).json({ ok: true });
    }

    if (action === "list_accounts") {
      const f = await ghGet("accounts.json");
      let accounts = [];
      try { accounts = f ? JSON.parse(f.content) : []; } catch { accounts = []; }
      if (!Array.isArray(accounts)) accounts = [];
      return res.status(200).json({ ok: true, accounts });
    }

    if (action === "list_visitors") {
      const f = await ghGet("visitors.json");
      let data = { stats: {}, sessions: {}, recent: [] };
      try { data = f ? JSON.parse(f.content) : data; } catch {}
      const sessions = data.sessions || {};
      const now = Date.now();
      let online = 0;
      const sessionList = Object.entries(sessions).map(([id, s]) => {
        const last = new Date(s.lastSeen || 0).getTime();
        const isOnline = s.status !== "left" && (now - last < 3 * 60 * 1000);
        if (isOnline) online++;
        return {
          id: id.slice(0, 12) + "…",
          path: s.path || "/",
          status: isOnline ? "online" : (s.status || "left"),
          firstSeen: s.firstSeen,
          lastSeen: s.lastSeen,
          enters: s.enters || 0,
          leaves: s.leaves || 0
        };
      }).sort((a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0));
      const stats = data.stats || {};
      stats.onlineNow = online;
      return res.status(200).json({
        ok: true,
        stats,
        recent: Array.isArray(data.recent) ? data.recent.slice(0, 50) : [],
        sessions: sessionList.slice(0, 100)
      });
    }

    if (action === "delete_account") {
      const email = String(body.email || "").toLowerCase().trim();
      if (!email) return res.status(400).json({ ok: false, error: "email required" });
      const f = await ghGet("accounts.json");
      let accounts = [];
      try { accounts = f ? JSON.parse(f.content) : []; } catch { accounts = []; }
      accounts = (Array.isArray(accounts) ? accounts : []).filter(u => String(u.email || "").toLowerCase() !== email);
      const put = await ghPut("accounts.json", JSON.stringify(accounts, null, 2), "admin: delete account", f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: put.data?.message || "fail" });
      return res.status(200).json({ ok: true, accounts });
    }

    if (action === "list_orders") {
      const f = await ghGet("orders.json");
      const orders = f ? JSON.parse(f.content) : [];
      return res.status(200).json({ ok: true, orders });
    }

    if (action === "delete_order") {
      const id = String(body.id || body.orderId || "");
      if (!id) return res.status(400).json({ ok: false, error: "id required" });
      const f = await ghGet("orders.json");
      if (!f) return res.status(200).json({ ok: true, total: 0 });
      let orders = [];
      try { orders = JSON.parse(f.content); } catch { orders = []; }
      const next = orders.filter(x => String(x.id) !== id);
      const put = await ghPut("orders.json", JSON.stringify(next, null, 2), `Admin: delete order ${id}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "تعذر الحذف", detail: put.data });
      return res.status(200).json({ ok: true, total: next.length });
    }

    if (action === "clear_orders") {
      const f = await ghGet("orders.json");
      const put = await ghPut("orders.json", "[]", "Admin: clear all orders", f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "تعذر مسح الطلبات", detail: put.data });
      return res.status(200).json({ ok: true, total: 0 });
    }

    if (action === "update_order_status") {
      const id = String(body.id || "");
      const status = String(body.status || "new");
      const f = await ghGet("orders.json");
      if (!f) return res.status(404).json({ ok: false, error: "no orders file" });
      const orders = JSON.parse(f.content);
      const o = orders.find(x => String(x.id) === id);
      if (!o) return res.status(404).json({ ok: false, error: "order not found" });
      o.status = status;
      o.updatedAt = new Date().toISOString();
      if (!o.timeline) o.timeline = [];
      o.timeline.push({ at: o.updatedAt, status, note: body.note || "" });
      const put = await ghPut("orders.json", JSON.stringify(orders, null, 2), `Admin: order ${id} -> ${status}`, f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed" });
      return res.status(200).json({ ok: true, order: o });
    }

    
    if (action === "update_shipping") {
      let f = await ghGet("site-config.json");
      if (!f) return res.status(404).json({ ok: false, error: "site-config missing" });
      let config = {};
      try { config = JSON.parse(f.content); } catch { config = {}; }
      config.shippingEnabled = body.shippingEnabled === true || body.shippingEnabled === "true" || body.shippingEnabled === 1 || body.shippingEnabled === "1";
      const fee = Number(body.shippingFee);
      config.shippingFee = Number.isFinite(fee) && fee >= 0 ? fee : 0;
      const freeAbove = Number(body.shippingFreeAbove);
      config.shippingFreeAbove = Number.isFinite(freeAbove) && freeAbove > 0 ? freeAbove : 0;
      config.shippingNote = String(body.shippingNote || "").slice(0, 300);
      config.shippingDays = String(body.shippingDays || "").slice(0, 80);
      f = await ghGet("site-config.json");
      const put = await ghPut("site-config.json", JSON.stringify(config, null, 2), "Admin: update shipping settings", f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "تعذر حفظ الشحن", detail: put.data });
      return res.status(200).json({ ok: true, config });
    }

    if (action === "get_config") {
      const f = await ghGet("site-config.json");
      const config = f ? JSON.parse(f.content) : {};
      return res.status(200).json({ ok: true, config });
    }

    if (action === "update_hero") {
      // always read latest sha
      let f = await ghGet("site-config.json");
      if (!f) return res.status(404).json({ ok: false, error: "site-config missing" });
      let config = {};
      try { config = JSON.parse(f.content); } catch { config = {}; }

      const textFields = ["heroBadge","heroTitle","heroHighlight","heroDesc","heroBtn","heroChipTitle","heroChipSub","vodafoneCash","instapay","instapayLabel","paymentNote","phone","whatsapp","email","siteName","siteTagline","logoMark","favicon","address","footerText","aboutText","ownerName","telegramBot"];
      for (const k of textFields) {
        if (body[k] != null) config[k] = String(body[k]);
      }
      for (const k of ["showFloatWhatsapp","showFloatTelegram","showFloatAI","showContact","showCategories","heroRotateFromProducts"]) {
        if (body[k] != null) config[k] = body[k] === true || body[k] === "true" || body[k] === 1 || body[k] === "1";
      }
      if (body.heroRotateSeconds != null) {
        const sec = Math.max(2, Math.min(60, Number(body.heroRotateSeconds) || 5));
        config.heroRotateSeconds = sec;
      }

      async function saveImage(dataOrUrl, key) {
        const val = dataOrUrl == null ? "" : String(dataOrUrl).trim();
        if (!val) return;
        if (val.startsWith("http://") || val.startsWith("https://")) {
          config[key] = val;
          return;
        }
        if (!val.startsWith("data:image/")) return;
        const parsed = parseDataUrl(val);
        if (!parsed) return;
        const ext = parsed.mime.includes("png") ? "png" : (parsed.mime.includes("webp") ? "webp" : "jpg");
        const path = `product-images/${key}.${ext}`;
        const existing = await ghGet(path);
        const putBody = {
          message: `Admin: hero ${key}`,
          content: parsed.b64,
          branch: "main"
        };
        if (existing?.sha) putBody.sha = existing.sha;
        const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GH_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "NEXORA-Admin"
          },
          body: JSON.stringify(putBody)
        });
        if (r.ok) {
          config[key] = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`;
        } else {
          const err = await r.json().catch(() => ({}));
          console.error("hero image upload failed", key, err);
        }
      }

      await saveImage(body.heroImage1, "heroImage1");
      await saveImage(body.heroImage2, "heroImage2");
      // favicon can be data URL or http URL
      if (body.favicon != null && String(body.favicon).trim()) {
        const fv = String(body.favicon).trim();
        if (fv.startsWith("data:image/")) {
          const parsed = parseDataUrl(fv);
          if (parsed) {
            const ext = parsed.mime.includes("png") ? "png" : (parsed.mime.includes("svg") ? "svg" : (parsed.mime.includes("webp") ? "webp" : "jpg"));
            const path = `product-images/favicon.${ext}`;
            const existing = await ghGet(path);
            const putBody = { message: "Admin: favicon", content: parsed.b64, branch: "main" };
            if (existing?.sha) putBody.sha = existing.sha;
            const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${GH_TOKEN}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "NEXORA-Admin"
              },
              body: JSON.stringify(putBody)
            });
            if (r.ok) config.favicon = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`;
          }
        } else if (fv.startsWith("http://") || fv.startsWith("https://") || fv.startsWith("/")) {
          config.favicon = fv;
        }
      }

      // re-fetch sha in case image uploads changed nothing on config but concurrent edits
      f = await ghGet("site-config.json");
      const put = await ghPut("site-config.json", JSON.stringify(config, null, 2), "Admin: update hero/storefront", f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "تعذر حفظ الإعدادات", detail: put.data });
      return res.status(200).json({ ok: true, config });
    }

    if (action === "list_expenses") {
      const f = await ghGet("expenses.json");
      const expenses = f ? JSON.parse(f.content) : [];
      return res.status(200).json({ ok: true, expenses });
    }

    if (action === "delete_expense") {
      const id = String(body.id || "").trim();
      if (!id) return res.status(400).json({ ok: false, error: "id required" });
      const f = await ghGet("expenses.json");
      let expenses = [];
      try { expenses = f ? JSON.parse(f.content) : []; } catch { expenses = []; }
      if (!Array.isArray(expenses)) expenses = [];
      const next = expenses.filter( ex => String(ex.id) !== id);
      const put = await ghPut("expenses.json", JSON.stringify(next, null, 2), `Admin: delete expense ${id}`, f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: put.data?.message || "فشل الحذف" });
      return res.status(200).json({ ok: true, expenses: next });
    }

    if (action === "add_expense") {
      const f = await ghGet("expenses.json");
      const expenses = f ? JSON.parse(f.content) : [];
      const expType = String(body.type || "expense") === "capital" ? "capital" : "expense";
      const item = {
        id: "EX-" + Date.now().toString(36),
        type: expType,
        amount: Number(body.amount) || 0,
        category: String(body.category || "other"),
        description: String(body.description || ""),
        at: new Date().toISOString()
      };
      expenses.unshift(item);
      const put = await ghPut("expenses.json", JSON.stringify(expenses.slice(0, 500), null, 2), `Admin: add expense ${item.id}`, f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed" });
      return res.status(200).json({ ok: true, expense: item });
    }

    return res.status(400).json({ ok: false, error: "unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || "server error" });
  }
}
