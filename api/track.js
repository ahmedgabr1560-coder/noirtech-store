const GH_OWNER = process.env.GH_OWNER || "ahmedgabr1560-coder";
const GH_REPO = process.env.GH_REPO || "noirtech-store";
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA-Track" }
  });
  if (r.status === 404) return null;
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
      "User-Agent": "NEXORA-Track"
    },
    body: JSON.stringify(body)
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyVisitors() {
  return {
    stats: {
      totalEnters: 0,
      totalLeaves: 0,
      uniqueSessions: 0,
      todayEnters: 0,
      todayLeaves: 0,
      todayDate: todayStr(),
      accountsTotal: 0
    },
    sessions: {},
    recent: []
  };
}

function rollDay(stats) {
  const d = todayStr();
  if (stats.todayDate !== d) {
    stats.todayDate = d;
    stats.todayEnters = 0;
    stats.todayLeaves = 0;
  }
  return stats;
}

function pruneSessions(sessions) {
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const entries = Object.entries(sessions || {}).filter(([, s]) => {
    const t = new Date(s.lastSeen || s.firstSeen || 0).getTime();
    return now - t < maxAge;
  });
  // keep latest 400
  entries.sort((a, b) => new Date(b[1].lastSeen || 0) - new Date(a[1].lastSeen || 0));
  const out = {};
  for (const [k, v] of entries.slice(0, 400)) out[k] = v;
  return out;
}

function countOnline(sessions) {
  const now = Date.now();
  let n = 0;
  for (const s of Object.values(sessions || {})) {
    if (s.status === "left") continue;
    const t = new Date(s.lastSeen || 0).getTime();
    if (now - t < 3 * 60 * 1000) n++;
  }
  return n;
}

async function withRetry(mutator, path, message, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const f = await ghGet(path);
    let data;
    try { data = f ? JSON.parse(f.content) : (path === "accounts.json" ? [] : emptyVisitors()); }
    catch { data = path === "accounts.json" ? [] : emptyVisitors(); }
    const next = mutator(data);
    const put = await ghPut(path, JSON.stringify(next, null, 2), message, f?.sha);
    if (put.ok) return { ok: true, data: next };
    if (put.status !== 409 && put.status !== 422) return { ok: false, error: (put.data && (put.data.message || put.data.error)) || ("status " + put.status) };
  }
  return { ok: false, error: "conflict" };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!GH_TOKEN) return res.status(500).json({ ok: false, error: "token missing" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const action = body.action || "ping";

    // تسجيل حساب (بدون كلمة مرور)
    if (action === "register_account") {
      const name = String(body.name || "").trim().slice(0, 80);
      const phone = String(body.phone || "").trim().slice(0, 30);
      const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
      if (!name || !email) return res.status(400).json({ ok: false, error: "name/email required" });
      const result = await withRetry((list) => {
        if (!Array.isArray(list)) list = [];
        const idx = list.findIndex(u => String(u.email || "").toLowerCase() === email);
        const row = {
          id: idx >= 0 ? list[idx].id : ("u_" + Date.now()),
          name, phone, email,
          createdAt: idx >= 0 ? list[idx].createdAt : new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          hasAvatar: !!body.hasAvatar
        };
        if (idx >= 0) list[idx] = { ...list[idx], ...row };
        else list.unshift(row);
        return list.slice(0, 2000);
      }, "accounts.json", "track: register account");
      if (!result.ok) return res.status(500).json(result);
      // bump accountsTotal on visitors stats (best effort)
      await withRetry((v) => {
        if (!v.stats) v.stats = emptyVisitors().stats;
        v.stats.accountsTotal = Array.isArray(result.data) ? result.data.length : (v.stats.accountsTotal || 0) + 1;
        return v;
      }, "visitors.json", "track: accounts total");
      return res.status(200).json({ ok: true });
    }

    // زيارات
    if (action === "enter" || action === "leave" || action === "ping") {
      const sid = String(body.sessionId || "").slice(0, 64);
      if (!sid || sid.length < 8) return res.status(400).json({ ok: false, error: "sessionId" });
      const path = String(body.path || "/").slice(0, 120);
      const now = new Date().toISOString();

      const result = await withRetry((v) => {
        if (!v || typeof v !== "object") v = emptyVisitors();
        if (!v.stats) v.stats = emptyVisitors().stats;
        if (!v.sessions) v.sessions = {};
        if (!Array.isArray(v.recent)) v.recent = [];
        v.stats = rollDay(v.stats);

        const isNew = !v.sessions[sid];
        const prev = v.sessions[sid] || {
          firstSeen: now,
          lastSeen: now,
          path,
          status: "online",
          enters: 0,
          leaves: 0
        };

        if (action === "enter") {
          if (isNew) {
            v.stats.uniqueSessions = (v.stats.uniqueSessions || 0) + 1;
          }
          // مرة واحدة لكل تحميل صفحة (العميل يمنع التكرار بجلسة)
          prev.enters = (prev.enters || 0) + 1;
          prev.status = "online";
          prev.path = path;
          prev.lastSeen = now;
          if (isNew) prev.firstSeen = now;
          v.stats.totalEnters = (v.stats.totalEnters || 0) + 1;
          v.stats.todayEnters = (v.stats.todayEnters || 0) + 1;
          v.recent.unshift({ type: "enter", sessionId: sid.slice(0, 10) + "…", path, at: now });
        } else if (action === "leave") {
          prev.status = "left";
          prev.lastSeen = now;
          prev.leaves = (prev.leaves || 0) + 1;
          v.stats.totalLeaves = (v.stats.totalLeaves || 0) + 1;
          v.stats.todayLeaves = (v.stats.todayLeaves || 0) + 1;
          v.recent.unshift({ type: "leave", sessionId: sid.slice(0, 10) + "…", path, at: now });
        } else {
          // ping
          prev.status = "online";
          prev.lastSeen = now;
          prev.path = path || prev.path;
        }

        v.sessions[sid] = prev;
        v.sessions = pruneSessions(v.sessions);
        v.recent = v.recent.slice(0, 80);
        return v;
      }, "visitors.json", "track: " + action);

      if (!result.ok) return res.status(200).json({ ok: true, soft: true, error: result.error || "save failed" });
      const online = countOnline(result.data.sessions || {});
      return res.status(200).json({ ok: true, online });
    }

    return res.status(400).json({ ok: false, error: "unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true, soft: true });
  }
}
