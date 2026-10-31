
// /api/admin — unified admin API for NEXORA (GitHub JSON CMS)
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

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
  // GitHub does not return `content` for files larger than 1 MB. Use the raw
  // endpoint as a fallback so large products.json files remain manageable.
  let content = "";
  if (typeof data.content === "string" && data.content.trim()) {
    content = Buffer.from(data.content, "base64").toString("utf8");
  } else {
    const raw = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`, {
      headers: { "User-Agent": "NEXORA-Admin" },
    });
    if (!raw.ok) return null;
    content = await raw.text();
  }
  return { content, sha: data.sha };
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
  return Boolean(ADMIN_SECRET) && String(secret) === String(ADMIN_SECRET);
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

    const publicOrder = req.method === "POST" && action === "save_order";
    // Public order creation is separate from protected admin actions.
    if (!publicOrder && !okAuth(req, body) && req.method !== "GET") {
      return res.status(401).json({ ok: false, error: "غير مصرح" });
    }
    // GET with secret header
    if (req.method === "GET") {
      const secret = req.headers["x-admin-secret"] || "";
      if (String(secret) !== String(ADMIN_SECRET)) return res.status(401).json({ ok: false, error: "غير مصرح" });
    } else if (!publicOrder && !okAuth(req, body)) {
      return res.status(401).json({ ok: false, error: "غير مصرح" });
    }

    if (action === "stats" || (req.method === "GET" && !body.action)) {
      const prodFile = await ghGet("products.json");
      const catFile = await ghGet("categories.json");
      const ordFile = await ghGet("orders.json");
      const expFile = await ghGet("expenses.json");
      let products = [];
      try { products = prodFile ? JSON.parse(prodFile.content) : []; } catch { products = []; }
      if (products && !Array.isArray(products) && products.products) products = products.products;
      if (!Array.isArray(products)) products = [];
      let categories = { categories: [] };
      try { categories = catFile ? JSON.parse(catFile.content) : { categories: [] }; } catch {}
      let orders = [];
      try { orders = ordFile ? JSON.parse(ordFile.content) : []; } catch { orders = []; }
      if (!Array.isArray(orders)) orders = [];
      let expenses = [];
      try { expenses = expFile ? JSON.parse(expFile.content) : []; } catch { expenses = []; }
      if (!Array.isArray(expenses)) expenses = [];

      const period = String(body.period || "all");
      const from = body.from ? new Date(body.from) : null;
      const to = body.to ? new Date(body.to) : null;
      const now = new Date();
      function inPeriod(iso) {
        if (!iso) return period === "all";
        const t = new Date(iso);
        if (period === "today") {
          return t.toDateString() === now.toDateString();
        }
        if (period === "7d") return (now - t) <= 7 * 864e5;
        if (period === "month") return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
        if (period === "prev_month") {
          const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return t.getMonth() === pm.getMonth() && t.getFullYear() === pm.getFullYear();
        }
        if (period === "year") return t.getFullYear() === now.getFullYear();
        if (period === "custom" && from && to) return t >= from && t <= to;
        return true;
      }

      const ordersP = orders.filter(o => inPeriod(o.at));
      const delivered = ordersP.filter(o => ["delivered", "completed"].includes(String(o.status || "")));
      const cancelled = ordersP.filter(o => String(o.status) === "cancelled");
      const pending = ordersP.filter(o => !["delivered", "completed", "cancelled"].includes(String(o.status || "new")));
      const sales = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const shippingRev = delivered.reduce((s, o) => s + (Number(o.shipping) || 0), 0);
      const discounts = delivered.reduce((s, o) => s + (Number(o.discount) || 0), 0);

      // COGS from costPrice * qty on delivered items
      const byId = Object.fromEntries(products.map(p => [String(p.id), p]));
      let cogs = 0, missingCost = 0, unitsSold = 0;
      for (const o of delivered) {
        for (const it of (o.items || [])) {
          const q = Number(it.qty) || 1;
          unitsSold += q;
          const p = byId[String(it.id)];
          const cost = p && p.costPrice != null ? Number(p.costPrice) : null;
          if (cost == null || Number.isNaN(cost)) missingCost += q;
          else cogs += cost * q;
        }
      }

      const expensesP = expenses.filter(e => e.type !== "capital" && inPeriod(e.at));
      const expByCat = {};
      let expTotal = 0;
      for (const e of expensesP) {
        const c = String(e.category || "other");
        const a = Number(e.amount) || 0;
        expByCat[c] = (expByCat[c] || 0) + a;
        expTotal += a;
      }

      let stockUnits = 0, stockValue = 0, stockSellValue = 0, lowStock = 0;
      for (const p of products) {
        if (p.hidden) continue;
        const st = Number(p.stock) || 0;
        stockUnits += st;
        stockValue += st * (Number(p.costPrice) || 0);
        stockSellValue += st * (Number(p.price) || 0);
        if (st > 0 && st <= 3) lowStock++;
        if (st <= 0) lowStock++;
      }

      const gross = sales - cogs;
      const net = gross - expTotal;

      // top products by qty in delivered
      const soldMap = {};
      for (const o of delivered) {
        for (const it of (o.items || [])) {
          const id = String(it.id || it.name);
          if (!soldMap[id]) soldMap[id] = { id: it.id, name: it.name, qty: 0, revenue: 0 };
          soldMap[id].qty += Number(it.qty) || 1;
          soldMap[id].revenue += Number(it.lineTotal) || ((Number(it.price)||0)*(Number(it.qty)||1));
        }
      }
      const topProducts = Object.values(soldMap).sort((a,b)=>b.qty-a.qty).slice(0, 10);

      return res.status(200).json({
        ok: true,
        stats: {
          period,
          products: products.length,
          visibleCategories: (categories.categories || []).filter(c => c.visible !== false).length,
          orders: ordersP.length,
          completed: delivered.length,
          cancelled: cancelled.length,
          pending: pending.length,
          newOrders: ordersP.filter(o => (o.status || "new") === "new").length,
          sales,
          shippingRevenue: shippingRev,
          discounts,
          cogs,
          missingCostUnits: missingCost,
          unitsSold,
          grossProfit: gross,
          expenses: expTotal,
          expensesByCategory: expByCat,
          netProfit: net,
          stockUnits,
          stockValueCost: stockValue,
          stockValueSell: stockSellValue,
          lowStockCount: lowStock,
          topProducts
        }
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
      else if (body.bundle2Price || body.bundle3Price || body.sourceProductId2 || body.offerType === "mixed_bundle") {
        const tiers = [];
        const b2 = Number(body.bundle2Price || 0);
        const b3 = Number(body.bundle3Price || 0);
        if (b2 > 0) tiers.push({ qty: 2, price: Math.round(b2) });
        if (b3 > 0 && body.offerType !== "mixed_bundle") tiers.push({ qty: 3, price: Math.round(b3) });
        const id1 = body.sourceProductId || body.offerMeta?.sourceProductId;
        const id2 = body.sourceProductId2;
        if (body.offerType === "mixed_bundle" && id1 && id2) {
          updated.offerMeta = {
            type: "mixed_bundle",
            sourceProductIds: [String(id1), String(id2)],
            productIds: [String(id1), String(id2)],
            tiers: b2 > 0 ? [{ qty: 2, price: Math.round(b2) }] : (tiers.length ? tiers : [])
          };
          updated.isOffer = true;
          updated.offerType = "mixed_bundle";
          updated.sourceProductId = id1;
          updated.sourceProductId2 = id2;
          if (b2 > 0) updated.price = Math.round(b2);
        } else if (tiers.length) {
          updated.offerMeta = { type: "bundle", tiers, sourceProductId: id1 || undefined };
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
      if (publicOrder) {
        const customer = order.customer || {};
        let phone = String(customer.phone || "").replace(/\D/g, "");
        if (phone.startsWith("20") && phone.length >= 12) phone = phone.slice(2);
        if (!Array.isArray(order.items) || order.items.length < 1 || order.items.length > 50) {
          return res.status(400).json({ ok: false, error: "invalid items" });
        }
        if (!/^\d{10,15}$/.test(phone)) {
          return res.status(400).json({ ok: false, error: "customer phone required" });
        }
        if (!String(customer.address || "").trim()) {
          return res.status(400).json({ ok: false, error: "customer address required" });
        }
        order.id = String(order.id).slice(0, 64);
        order.status = order.status || "new";
        order.at = order.at || new Date().toISOString();
        order.customer = {
          name: String(customer.name || "عميل").slice(0, 120),
          phone,
          email: String(customer.email || "").slice(0, 120),
          address: String(customer.address || "").slice(0, 400),
          note: String(customer.note || "").slice(0, 400),
          governorate: String(customer.governorate || "").slice(0, 80),
          center: String(customer.center || "").slice(0, 80),
          governorateId: String(customer.governorateId || "").slice(0, 40),
          centerId: String(customer.centerId || "").slice(0, 40)
        };
        order.items = order.items.slice(0, 50).map(item => {
          const colors = Array.isArray(item.colors)
            ? item.colors.map(c => String(c).slice(0, 80)).filter(Boolean).slice(0, 20)
            : [];
          const color = String(item.color || colors[0] || "").slice(0, 100);
          return {
            id: Number(item.id) || 0,
            name: String(item.name || "منتج").slice(0, 200),
            qty: Math.max(1, Math.min(99, Number(item.qty) || 1)),
            price: Math.max(0, Number(item.price) || 0),
            lineTotal: Math.max(0, Number(item.lineTotal) || 0),
            color,
            colors,
            image: String(item.image || "").slice(0, 500)
          };
        });
      }

      let put = { ok: false, data: { message: "not attempted" } };
      for (let attempt = 0; attempt < 4; attempt++) {
        const f = await ghGet("orders.json");
        let orders = [];
        try { orders = f ? JSON.parse(f.content) : []; } catch { orders = []; }
        if (!Array.isArray(orders)) orders = [];
        const idx = orders.findIndex(o => String(o.id) === String(order.id));
        if (idx >= 0) orders[idx] = { ...orders[idx], ...order };
        else orders.unshift(order);
        // keep last 500
        if (orders.length > 500) orders = orders.slice(0, 500);
        put = await ghPut("orders.json", JSON.stringify(orders, null, 2), `Order ${order.id}`, f?.sha);
        if (put.ok) break;
        const msg = String(put.data?.message || put.data?.error || "");
        if (!/conflict|sha|does not match/i.test(msg) && put.data?.status !== 409) break;
        await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
      }
      if (!put.ok) return res.status(500).json({ ok: false, error: "تعذر حفظ الطلب", detail: put.data });
      return res.status(200).json({ ok: true, id: order.id });
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
          leaves: s.leaves || 0,
          deviceType: s.deviceType || "other",
          ipMasked: s.ipMasked || "غير متاح"
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
      let orders = [];
      try { orders = f ? JSON.parse(f.content) : []; } catch { orders = []; }
      if (!Array.isArray(orders)) orders = [];
      orders.sort((a, b) => new Date(b.at || b.updatedAt || 0) - new Date(a.at || a.updatedAt || 0));
      return res.status(200).json({ ok: true, orders, total: orders.length });
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

    
    
    
    if (action === "get_coupons") {
      const f = await ghGet("coupons.json");
      if (!f) return res.status(200).json({ ok: true, codes: [] });
      let data = {};
      try { data = JSON.parse(f.content); } catch { data = {}; }
      return res.status(200).json({ ok: true, codes: Array.isArray(data.codes) ? data.codes : [] });
    }

    if (action === "update_coupons") {
      let codes = body.codes;
      if (!Array.isArray(codes)) return res.status(400).json({ ok: false, error: "codes array required" });
      const cleaned = [];
      const seen = new Set();
      for (const row of codes) {
        const code = String(row.code || "").trim().toUpperCase().replace(/\s+/g, "");
        if (!code || code.length < 2) continue;
        if (seen.has(code)) continue;
        seen.add(code);
        let percent = Number(row.percent);
        if (!Number.isFinite(percent)) percent = 0;
        percent = Math.max(0, Math.min(90, Math.round(percent)));
        cleaned.push({
          code,
          percent,
          active: row.active === true || row.active === "true" || row.active === 1 || row.active === "1",
          note: String(row.note || "").slice(0, 120)
        });
      }
      const payload = { codes: cleaned };
      let f = await ghGet("coupons.json");
      const putR = await ghPut("coupons.json", JSON.stringify(payload, null, 2), "Admin: update coupon codes", f?.sha);
      if (!putR.ok) return res.status(500).json({ ok: false, error: "تعذر حفظ الأكواد", detail: putR.data });
      return res.status(200).json({ ok: true, codes: cleaned });
    }

    if (action === "get_shipping_zones") {
      const f = await ghGet("shipping-zones.json");
      if (!f) return res.status(200).json({ ok: true, zones: { enabled: false, defaultFee: 50, freeAbove: 0, governorates: [] } });
      let zones = {};
      try { zones = JSON.parse(f.content); } catch { zones = {}; }
      return res.status(200).json({ ok: true, zones });
    }

    if (action === "update_shipping_zones") {
      const zones = body.zones;
      if (!zones || typeof zones !== "object") return res.status(400).json({ ok: false, error: "zones required" });
      // sanitize lightly
      zones.enabled = zones.enabled === true || zones.enabled === "true";
      zones.defaultFee = Math.max(0, Number(zones.defaultFee) || 0);
      zones.freeAbove = Math.max(0, Number(zones.freeAbove) || 0);
      zones.note = String(zones.note || "").slice(0, 300);
      zones.days = String(zones.days || "").slice(0, 80);
      if (!Array.isArray(zones.governorates)) zones.governorates = [];
      let f = await ghGet("shipping-zones.json");
      const put = await ghPut("shipping-zones.json", JSON.stringify(zones, null, 2), "Admin: update shipping zones", f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "تعذر حفظ مناطق الشحن", detail: put.data });
      return res.status(200).json({ ok: true, zones });
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

      const textFields = ["heroBadge","heroTitle","heroHighlight","heroDesc","heroBtn","heroChipTitle","heroChipSub","vodafoneCash","instapay","instapayLabel","paymentNote","phone","whatsapp","email","siteName","siteTagline","logoMark","favicon","address","footerText","aboutText","ownerName","telegramBot","storeClosedMessage"];
      for (const k of textFields) {
        if (body[k] != null) config[k] = String(body[k]);
      }
      for (const k of ["showFloatWhatsapp","showFloatTelegram","showFloatAI","showContact","showCategories","heroRotateFromProducts","storeOpen"]) {
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
        note: String(body.note || "").slice(0, 500),
        orderId: String(body.orderId || "").slice(0, 64),
        paymentMethod: String(body.paymentMethod || "").slice(0, 40),
        at: body.at ? String(body.at) : new Date().toISOString()
      };
      expenses.unshift(item);
      const put = await ghPut("expenses.json", JSON.stringify(expenses.slice(0, 500), null, 2), `Admin: add expense ${item.id}`, f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "put failed" });
      return res.status(200).json({ ok: true, expense: item });
    }

    
    if (action === "mark_label_printed") {
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : (body.id ? [String(body.id)] : []);
      if (!ids.length) return res.status(400).json({ ok: false, error: "ids required" });
      const f = await ghGet("orders.json");
      let orders = [];
      try { orders = f ? JSON.parse(f.content) : []; } catch { orders = []; }
      if (!Array.isArray(orders)) orders = [];
      const now = new Date().toISOString();
      let n = 0;
      for (const o of orders) {
        if (ids.includes(String(o.id))) {
          o.labelPrinted = true;
          o.labelPrintedAt = now;
          o.labelPrintCount = (Number(o.labelPrintCount) || 0) + 1;
          n++;
        }
      }
      const put = await ghPut("orders.json", JSON.stringify(orders, null, 2), `Labels printed: ${ids.slice(0,5).join(",")}`, f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "save failed", detail: put.data });
      return res.status(200).json({ ok: true, updated: n });
    }

    
    if (action === "update_return_policy") {
      const policy = body.policy;
      if (!policy || typeof policy !== "object") return res.status(400).json({ ok: false, error: "policy required" });
      const clean = {
        title: String(policy.title || "سياسة الاستبدال والاسترجاع").slice(0, 200),
        titleEn: String(policy.titleEn || "Return & Refund Policy").slice(0, 200),
        updatedAt: String(policy.updatedAt || new Date().toISOString().slice(0, 10)).slice(0, 40),
        phone: String(policy.phone || "01064519541").slice(0, 30),
        whatsapp: String(policy.whatsapp || "01283431213").slice(0, 30),
        showInFooter: policy.showInFooter !== false,
        intro: String(policy.intro || "").slice(0, 5000),
        closing: String(policy.closing || "").slice(0, 1000),
        sections: Array.isArray(policy.sections) ? policy.sections.slice(0, 30).map(s => ({
          heading: String(s.heading || "").slice(0, 200),
          body: String(s.body || "").slice(0, 8000)
        })) : []
      };
      const f = await ghGet("return-policy.json");
      const put = await ghPut("return-policy.json", JSON.stringify(clean, null, 2), "Update return policy", f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "save failed", detail: put.data });
      // also reflect footer flag in site-config
      try {
        const sc = await ghGet("site-config.json");
        if (sc) {
          let conf = {};
          try { conf = JSON.parse(sc.content); } catch { conf = {}; }
          conf.showReturnPolicyFooter = clean.showInFooter;
          await ghPut("site-config.json", JSON.stringify(conf, null, 2), "Footer return policy flag", sc.sha);
        }
      } catch (e) {}
      return res.status(200).json({ ok: true });
    }

    
    if (action === "adjust_stock") {
      const id = body.id;
      const delta = Number(body.delta);
      const reason = String(body.reason || "manual").slice(0, 120);
      if (id == null || Number.isNaN(delta)) return res.status(400).json({ ok: false, error: "id and delta required" });
      const f = await ghGet("products.json");
      let products = [];
      try { products = f ? JSON.parse(f.content) : []; } catch { products = []; }
      if (products && !Array.isArray(products) && products.products) products = products.products;
      if (!Array.isArray(products)) products = [];
      const p = products.find(x => String(x.id) === String(id));
      if (!p) return res.status(404).json({ ok: false, error: "product not found" });
      const before = Number(p.stock) || 0;
      const after = Math.max(0, before + delta);
      p.stock = after;
      const put = await ghPut("products.json", JSON.stringify(products, null, 2), `Stock ${id}: ${before}→${after}`, f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "save failed" });
      // log
      try {
        const lf = await ghGet("inventory-log.json");
        let log = [];
        try { log = lf ? JSON.parse(lf.content) : []; } catch { log = []; }
        if (!Array.isArray(log)) log = [];
        log.unshift({ id: "IL-" + Date.now().toString(36), productId: id, name: p.name, before, after, delta, reason, at: new Date().toISOString() });
        if (log.length > 500) log = log.slice(0, 500);
        await ghPut("inventory-log.json", JSON.stringify(log, null, 2), `Inventory log ${id}`, lf?.sha);
      } catch (e) {}
      return res.status(200).json({ ok: true, stock: after });
    }

    if (action === "list_inventory_log") {
      const f = await ghGet("inventory-log.json");
      let log = [];
      try { log = f ? JSON.parse(f.content) : []; } catch { log = []; }
      if (!Array.isArray(log)) log = [];
      return res.status(200).json({ ok: true, log });
    }

    
    if (action === "get_label_templates") {
      const f = await ghGet("label-templates.json");
      let data = { defaultId: "default", templates: [] };
      try { data = f ? JSON.parse(f.content) : data; } catch {}
      if (!data.templates || !data.templates.length) {
        data = { defaultId: "default", templates: [] };
      }
      return res.status(200).json({ ok: true, ...data, rawSha: f?.sha || null });
    }

    if (action === "save_label_templates") {
      const templates = Array.isArray(body.templates) ? body.templates : null;
      if (!templates) return res.status(400).json({ ok: false, error: "templates required" });
      const clean = {
        defaultId: String(body.defaultId || (templates.find(t => t.isDefault)?.id) || templates[0]?.id || "default").slice(0, 80),
        templates: templates.slice(0, 20).map(t => ({
          id: String(t.id || ("tpl-" + Date.now())).slice(0, 80),
          name: String(t.name || "قالب").slice(0, 120),
          isDefault: !!t.isDefault,
          size: String(t.size || "10x15").slice(0, 20),
          customW: Math.max(50, Math.min(300, Number(t.customW) || 100)),
          customH: Math.max(50, Math.min(400, Number(t.customH) || 150)),
          styles: t.styles && typeof t.styles === "object" ? t.styles : {},
          fields: Array.isArray(t.fields) ? t.fields.slice(0, 40) : [],
          customTexts: Array.isArray(t.customTexts) ? t.customTexts.slice(0, 20) : [],
          showBorder: t.showBorder !== false,
          showDivider: t.showDivider !== false
        }))
      };
      const f = await ghGet("label-templates.json");
      const put = await ghPut("label-templates.json", JSON.stringify(clean, null, 2), "Save label templates", f?.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "save failed", detail: put.data });
      return res.status(200).json({ ok: true });
    }

    
    if (action === "update_theme") {
      let f = await ghGet("site-config.json");
      if (!f) return res.status(404).json({ ok: false, error: "site-config missing" });
      let config = {};
      try { config = JSON.parse(f.content); } catch { config = {}; }
      if (body.colors && typeof body.colors === "object") {
        config.colors = { ...(config.colors || {}), ...body.colors };
      }
      if (body.colorsDraft && typeof body.colorsDraft === "object") {
        config.colorsDraft = body.colorsDraft;
      }
      if (body.publish === true && config.colorsDraft) {
        config.colors = { ...(config.colors || {}), ...config.colorsDraft };
      }
      if (body.clearDraft === true) {
        delete config.colorsDraft;
      }
      if (body.themePreset) config.themePreset = String(body.themePreset).slice(0, 40);
      if (body.defaultMode) config.defaultMode = String(body.defaultMode).slice(0, 10);
      if (body.radius != null) {
        config.colors = config.colors || {};
        config.colors.radius = String(body.radius);
      }
      const put = await ghPut("site-config.json", JSON.stringify(config, null, 2), "Update store theme colors", f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "save failed", detail: put.data });
      return res.status(200).json({ ok: true, colors: config.colors, colorsDraft: config.colorsDraft || null });
    }

    return res.status(400).json({ ok: false, error: "unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || "server error" });
  }
}
