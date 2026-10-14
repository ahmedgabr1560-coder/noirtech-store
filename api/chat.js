const SYSTEM = `انت نورا مساعدة مبيعات لمتجر موضة في مصر.
اتكلمي بالعامية المصرية بشكل طبيعي وودي.
رشيحي من الكتالوج فقط واسعاره الحقيقية.
الرد 3 الى 6 جمل مع سؤال واحد في الاخر.
للتواصل واتساب 01064519541
متقوليش انك نموذج تجريبي.`;

const ADMIN_SYSTEM = `مساعدة ادارة متجر موضة. خطوات واضحة بالعامية المصرية عن المنتجات والعروض والطلبات.`;

function money(n) {
  try { return Number(n).toLocaleString("ar-EG") + " ج.م"; } catch (e) { return String(n) + " ج.م"; }
}

function formatList(items) {
  if (!items || !items.length) return "";
  return items.map(function (p, i) {
    var price = p.price != null ? money(p.price) : "";
    var old = p.oldPrice && p.oldPrice > p.price ? " (بدل " + money(p.oldPrice) + ")" : "";
    return (i + 1) + ") " + p.name + (price ? " — " + price : "") + old;
  }).join("\n");
}

function extractBudget(t) {
  var s = String(t || "").replace(/,/g, "");
  var m = s.match(/(\d{2,7})\s*(الف|ألف|k|ج|جنيه)?/i);
  if (!m) return null;
  var n = Number(m[1]);
  if (m[2] && /الف|ألف|k/i.test(m[2]) && n < 1000) n *= 1000;
  if (n > 0 && n < 50) return null;
  return n;
}

function pickProducts(list, keywords, budget, limit) {
  limit = limit || 4;
  var items = (list || []).filter(function (p) { return !p.hidden; });
  if (budget) items = items.filter(function (p) { return !p.price || Number(p.price) <= budget * 1.05; });
  var scored = items.map(function (p) {
    var name = String(p.name || "").toLowerCase();
    var cat = String(p.category || "").toLowerCase();
    var score = 0;
    (keywords || []).forEach(function (k) {
      k = String(k).toLowerCase();
      if (!k) return;
      if (name.indexOf(k) >= 0) score += 4;
      if (cat.indexOf(k) >= 0) score += 2;
    });
    if (p.isOffer) score += 1;
    return { p: p, s: score };
  }).filter(function (x) { return x.s > 0; });
  scored.sort(function (a, b) { return b.s - a.s || Number(a.p.price || 0) - Number(b.p.price || 0); });
  var out = scored.slice(0, limit).map(function (x) { return x.p; });
  if (!out.length && budget) {
    out = items.filter(function (p) { return p.price; }).sort(function (a, b) { return a.price - b.price; }).slice(0, limit);
  }
  if (!out.length) out = (list || []).filter(function (p) { return !p.hidden; }).slice(0, limit);
  return out;
}

