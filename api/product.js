const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "nexora2026";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "6746972381");

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA" }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha, raw: data };
}

async function ghPut(path, content, message, sha, binaryBase64) {
  const body = {
    message,
    content: binaryBase64 != null ? binaryBase64 : Buffer.from(content, "utf8").toString("base64"),
    branch: "main"
  };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "NEXORA"
    },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  return { ok: r.ok, data };
}

async function notifyTelegram(text) {
  if (!BOT_TOKEN || !ADMIN_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: "HTML" })
    });
  } catch (_) {}
}

function parseDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], b64: m[2] };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "NEXORA product API", categories: ["phones","laptops","monitors","home","accessories"] });
  }
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!GH_TOKEN) return res.status(500).json({ ok: false, error: "GITHUB_TOKEN missing" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const secret = body.secret || req.headers["x-admin-secret"] || "";
    if (String(secret) !== String(ADMIN_SECRET)) {
      return res.status(401).json({ ok: false, error: "غير مصرح — اكتب كلمة السر الصحيحة" });
    }

    const name = String(body.name || "").trim();
    const price = Number(String(body.price || "").replace(/[^0-9.]/g, ""));
    let category = String(body.category || "phones").toLowerCase();
    let image = String(body.image || "").trim();
    const description = String(body.description || "").trim();
    const badge = String(body.badge || "جديد").trim() || "جديد";
    const imageBase64 = body.imageBase64 || body.imageData || null;

    const allowed = new Set(["phones","laptops","monitors","home","accessories"]);
    if (!allowed.has(category)) category = "phones";
    if (!name || !price) return res.status(400).json({ ok: false, error: "الاسم والسعر مطلوبين" });

    const file = await ghGet("products.json");
    if (!file) return res.status(500).json({ ok: false, error: "تعذر قراءة products.json" });
    let products = [];
    try { products = JSON.parse(file.content); } catch { return res.status(500).json({ ok: false, error: "ملف منتجات تالف" }); }

    const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;

    // Upload phone/gallery image to GitHub if provided
    if (imageBase64) {
      const parsed = parseDataUrl(imageBase64);
      if (parsed) {
        const ext = parsed.mime.includes("png") ? "png" : "jpg";
        const imgPath = `product-images/${id}.${ext}`;
        const up = await ghPut(imgPath, null, `admin: product image ${id}`, null, parsed.b64);
        if (up.ok) {
          image = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${imgPath}`;
        }
      }
    }

    const fallbackImages = {
      phones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80",
      laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=80",
      monitors: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop&q=80",
      home: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop&q=80",
      accessories: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop&q=80"
    };
    if (!image || !/^https?:\/\//i.test(image)) image = fallbackImages[category];

    const product = {
      id,
      name: name.slice(0, 140),
      category,
      price: Math.round(price),
      oldPrice: body.oldPrice ? Math.round(Number(body.oldPrice)) : null,
      image,
      badge,
      hidden: false,
      description: description || `${name} — متوفر لدى NEXORA`,
      specs: body.specs && typeof body.specs === "object" ? body.specs : {},
      rating: 4.5,
      reviews: 5,
      best: false,
      newest: true
    };
    products.unshift(product);

    const put = await ghPut("products.json", JSON.stringify(products, null, 2), `admin: add ${name}`, file.sha);
    if (!put.ok) return res.status(500).json({ ok: false, error: put.data?.message || "فشل الحفظ على GitHub" });

    await notifyTelegram(
      `🆕 <b>منتج جديد</b>\n\n📦 ${product.name}\n💰 ${product.price} ج.م\n📂 ${product.category}\n🆔 #${product.id}`
    );

    return res.status(200).json({ ok: true, product, total: products.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
