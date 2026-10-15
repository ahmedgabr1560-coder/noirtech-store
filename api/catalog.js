// /api/catalog — live products/categories/config from GitHub (instant store updates)
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: {
      Authorization: GH_TOKEN ? `Bearer ${GH_TOKEN}` : undefined,
      Accept: "application/vnd.github+json",
      "User-Agent": "NEXORA-Catalog"
    }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return Buffer.from(data.content, "base64").toString("utf8");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // short cache so CDN helps a bit but admin changes show within seconds
  res.setHeader("Cache-Control", "public, max-age=5, s-maxage=5, stale-while-revalidate=30");
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
