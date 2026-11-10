// /api/catalog — live products/categories/config from GitHub (instant store updates)
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const memoryCache = new Map();
const MEMORY_CACHE_MS = 500;

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

async function ghGetFile(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA-Catalog" }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return { sha: data.sha, content: Buffer.from(data.content || "", "base64").toString("utf8") };
}

async function ghPut(path, content, message, sha) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "NEXORA-Catalog" },
    body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64"), branch: "main", ...(sha ? { sha } : {}) })
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

function randomGiftCode(existing) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    if (!existing.has(code)) return code;
  }
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function weightedGiftPercent(min, max) {
  let total = 0;
  for (let p = min; p <= max; p++) total += Math.pow(max - p + 1, 2);
  let pick = Math.random() * total;
  for (let p = min; p <= max; p++) {
    pick -= Math.pow(max - p + 1, 2);
    if (pick < 0) return p;
  }
  return min;
}

function cleanGiftRecords(payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  const records = Array.isArray(data.issued) ? data.issued : [];
  const totals = data.totals && typeof data.totals === "object" ? data.totals : {};
  const now = Date.now();
  let removed = 0;
  const live = records.filter((row) => {
    const issuedAt = Date.parse(String(row?.issuedAt || ""));
    const expired = Number.isFinite(issuedAt) && now - issuedAt >= 60 * 1000;
    if (expired) removed++;
    return !expired;
  });
  return {
    issued: live,
    totals: {
      created: Math.max(0, Number(totals.created) || records.length),
      deleted: Math.max(0, Number(totals.deleted) || 0) + removed,
      used: Math.max(0, Number(totals.used) || 0)
    },
    removed
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // كاش قصير جدًا: أسرع بكثير، مع انعكاس تغييرات الأدمن خلال ثانيتين كحد أقصى.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const type = String(req.query?.type || "products").toLowerCase();
    if (req.method === "POST" && type === "gift-code") {
      if (!GH_TOKEN) return res.status(500).json({ ok: false, error: "GITHUB_TOKEN missing" });
      const configFile = await ghGet("site-config.json");
      let config = {};
      try { config = configFile ? JSON.parse(configFile) : {}; } catch { config = {}; }
      const settings = config.homepage?.giftAutoCodes || {};
      if (settings.enabled !== true) return res.status(403).json({ ok: false, error: "auto gift codes disabled" });
      const min = Math.max(1, Math.min(90, Math.round(Number(settings.minPercent) || 9)));
      const max = Math.max(min, Math.min(90, Math.round(Number(settings.maxPercent) || 15)));
      for (let attempt = 0; attempt < 5; attempt++) {
        const file = await ghGetFile("gift-auto-codes.json");
        let payload = {};
        try { payload = file ? JSON.parse(file.content || "{}") : {}; } catch { payload = {}; }
        const cleaned = cleanGiftRecords(payload);
        let records = cleaned.issued;
        const totals = cleaned.totals;
        const existing = new Set(records.map(row => String(row.code || "").toUpperCase()));
        const code = randomGiftCode(existing);
        const percent = weightedGiftPercent(min, max);
        records.push({ code, percent, issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60 * 1000).toISOString(), status: "issued", usedAt: "", orderId: "" });
        totals.created++;
        if (records.length > 5000) records = records.slice(-5000);
        const put = await ghPut("gift-auto-codes.json", JSON.stringify({ issued: records, totals }, null, 2), `Gift auto code issued ${code}`, file?.sha);
        if (put.ok) return res.status(200).json({ ok: true, code, percent });
        if (!(put.status === 409 || /sha|conflict/i.test(String(put.data?.message || "")))) break;
      }
      return res.status(409).json({ ok: false, error: "تعذر إصدار كود جديد، حاولي مرة أخرى" });
    }
    if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET or POST only" });
    if (type === "products") {
      const raw = await ghGet("products.json");
      if (!raw) return res.status(502).json({ ok: false, error: "products unavailable" });
      const data = JSON.parse(raw);
      let list = Array.isArray(data) ? data : (data.products || []);
      list = (list || []).filter(p => p && p.hidden !== true && p.active !== false); // hidden من الأدمن فقط
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
      try {
        const data = JSON.parse(raw);
        const codes = Array.isArray(data.codes) ? data.codes : [];
        return res.status(200).json({ ok: true, codes, ts: Date.now() });
      } catch (e) {
        return res.status(200).json({ ok: true, codes: [] });
      }
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
