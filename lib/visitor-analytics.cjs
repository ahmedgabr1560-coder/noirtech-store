const AUTOMATION_USER_AGENT = /(?:\bbot\b|bot(?:\/|\s|;|$)|crawler|spider|slurp|headless|lighthouse|pagespeed|uptimerobot|pingdom|healthcheck|curl\/|wget\/|python-requests|node-fetch|postman|insomnia|playwright|puppeteer|selenium|phantomjs|facebookexternalhit|twitterbot|slackbot|telegrambot|discordbot|whatsapp)/i;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isAutomatedVisitorRequest(req, body = {}) {
  if (body?.isAutomated === true) return true;
  const userAgent = String(req?.headers?.["user-agent"] || "").trim();
  if (!userAgent || AUTOMATION_USER_AGENT.test(userAgent)) return true;

  const path = String(body?.path || "/").split(/[?#]/, 1)[0] || "/";
  return /^\/(?:admin(?:\.html)?|api)(?:\/|$)/i.test(path);
}

function isSessionOnline(session, now = Date.now()) {
  if (!session || session.status === "left") return false;
  const lastSeen = new Date(session.lastSeen || 0).getTime();
  if (!Number.isFinite(lastSeen) || lastSeen <= 0) return false;
  const age = now - lastSeen;
  return age >= 0 && age <= ONLINE_WINDOW_MS;
}

function countOnlineVisitors(sessions, now = Date.now()) {
  const activeDevices = new Set();
  for (const [sessionId, session] of Object.entries(sessions || {})) {
    if (!isSessionOnline(session, now)) continue;
    const deviceId = String(session.deviceId || "").trim();
    activeDevices.add(deviceId ? `device:${deviceId}` : `session:${sessionId}`);
  }
  return activeDevices.size;
}

function shouldCountEnterToday(session, today) {
  if (!session) return true;
  if (session.lastEnterDate) return session.lastEnterDate !== today;
  if (Number(session.enters || 0) <= 0) return true;

  // Legacy sessions have no lastEnterDate; avoid recounting one already active today.
  const seenAt = new Date(session.lastSeen || session.firstSeen || 0);
  if (!Number.isFinite(seenAt.getTime())) return true;
  let seenDate;
  try {
    seenDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(seenAt);
  } catch (e) {
    seenDate = new Date(seenAt.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
  return seenDate !== today;
}

exports.countOnlineVisitors = countOnlineVisitors;
exports.isAutomatedVisitorRequest = isAutomatedVisitorRequest;
exports.isSessionOnline = isSessionOnline;
exports.shouldCountEnterToday = shouldCountEnterToday;
