// Public review submission and approved-review feed, persisted using this store's existing GitHub JSON CMS.
const OWNER = "ahmedgabr1560-coder";
const REPO = "noirtech-store";
const TOKEN = process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const rl = globalThis.__ATHAR_REVIEW_RL || (globalThis.__ATHAR_REVIEW_RL = new Map());

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "").split(",")[0].trim() || "unknown";
}
function rateLimit(req) {
  const now = Date.now();
  const key = clientIp(req);
  let row = rl.get(key);
  if (!row || now - row.start > 60 * 60 * 1000) row = { start: now, count: 0 };
  row.count++;
  rl.set(key, row);
  return row.count <= 8;
}
async function getFile() {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/reviews.json`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA-Reviews" }, cache: "no-store"
  });
  if (r.status === 404) return { sha: null, reviews: [] };
  if (!r.ok) throw new Error("تعذر قراءة سجل التقييمات");
  const data = await r.json();
  const content = Buffer.from(data.content || "", "base64").toString("utf8");
  const parsed = JSON.parse(content || "[]");
  return { sha: data.sha, reviews: Array.isArray(parsed) ? parsed : [] };
}
async function getCarouselSettings() {
  const defaults = { intervalSeconds: 7, maxReviews: 10 };
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/reviews-settings.json`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA-Reviews" }, cache: "no-store"
  });
  if (!r.ok) return defaults;
  try {
    const data = await r.json();
    const settings = JSON.parse(Buffer.from(data.content || "", "base64").toString("utf8") || "{}");
    return {
      intervalSeconds: Math.max(3, Math.min(60, Math.round(Number(settings.intervalSeconds) || defaults.intervalSeconds))),
      maxReviews: Math.max(1, Math.min(50, Math.round(Number(settings.maxReviews) || defaults.maxReviews)))
    };
  } catch { return defaults; }
}
async function saveFile(reviews, sha) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/reviews.json`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "NEXORA-Reviews" },
    body: JSON.stringify({ message: "Save customer product review", content: Buffer.from(JSON.stringify(reviews, null, 2)).toString("base64"), branch: "main", ...(sha ? { sha } : {}) })
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!TOKEN) return res.status(500).json({ ok: false, error: "التخزين غير مهيأ" });
  try {
    if (req.method === "GET") {
      const productId = String(req.query?.productId || "").slice(0, 80);
      if (!productId) return res.status(400).json({ ok: false, error: "productId مطلوب" });
      const [{ reviews }, settings] = await Promise.all([getFile(), getCarouselSettings()]);
      const approved = reviews.filter(row => String(row.productId) === productId && row.status === "approved").map(({ id, productId, productName, rating, name, message, createdAt }) => ({ id, productId, productName, rating, name, message, createdAt }));
      return res.status(200).json({ ok: true, reviews: approved.slice(0, settings.maxReviews), settings });
    }
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
    if (!rateLimit(req)) return res.status(429).json({ ok: false, error: "تم استلام تقييمات كثيرة من هذا الاتصال، حاولي لاحقًا" });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const productId = String(body.productId || "").trim().slice(0, 80);
    const productName = String(body.productName || "").trim().slice(0, 200);
    const name = String(body.name || "عميلنا").trim().slice(0, 80) || "عميلنا";
    const message = String(body.message || "").trim().slice(0, 500);
    const rating = Math.round(Number(body.rating));
    if (!productId || !productName || !message || message.length < 2 || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ ok: false, error: "بيانات التقييم غير مكتملة" });
    for (let attempt = 0; attempt < 4; attempt++) {
      const file = await getFile();
      const review = { id: `rv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, productId, productName, name, rating, message, createdAt: new Date().toISOString(), status: "pending" };
      const reviews = [review, ...file.reviews].slice(0, 2000);
      const saved = await saveFile(reviews, file.sha);
      if (saved.ok) return res.status(200).json({ ok: true, pending: true });
      if (saved.status !== 409 && !/sha|conflict/i.test(String(saved.data?.message || ""))) break;
      await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
    }
    return res.status(500).json({ ok: false, error: "تعذر حفظ التقييم، حاولي مرة أخرى" });
  } catch (error) {
    console.error("reviews API error", error);
    return res.status(500).json({ ok: false, error: "تعذر معالجة التقييم" });
  }
}