function localSmartReply(message, catalog, mode, history, siteName) {
  var t = String(message || "").trim();
  var low = t.toLowerCase();
  var list = Array.isArray(catalog) ? catalog.filter(function (p) { return !p.hidden; }) : [];
  var budget = extractBudget(t);
  var store = siteName || "المتجر";

  if (mode === "admin") {
    if (/عرض|خصم/.test(t)) return "لاضافة عرض: اضافة منتج ثم تبويب عرض/خصم، اختاري المنتج، حددي السعر او عرض 2 و 3 قطع، ثم احفظي.";
    if (/طلب|تسليم/.test(t)) return "من الطلبات: اكدي التسليم عشان يتحسب في المبيعات، او غيري حالة الطلب، او احذفي طلب قديم.";
    return "قولي عايزة تظبطي: منتجات، عروض، ولا طلبات؟";
  }

  if (/^(ازيك|ازيكم|أهلا|اهلا|مرحبا|هاي|hi|hello)/i.test(t) || t.length < 3) {
    return "اهلا بيك في " + store + " انا نورا\nتحبي نبدأ بشنطة، ملابس، حذاء، ولا عرض؟";
  }
  if (/شكرا|ميرسي|تسلم/.test(t)) return "العفو يا قمر لو احتجتي حاجة تاني انا هنا";
  if (/واتس|تليفون|رقم|تواصل/.test(t)) return "واتساب: 01064519541\nوتقدري تطلبي من السلة على الموقع كمان.";
  if (/طلب|اوردر|سله|سلة|ازاي اطلب|كيف اطلب/.test(t)) {
    return "الطلب سهل:\n1) اختاري المنتج واللون\n2) اضيفي للسلة\n3) الاسم والموبايل والعنوان ثم اتمام الطلب\nاو واتساب 01064519541";
  }
  if (/لون|الوان|ألوان/.test(t)) return "لو المنتج له الوان لازم تختاري لون قبل السلة، واللون بيوصل مع الطلب.";
  if (/عرض|خصم|تخفيض/.test(t)) {
    var offers = list.filter(function (p) { return p.isOffer || (p.oldPrice && p.price && p.oldPrice > p.price); });
    if (offers.length) return "العروض دلوقتي:\n" + formatList(offers.slice(0, 5)) + "\nتحبي شنط ولا ملابس؟";
    return "دخلي قسم العروض في الموقع، او قولي ميزانيتك ونوع القطعة.";
  }

  var intents = [
    { test: /شنط|شنطة|حقيبة|bag/i, keys: ["شنط", "شنطة", "حقيبة", "bag"] },
    { test: /حذاء|شوز|كوتشي|سنيكر/i, keys: ["حذاء", "شوز", "كوتشي"] },
    { test: /فستان|بلوزة|تيشيرت|ملابس|هدوم|جينز|بنطلون/i, keys: ["ملابس", "فستان", "بلوزة"] },
    { test: /ساعة|ساعات/i, keys: ["ساعة"] },
    { test: /نظارة|نظارات/i, keys: ["نظارة"] },
    { test: /اكسسوار|إكسسوار|خاتم|سلسلة/i, keys: ["اكسسوار", "إكسسوار"] }
  ];
  for (var i = 0; i < intents.length; i++) {
    if (intents[i].test.test(t)) {
      var items = pickProducts(list, intents[i].keys, budget, 4);
      if (items.length) {
        var head = budget ? "تمام في حدود " + money(budget) + ":" : "تمام رشحتلك:";
        return head + "\n" + formatList(items) + "\nتحبي لون معين؟";
      }
      return budget ? "حاضر في حدود " + money(budget) + " قولي ستايل كاجوال ولا رسمي؟" : "حاضر قولي ميزانيتك تقريبًا كام؟";
    }
  }

  if (budget) {
    var byBudget = pickProducts(list, [], budget, 5);
    if (byBudget.length) return "في حدود " + money(budget) + ":\n" + formatList(byBudget) + "\nشنطة ولا ملابس ولا حذاء؟";
    return "ميزانية " + money(budget) + " تمام، قولي النوع عشان ادورلك.";
  }

  if (list.length) return "قولي اكتر شوية مثال: شنطة تحت 500\nمن المتاح:\n" + formatList(list.slice(0, 3));
  return "انا نورا مساعدة " + store + "\nقولي النوع والميزانية او واتساب 01064519541";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, gemini: Boolean(process.env.GEMINI_API_KEY), freeLocal: true });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    var body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    var message = body.message;
    var history = body.history;
    var catalog = body.catalog;
    var mode = body.mode;
    var siteName = body.siteName;
    if (!message || typeof message !== "string") return res.status(400).json({ error: "Message required" });

    var messages = [].concat(Array.isArray(history) ? history.slice(-12) : [], [{ role: "user", content: message.slice(0, 2500) }]);
    var system = mode === "admin" ? ADMIN_SYSTEM : SYSTEM;
    if (siteName) system += "\nاسم المتجر: " + siteName;
    if (Array.isArray(catalog) && catalog.length) {
      system += "\nكتالوج:\n" + catalog.slice(0, 40).map(function (p) {
        return (p.name || "") + " | " + (p.price || "") + " | " + (p.category || "");
      }).join("\n");
    }

    // رد محلي سريع وذكي أولاً (مستقر)، وGemini اختياري لو AI_PREFER_EXTERNAL=1
    return res.status(200).json({
      reply: localSmartReply(message, catalog, mode, history, siteName),
      provider: "local"
    });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ reply: "حصلت لخبطة بسيطة جربي تاني: شنطة او ملابس وميزانيتك.", provider: "error" });
  }
}
