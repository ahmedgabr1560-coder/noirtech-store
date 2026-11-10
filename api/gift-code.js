// /api/gift-code — issue one disposable random gift coupon per claim.
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA-Gift-Code" }
  });
  if (!r.ok) return null;
  const data = await r.json();
  const content = typeof data.content === "string" && data.content.trim()
    ? Buffer.from(data.content, "base64").toString("utf8")
    : await (await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`)).text();
  return { content, sha: data.sha };
}

async function ghPut(path, content, message, sha) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "NEXORA-Gift-Code" },
    body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64"), branch: "main", ...(sha ? { sha } : {}) })
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

function randomCode(existing) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    let suffix = "";
    for (let i = 0; i < 5; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    const code = suffix;
    if (!existing.has(code)) return code;
  }
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function weightedPercent(min, max) {
  // النسب الصغيرة أكثر شيوعًا، والنسب الكبيرة أندر بشكل واضح.
  const weights = [];
  let total = 0;
  for (let percent = min; percent <= max; percent++) {
    const weight = Math.pow(max - percent + 1, 2);
    weights.push({ percent, weight });
    total += weight;
  }
  let pick = Math.random() * total;
  for (const item of weights) {
    pick -= item.weight;
    if (pick < 0) return item.percent;
  }
  return min;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!GH_TOKEN) return res.status(500).json({ ok: false, error: "GITHUB_TOKEN missing" });

  try {
    const configFile = await ghGet("site-config.json");
    let config = {};
    try { config = configFile ? JSON.parse(configFile.content || "{}") : {}; } catch { config = {}; }
    const settings = config.homepage?.giftAutoCodes || {};
    if (settings.enabled !== true) return res.status(403).json({ ok: false, error: "auto gift codes disabled" });
    const min = Math.max(1, Math.min(90, Math.round(Number(settings.minPercent) || 5)));
    const max = Math.max(min, Math.min(90, Math.round(Number(settings.maxPercent) || 15)));

    for (let attempt = 0; attempt < 5; attempt++) {
      const file = await ghGet("gift-auto-codes.json");
      let records = [];
      try { records = file ? JSON.parse(file.content || "{}").issued : []; } catch { records = []; }
      if (!Array.isArray(records)) records = [];
      const existing = new Set(records.map(row => String(row.code || "").toUpperCase()));
      const code = randomCode(existing);
      const percent = weightedPercent(min, max);
      records.push({ code, percent, issuedAt: new Date().toISOString(), status: "issued", usedAt: "", orderId: "" });
      if (records.length > 5000) records = records.slice(-5000);
      const put = await ghPut("gift-auto-codes.json", JSON.stringify({ issued: records }, null, 2), `Gift auto code issued ${code}`, file?.sha);
      if (put.ok) return res.status(200).json({ ok: true, code, percent });
      if (!(put.status === 409 || /sha|conflict/i.test(String(put.data?.message || "")))) break;
    }
    return res.status(409).json({ ok: false, error: "تعذر إصدار كود جديد، حاولي مرة أخرى" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "تعذر إصدار كود الهدية" });
  }
}
