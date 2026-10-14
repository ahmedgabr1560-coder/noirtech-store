function money(n) {
  try { return Number(n).toLocaleString("ar-EG") + " ج.م"; } catch (e) { return String(n) + " ج.م"; }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatSoft(items) {
  if (!items || !items.length) return "";
  return items.map(function (p) {
    var line = "• " + p.name;
    if (p.price != null) line += " بـ " + money(p.price);
    if (p.oldPrice && p.oldPrice > p.price) line += " (كانت " + money(p.oldPrice) + ")";
    return line;
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

function ctxText(history) {
  return (history || [])
    .filter(function (h) { return h && h.role === "user"; })
    .slice(-4)
    .map(function (h) { return String(h.content || ""); })
    .join(" ");
}

function pickProducts(list, keywords, budget, limit) {
  limit = limit || 3;
  var items = (list || []).filter(function (p) { return !p.hidden; });
  if (budget) items = items.filter(function (p) { return !p.price || Number(p.price) <= budget * 1.08; });
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

function humanReply(message, catalog, mode, history, siteName) {
  var t = String(message || "").trim();
  var list = Array.isArray(catalog) ? catalog.filter(function (p) { return !p.hidden; }) : [];
  var budget = extractBudget(t) || extractBudget(ctxText(history));
  var store = siteName || "عندنا";
  var prev = ctxText(history).toLowerCase();
  var all = (t + " " + prev).toLowerCase();

  if (mode === "admin") {
    if (/عرض|خصم/.test(t)) return "طيب بصي… من إضافة منتج اختاري تبويب العرض، هاتي المنتج، وحطي السعر الجديد أو عرض القطعتين/التلاتة، واحفظي. لو حابة أمشي معاكِ خطوة خطوة قولي.";
    if (/طلب|تسليم/.test(t)) return "أيوة من الطلبات… أول ما توصّلي وتأكدي التسليم، المبلغ يدخل في الإحصائيات. تقدري كمان تمسحي طلبات قديمة لو مش محتاجاها.";
    return "قولي عايزة نعمل إيه دلوقتي: منتجات، عروض، ولا طلبات؟ وأنا أقولكِ تعملي إيه بالظبط.";
  }

  // pure greeting
  if (/^(ازيك|ازيكم|أهلا|اهلا|مرحبا|السلام|هاي|hi|hello|صباح|مساء)[\s!?.]*$/i.test(t) || t.length < 3) {
    return pick([
      "أهلاً أهلاً 😊 أنا نورا… قولي بتفكري في إيه النهاردة؟",
      "يا أهلاً بيكِ! موجوده معاكِ… شنطة؟ هدوم؟ ولا لسه بتلفّي؟",
      "هاي 💕 نورتِ " + store + ". تحبي أساعدك تختاري ولا عندكِ حاجة معينة في بالك؟"
    ]);
  }

  if (/شكرا|ميرسي|تسلم|ربنا يخلي|متشكره/.test(t)) {
    return pick([
      "العفو يا قمر 💕 أي وقت.",
      "ولا يهمك، دي حاجتي 😄 لو احتجتي حاجة صوتيلي.",
      "تسلميلي 🌸 لو حابة نكمل ندور على حاجة تانية قولي."
    ]);
  }

  if (/باي|مع السلامه|اشوفك|خلاص كده/.test(t)) {
    return "تمام يا قمر، أشوفك على خير 🌸 ولو رجعتي أنا هنا.";
  }

  if (/بنت|انسان|بشري|روبوت|ذكاء|بوت|مش حقيقي/.test(t)) {
    return "هههه طب اعتبريني صاحبتكِ في الشوب 😄 قولي عايزة إيه وأنا أديكِ رأي صريح.";
  }

  if (/واتس|تليفون|رقم|تواصل/.test(t)) {
    return "آه طبعًا… كلّمينا على واتساب 01064519541 ولو حابة تطلبي من هنا برضه السِلّة جاهزة.";
  }

  if (/طلب|اوردر|سله|سلة|ازاي اطلب|كيف اطلب|عايزة اطلب/.test(t)) {
    return "بصي الموضوع بسيط أوي: اختاري القطعة واللون، حطيها في السِلّة، واكتبي اسمكِ ورقمكِ وعنوانكِ وخلاص.\nولو مش فاضيالكِ، ابعتي على 01064519541 وأنا أسهّلها عليكي.";
  }

  if (/لون|الوان|ألوان/.test(t)) {
    return "ايوة الألوان بتفرق… لو لقيتي دوائر ألوان تحت المنتج، اختاري اللي يريّحكِ الأول وبعدين حطي في السِلّة، عشان يوصلنا اللون صح.";
  }

  if (/غالي|رخيص|ميزانيتي ضعيف|معنديش|غاليه/.test(t)) {
    if (budget || list.length) {
      var cheap = pickProducts(list, [], budget || 500, 3);
      if (cheap.length) {
        return pick(["فاهمة//", "طب ماشي//"]).replace("//", "") + " خلينا في حاجة عملية:\n" + formatSoft(cheap) + "\nتحبي أدورلكِ أرخص شوية؟";
      }
    }
    return "فاهمة//".replace("//","") + " قولي ميزانيتكِ بالتقريب وأدورلكِ جوّاها من غير لف.";
  }

  if (/عرض|خصم|تخفيض|حرق/.test(t)) {
    var offers = list.filter(function (p) { return p.isOffer || (p.oldPrice && p.price && p.oldPrice > p.price); });
    if (offers.length) {
      return pick([
        "أيوة في حركات حلوة دلوقتي 👀\n",
        "بصي العروض اللي ماسكاها:\n"
      ]) + formatSoft(offers.slice(0, 4)) + "\nحاجة منهم قربت من ذوقكِ؟";
    }
    return "دلوقتي العروض بتتغير… قولي عايزة شنطة ولا هدوم وأشوفلكِ أحسن حاجة متاحة.";
  }

  var intents = [
    { re: /شنط|شنطة|حقيبة|bag/i, keys: ["شنط", "شنطة", "حقيبة", "bag"], label: "شنطة" },
    { re: /حذاء|شوز|كوتشي|سنيكر|صندل/i, keys: ["حذاء", "شوز", "كوتشي"], label: "حذاء" },
    { re: /فستان|بلوزة|تيشيرت|ملابس|هدوم|جينز|بنطلون|طقم/i, keys: ["ملابس", "فستان", "بلوزة", "تيشيرت"], label: "لبس" },
    { re: /ساعة|ساعات/i, keys: ["ساعة"], label: "ساعة" },
    { re: /نظارة|نظارات/i, keys: ["نظارة"], label: "نظارة" },
    { re: /اكسسوار|إكسسوار|خاتم|سلسلة|حلق/i, keys: ["اكسسوار", "إكسسوار"], label: "إكسسوار" }
  ];

  for (var i = 0; i < intents.length; i++) {
    if (intents[i].re.test(all)) {
      var items = pickProducts(list, intents[i].keys, budget, 3);
      var label = intents[i].label;
      if (items.length) {
        var open = budget
          ? pick([
              "تمام، في حدود " + money(budget) + " دول ناسبوكِ أوي:",
              "طيب على ميزانيتكِ… خدي بالِك من دول:",
              "لقيتلكِ كام اختيار حلو جوّا " + money(budget) + ":"
            ])
          : pick([
              "طيب على الـ" + label + "… دول أول ناس في بالي:",
              "حاضر، بصي رشّحتلكِ الحاجات دي:",
              "يلا نختار " + label + "… دول حلوين:"
            ]);
        var close = pick([
          "تحبي أضيّق على لون معيّن؟",
          "يومي ولا سهرات؟",
          "قربوا من اللي في بالكِ؟"
        ]);
        return open + "\n" + formatSoft(items) + "\n" + close;
      }
      return budget
        ? "ماشي على " + money(budget) + "… بس قولي ستايلكِ إيه بالظبط (كاجوال ولا شيك) عشان أدقّق."
        : "حاضر على الـ" + label + " 💕 ميزانيتكِ تقريبًا كام عشان منلفّش؟";
    }
  }

  if (budget) {
    var byB = pickProducts(list, [], budget, 3);
    if (byB.length) {
      return "طيب على " + money(budget) + " تقدري تبدأي بكده:\n" + formatSoft(byB) + "\nقولي شنطة ولا هدوم ولا حذاء وأكمل معاكِ.";
    }
    return "ميزانية " + money(budget) + " تمام… قولي النوع وبلاقيلكِ.";
  }

  if (/سعر|بكام|كام /.test(t) && list.length) {
    var sample = list.filter(function (p) { return p.price; }).sort(function (a, b) { return a.price - b.price; }).slice(0, 3);
    return "الأسعار عندنا بتختلف حسب القطعة… مثلًا:\n" + formatSoft(sample) + "\nميزانيته كام؟";
  }

  // small talk / unknown
  if (list.length) {
    return pick([
      "فهمتكِ… بس خليني أركز أحسن: عايزة شنطة، هدوم، ولا حذاء؟ ولو ميزانية قوليها.",
      "تمام، قوليلِ أكتر شوية. مثال: «شنطة بيج تحت ٥٠٠» وأنا أمسكها من الآخر.",
      "أنا معاكِ 😊 قولي النوع والميزانية وأرتّبلكِ اختيارات من غير صداع."
    ]);
  }

  return "أنا نورا من " + store + "… قولي عايزة إيه وأساعدك كإننا بنتكلم عادي 💕\nأو واتساب 01064519541";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ ok: true, style: "human-local" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    var body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    var message = body.message;
    if (!message || typeof message !== "string") return res.status(400).json({ error: "Message required" });

    return res.status(200).json({
      reply: humanReply(message, body.catalog, body.mode, body.history, body.siteName),
      provider: "local"
    });
  } catch (e) {
    console.error(e);
    return res.status(200).json({
      reply: "معلش حصلت لخبطة بسيطة 😅 قولي تاني وأنا معاكِ.",
      provider: "error"
    });
  }
}
