
// /api/admin — unified admin API for NEXORA (GitHub JSON CMS)
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
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
async function ghPut(path, content, message, sha) {
  const body = { message, content: Buffer.from(content, "utf8").toString("base64"), branch: "main" };
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
      const sales = (orders || []).reduce((s, o) => s + Number(o.total || 0), 0);
      const completed = (orders || []).filter(o => ["delivered", "completed"].includes(o.status)).length;
      const cancelled = (orders || []).filter(o => o.status === "cancelled").length;
      const newOrders = (orders || []).filter(o => o.status === "new" || !o.status).length;
      const expTotal = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
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
          expenses: expTotal,
          profit: sales - expTotal,
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

    if (action === "list_orders") {
      const f = await ghGet("orders.json");
      const orders = f ? JSON.parse(f.content) : [];
      return res.status(200).json({ ok: true, orders });
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

    if (action === "get_config") {
      const f = await ghGet("site-config.json");
      const config = f ? JSON.parse(f.content) : {};
      return res.status(200).json({ ok: true, config });
    }

    if (action === "update_hero") {
      const f = await ghGet("site-config.json");
      if (!f) return res.status(404).json({ ok: false, error: "site-config missing" });
      const config = JSON.parse(f.content);
      const fields = ["heroBadge","heroTitle","heroHighlight","heroDesc","heroBtn","heroChipTitle","heroChipSub","heroImage1","heroImage2"];
      for (const k of fields) {
        if (body[k] != null && String(body[k]).trim() !== "") config[k] = String(body[k]).trim();
      }
      // optional base64 uploads
      async function upImg(dataUrl, name) {
        if (!dataUrl || !String(dataUrl).startsWith("data:image/")) return null;
        const parsed = parseDataUrl(dataUrl);
        if (!parsed) return null;
        const ext = parsed.mime.includes("png") ? "png" : "jpg";
        const path = `product-images/hero-${name}.${ext}`;
        const up = await ghPut(path, null, `Admin hero ${name}`, null, parsed.b64);
        // ghPut signature in admin may not support binary - check
        return up;
      }
      // handle image1/2 as data urls into github
      for (const key of ["heroImage1", "heroImage2"]) {
        const val = body[key];
        if (val && String(val).startsWith("data:image/")) {
          const parsed = parseDataUrl(val);
          if (parsed) {
            const ext = parsed.mime.includes("png") ? "png" : "jpg";
            const path = `product-images/${key}.${ext}`;
            // put binary
            const bodyPut = {
              message: `Admin: update ${key}`,
              content: parsed.b64,
              branch: "main"
            };
            // need sha if exists
            const existing = await ghGet(path);
            if (existing?.sha) bodyPut.sha = existing.sha;
            const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${GH_TOKEN}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "NEXORA-Admin"
              },
              body: JSON.stringify(bodyPut)
            });
            if (r.ok) {
              config[key] = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`;
            }
          }
        }
      }
      const put = await ghPut("site-config.json", JSON.stringify(config, null, 2), "Admin: update hero", f.sha);
      if (!put.ok) return res.status(500).json({ ok: false, error: "save failed", detail: put.data });
      return res.status(200).json({ ok: true, config });
    }

    if (action === "list_expenses") {
      const f = await ghGet("expenses.json");
      const expenses = f ? JSON.parse(f.content) : [];
      return res.status(200).json({ ok: true, expenses });
    }

    if (action === "add_expense") {
      const f = await ghGet("expenses.json");
      const expenses = f ? JSON.parse(f.content) : [];
      const item = {
        id: "EX-" + Date.now().toString(36),
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
