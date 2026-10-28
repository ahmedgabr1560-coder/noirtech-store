// /api/catalog — live products/categories/config from GitHub (instant store updates)
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const memoryCache = new Map();
const MEMORY_CACHE_MS = 2000;

async function ghGet(path) {
  const cached = memoryCache.get(path);
  if (cached && Date.now() - cached.at < MEMORY_CACHE_MS) return cached.value;
  // GitHub Contents API omits `content` for files larger than 1 MB.
  const r = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`, {
    headers: { "User-Agent": "NEXORA-Catalog" }
  });
  if (!r.ok) return null;
  const value = await r.text();
  memoryCache.set(path, { at: Date.now(), value });
  return value;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // كاش قصير جدًا: أسرع بكثير، مع انعكاس تغييرات الأدمن خلال ثانيتين كحد أقصى.
  res.setHeader("Cache-Control", "public, max-age=2, s-maxage=2, stale-while-revalidate=5");
  res.setHeader("Pragma", "no-cache");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });

  try {
    const type = String(req.query?.type || "products").toLowerCase();
    if (type === "products") {
      const raw = await ghGet("products.json");
      if (!raw) return res.status(502).json({ ok: false, error: "products unavailable" });
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : (data.products || []);
      return res.status(200).json({ ok: true, products: list, ts: Date.now() });
    }
    if (type === "categories") {
      const raw = await ghGet("categories.json");
      if (!raw) return res.status(502).json({ ok: false, error: "categories unavailable" });
      const data = JSON.parse(raw);
      return res.status(200).json({ ok: true, ...data, ts: Date.now() });
    }
    if (type === "coupons") {
      const raw = await ghGet("coupons.json");
      if (!raw) return res.status(200).json({ ok: true, codes: [] });
      const data = JSON.parse(raw);
      const codes = Array.isArray(data.codes) ? data.codes : [];
      return res.status(200).json({ ok: true, codes, ts: Date.now() });
    }
    if (type === "shipping") {
      const raw = await ghGet("shipping-zones.json");
      if (!raw) return res.status(200).json({ ok: true, zones: { enabled: false, governorates: [] } });
      const data = JSON.parse(raw);
      return res.status(200).json({ ok: true, zones: data, ts: Date.now() });
    }
    if (type === "config") {
      const raw = await ghGet("site-config.json");
      if (!raw) return res.status(502).json({ ok: false, error: "config unavailable" });
      const data = JSON.parse(raw);
      return res.status(200).json({ ok: true, config: data, ts: Date.now() });
    }
    return res.status(400).json({ ok: false, error: "type=products|categories|config" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || "server error" });
  }
}
