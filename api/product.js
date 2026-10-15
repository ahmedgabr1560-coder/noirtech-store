const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
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

    let name = String(body.name || "").trim();
    let price = Number(String(body.price || "").replace(/[^0-9.]/g, ""));
    let category = String(body.category || "electronics").toLowerCase();
    let subcategory = String(body.subcategory || "").toLowerCase();
    let brand = String(body.brand || "").trim();
    let image = String(body.image || "").trim();
    let description = String(body.description || "").trim();
    let badge = String(body.badge || "").trim();
    const isOfferFlag = body.isOffer === true || body.isOffer === "true" || body.isOffer === 1 || body.isOffer === "1";
    if (!badge) badge = isOfferFlag ? "عرض" : "جديد";
    const stock = Math.max(0, Number(body.stock ?? body.qty ?? 0) || 0);
    let available = body.available;
    if (available === undefined || available === null || available === "") {
      available = stock > 0;
    } else {
      available = available === true || available === "true" || available === 1 || available === "1" || available === "on";
    }
    // colors: array or comma-separated "أسود,#111" or names
    let colors = [];
    if (Array.isArray(body.colors)) {
      colors = body.colors.map(c => {
        if (typeof c === "string") return { name: c, code: "" };
        return { name: String(c.name || c.label || "").trim(), code: String(c.code || c.hex || "").trim() };
      }).filter(c => c.name);
    } else if (typeof body.colors === "string" && body.colors.trim()) {
      colors = body.colors.split(/[,،\n]/).map(s => s.trim()).filter(Boolean).map(s => {
        const m = s.match(/^(.+?)[|:：]\s*(#[0-9a-fA-F]{3,8})$/);
        if (m) return { name: m[1].trim(), code: m[2].trim() };
        if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return { name: s, code: s };
        return { name: s, code: "" };
      });
    }
    let imageBase64 = body.imageBase64 || body.imageData || null;
    // Admin may send data-URL in image field
    if (!imageBase64 && image.startsWith("data:image/")) {
      imageBase64 = image;
      image = "";
    }

    if (!category) category = "fashion";

    // Offer from existing product
    let sourceProductId = body.sourceProductId != null ? Number(body.sourceProductId) : null;
    let offerType = String(body.offerType || (isOfferFlag ? "discount" : "")).trim();
    let offerMeta = null;
    if (isOfferFlag) {
      const tiers = [];
      if (Array.isArray(body.bundleTiers)) {
        for (const t of body.bundleTiers) {
          const q = Math.max(1, Number(t.qty || t.quantity || 0));
          const pr = Math.round(Number(t.price || 0));
          if (q && pr > 0) tiers.push({ qty: q, price: pr });
        }
      }
      // helpers from form fields
      const b2 = Number(body.bundle2Price || 0);
      const b3 = Number(body.bundle3Price || 0);
      if (b2 > 0) tiers.push({ qty: 2, price: Math.round(b2) });
      if (b3 > 0) tiers.push({ qty: 3, price: Math.round(b3) });
      // unique by qty
      const map = new Map();
      for (const t of tiers) map.set(t.qty, t);
      const uniq = [...map.values()].sort((a,b) => a.qty - b.qty);
      offerMeta = {
        type: offerType || (uniq.length ? "bundle" : "discount"),
        sourceProductId: sourceProductId || null,
        tiers: uniq
      };
    }

    if ((!price || price <= 0) && offerMeta && offerMeta.tiers && offerMeta.tiers.length) {
      const t2 = offerMeta.tiers.find(t => Number(t.qty) === 2);
      if (t2) price = Math.round(Number(t2.price) / 2);
      else price = Math.round(Number(offerMeta.tiers[0].price) / Math.max(1, Number(offerMeta.tiers[0].qty) || 1));
    }
    if (!name || !price) return res.status(400).json({ ok: false, error: "الاسم والسعر مطلوبين" });

    const file = await ghGet("products.json");
    if (!file) return res.status(500).json({ ok: false, error: "تعذر قراءة products.json" });
    let products = [];
    try { products = JSON.parse(file.content); } catch { return res.status(500).json({ ok: false, error: "ملف منتجات تالف" }); }

    const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;

    if (sourceProductId) {
      const src = products.find(p => Number(p.id) === Number(sourceProductId));
      if (src) {
        if (!name) name = src.name;
        if (!brand) brand = src.brand || "";
        if (!category || category === "electronics") category = src.category || category;
        if (!subcategory) subcategory = src.subcategory || "";
        if (!image) image = src.image || "";
        if (!description) description = src.description || src.desc || "";
        if (!colors.length && Array.isArray(src.colors)) colors = src.colors;
        if (!stock && src.stock != null) { /* keep form stock */ }
        // default oldPrice to original product price for discount offers
        if (isOfferFlag && !(body.oldPrice) && src.price) {
          body.oldPrice = src.price;
        }
      }
    }

    if ((!price || price <= 0) && offerMeta && offerMeta.tiers && offerMeta.tiers.length) {
      const t2 = offerMeta.tiers.find(t => Number(t.qty) === 2);
      if (t2) price = Math.round(Number(t2.price) / 2);
      else price = Math.round(Number(offerMeta.tiers[0].price) / Math.max(1, Number(offerMeta.tiers[0].qty) || 1));
    }
    if (!name || !price) return res.status(400).json({ ok: false, error: "الاسم والسعر مطلوبين" });

    // Upload phone/gallery image to GitHub if provided
    if (imageBase64) {
      const parsed = parseDataUrl(imageBase64);
      if (parsed) {
        const ext = parsed.mime.includes("png") ? "png" : (parsed.mime.includes("webp") ? "webp" : "jpg");
        const imgPath = `product-images/${id}.${ext}`;
        const up = await ghPut(imgPath, null, `admin: product image ${id}`, null, parsed.b64);
        if (up.ok) {
          image = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${imgPath}?t=${Date.now()}`;
        } else {
          // fallback: keep data URL only if small (not ideal) — prefer error
          console.error("image upload failed", up.data);
        }
      }
    }

    const fallbackImages = {
      fashion: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop&q=80",
      electronics: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80",
      phones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80",
      laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=80",
      monitors: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop&q=80",
      home: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop&q=80",
      accessories: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop&q=80"
    };
    
    // صور متعددة
    let images = [];
    if (Array.isArray(body.images)) {
      for (let i = 0; i < body.images.length && images.length < 8; i++) {
        const im = body.images[i];
        if (!im) continue;
        if (typeof im === "string" && /^https?:\/\//i.test(im)) {
          images.push(im);
          continue;
        }
        if (typeof im === "string" && im.startsWith("data:image/")) {
          const parsed = parseDataUrl(im);
          if (!parsed) continue;
          const ext = parsed.mime.includes("png") ? "png" : (parsed.mime.includes("webp") ? "webp" : "jpg");
          const imgPath = `product-images/${id}_${images.length + 1}.${ext}`;
          const up = await ghPut(imgPath, null, `admin: product image ${id}_${images.length + 1}`, null, parsed.b64);
          if (up.ok) {
            images.push(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${imgPath}?t=${Date.now()}`);
          }
        }
      }
    }
    if (images.length && !image) image = images[0];
    if (image && !images.includes(image)) images.unshift(image);
    if (!images.length && image) images = [image];

    if (!image || !/^https?:\/\//i.test(image)) image = fallbackImages[category] || fallbackImages.fashion;
    if (!images.length) images = [image];


    const product = {
      id,
      name: name.slice(0, 140),
      category,
      subcategory: subcategory || "",
      brand: brand || "",
      price: Math.round(price),
      costPrice: body.costPrice != null && body.costPrice !== ""
        ? Math.round(Number(String(body.costPrice).replace(/[^0-9.]/g, "")) || 0)
        : 0,
      oldPrice: body.oldPrice ? Math.round(Number(String(body.oldPrice).replace(/[^0-9.]/g, "")) || 0) : null,
      image,
      images,
      description: description.slice(0, 2000),
      badge,
      stock,
      available: available && stock > 0,
      colors,
      isOffer: isOfferFlag,
      sourceProductId: sourceProductId || null,
      offerType: offerType || null,
      offerMeta,
      rating: 4.5,
      reviews: 0,
      best: isOfferFlag || body.best === true,
      newest: !isOfferFlag,
      hidden: false,
      createdAt: new Date().toISOString()
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
