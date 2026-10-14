import { resilientChat } from "./_ai.js";

const SYSTEM = `أنتِ «نورا» مساعدة مبيعات ودودة لمتجر موضة في مصر.

الشخصية:
- بنت مصرية خفيفة الدم، ذكية، بتتكلم عامية مصرية طبيعية.
- بتحمّسي العميل من غير مبالغة تقيلة.
- بتهزري جملة بسيطة لو المناسبة تسمح، وبعدين ترجعي للمهم.

طريقة الرد:
1) افتحي بجملة مختلفة كل مرة (متكرريش نفس الجملة).
2) افهمي هي عايزة إيه: شنطة / ملابس / حذاء / عرض / طلب / ميزانية.
3) لو في كتالوج: رشّحي ٢–٤ منتجات بأسعارها الحقيقية فقط.
4) لو ناقص معلومة: اسألي سؤال واحد بس (لون؟ ميزانية؟ استخدام يومي ولا سهرات؟).
5) اختمي بجملة تفتح حوار أو خطوة واضحة (أضيفي للسلة / اختاري لون / ابعتي رقم).
6) الرد قصير: ٣–٦ جمل أو نقاط مرتبة. إيموجي ١–٣ بس.

ممنوع:
- اختراع أسعار أو منتجات مش في الكتالوج.
- تقولي إنكِ نموذج تجريبي أو fallback.
- فقرات طويلة مملة.
- فصحى ثقيلة.

التواصل: واتساب 01064519541
الطلب: من السلة على الموقع بعد اختيار اللون لو مطلوب.`;

const ADMIN_SYSTEM = `أنتِ مساعدة إدارة لمتجر موضة (لوحة التحكم).
ردي بالعامية المصرية، خطوات مرقمة وواضحة.
مواضيعك: إضافة منتج، عمل عرض (خصم أو ٢/٣ قطع)، الطلبات والتسليم، الألوان والمخزون، الإحصائيات، اسم الموقع.
متختراعيش أرقام مبيعات.`;

function money(n) {
  try { return Number(n).toLocaleString("ar-EG") + " ج.م"; } catch { return n + " ج.م"; }
}

function formatList(items) {
  if (!items.length) return "";
  return items.map((p, i) => {
    const price = p.price != null ? money(p.price) : "";
    const old = p.oldPrice && p.oldPrice > p.price ? ` (بدل ${money(p.oldPrice)})` : "";
    return `${i + 1}) ${p.name}${price ? " — " + price : ""}${old}`;
  }).join("\n");
}

function extractBudget(t) {
  const s = String(t).replace(/,/g, "");
  const m = s.match(/(\d{2,7})\s*(الف|ألف|k|ج|جنيه)?/i);
  if (!m) return null;
  let n = Number(m[1]);
  if (m[2] && /الف|ألف|k/i.test(m[2]) && n < 1000) n *= 1000;
  if (n > 0 && n < 50) return null;
  return n;
}

function lastUserTopics(history) {
  const texts = (history || [])
    .filter(h => h && h.role === "user")
    .slice(-3)
    .map(h => String(h.content || ""));
  return texts.join(" ");
}

function scoreProduct(p, keywords) {
  const name = String(p.name || "").toLowerCase();
  const cat = String(p.category || "").toLowerCase();
  const sub = String(p.subcategory || "").toLowerCase();
  const brand = String(p.brand || "").toLowerCase();
  let score = 0;
  for (const k of keywords) {
    const kk = String(k).toLowerCase();
    if (!kk) continue;
    if (name.includes(kk)) score += 4;
    if (cat.includes(kk)) score += 2;
    if (sub.includes(kk)) score += 2;
    if (brand.includes(kk)) score += 1;
  }
  if (p.isOffer || (p.oldPrice && p.price && p.oldPrice > p.price)) score += 1;
  return score;
}

function pickProducts(list, keywords, budget, limit = 4) {
  let items = (list || []).filter(p => !p.hidden);
  if (budget) items = items.filter(p => !p.price || Number(p.price) <= budget * 1.05);
  const scored = items.map(p => ({ p, s: scoreProduct(p, keywords) })).filter(x => x.s > 0);
  scored.sort((a, b) => b.s - a.s || Number(a.p.price || 0) - Number(b.p.price || 0));
  let out = scored.slice(0, limit).map(x => x.p);
  if (!out.length && budget) {
    out = items.filter(p => p.price).sort((a, b) => a.price - b.price).slice(0, limit);
  }
  if (!out.length) out = (list || []).filter(p => !p.hidden).slice(0, limit);
  return out;
}

function localSmartReply(message, catalog, mode, history, siteName) {
  const t = String(message || "").trim();
  const low = t.toLowerCase();
  const ctx = (t + " " + lastUserTopics(history)).toLowerCase();
  const list = Array.isArray(catalog) ? catalog.filter(p => !p.hidden) : [];
  const budget = extractBudget(t) || extractBudget(lastUserTopics(history));
  const store = siteName || "المتجر";

  if (mode === "admin") {
    if (/عرض|خصم|قطعت|bundle/.test(t)) {
      return "حاضر 💼 عشان تعملي عرض:\n1) إضافة منتج → «عرض / خصم»\n2) اختاري المنتج الأساسي\n3) حطي سعر بعد الخصم و/أو ٢ قطع بسعر و٣ قطع بسعر\n4) احفظي — يظهر في قسم العروض\nتحبي أوضحلكِ خصم القطعة ولا عرض الكمية؟";
    }
    if (/طلب|تسليم|مسل/.test(t)) {
      return "من تبويب الطلبات:\n• غيّري الحالة أو اضغطي «تأكيد التسليم»\n• الطلبات المسلّمة بتتحسب في مبيعات المسلّم\n• تقدري تحذفي طلب قديم\nفي طلب معيّن عالقة معاكِ؟";
    }
    if (/منتج|اضاف|صور|لون|مخزون/.test(t)) {
      return "إضافة منتج:\n1) إضافة منتج → منتج عادي\n2) الاسم والسعر والقسم والألوان والمخزون والصورة\n3) احفظي\nلو هتعملي خصم على منتج موجود استخدمي تبويب العروض.";
    }
    return "قولي عايزة تظبطي إيه بالظبط: منتجات، عروض، طلبات، ولا الإحصائيات؟ وأديكِ الخطوات.";
  }

  // greetings
  if (/^(ازيك|ازيكم|أهلا|اهلا|مرحبا|السلام|هاي|hello|hi|صباح|مساء)\b/i.test(t) || t.length < 4) {
    const opens = [
      `أهلاً بيكِ في ${store} ✨ أنا نورا، معاكي تختارني إيه النهاردة؟`,
      `يا أهلاً 💕 نورة معاكِ — شنطة، ملابس، حذاء، ولا ندوّر على عرض؟`,
      `نورتِ 🌟 قولي ميزانيتك أو النوع اللي في بالك وأرشّحلكِ بسرعة.`
    ];
    return opens[Math.floor(Math.random() * opens.length)];
  }

  if (/شكرا|ميرسي|تسلم|ربنا يخلي/.test(t)) {
    return "العفو يا قمر 💕 لو احتجتي أي حاجة تاني أنا هنا. تحبي أساعدك في حاجة كمان؟";
  }

  if (/واتس|تليفون|رقم|تواصل|فون/.test(t)) {
    return "رقم التواصل واتساب: 01064519541 📞\nتقدري كمان تطلبي من السلة على الموقع مباشرة بعد ما تختاري المنتج واللون.";
  }

  if (/طلب|اوردر|سله|سلة|اشتري|كيف اطلب|ازاي اطلب/.test(t)) {
    return "الطلب سهل جدًا 🛒\n1) افتحي المنتج واختاري اللون (لو موجود)\n2) أضيفي للسلة والكمية\n3) اكتبي الاسم والموبايل والعنوان → إتمام الطلب\nولو حابة نسهّلها: واتساب 01064519541";
  }

  if (/لون|الوان|ألوان/.test(t)) {
    return "أيوا الألوان مهمة 🎨\nلو المنتج له ألوان، لازم تختاري لون قبل الإضافة للسلة، واللون بيظهر في الطلب.\nفتحى المنتج ودوري على دوائر الألوان تحت السعر.";
  }

  if (/شحن|توصيل|متى|امتى يوصل/.test(t)) {
    return "التوصيل حسب المنطقة وعادةً يتم التواصل لتأكيد الميعاد 🚚\nاكتبي عنوانكِ عند إتمام الطلب، ولو عايزة تسألي على منطقة معيّنة ابعتي على واتساب 010645519541".replace("010645519541","01064519541");
  }

  if (/عرض|خصم|تخفيض|تخفيضات/.test(t)) {
    const offers = list.filter(p => p.isOffer || (p.oldPrice && p.price && Number(p.oldPrice) > Number(p.price)));
    if (offers.length) {
      return `العروض المتاحة دلوقتي 🔥\n${formatList(offers.slice(0, 5))}\nتحبي عرض لشنط ولا ملابس؟`;
    }
    return "دلوقتي ممكن تدوري قسم العروض في الموقع 🔥\nقولي ميزانيتك ونوع القطعة وأدورلكِ أحسن خصم متاح.";
  }

  // intent keywords
  const intents = [
    { keys: ["شنط", "شنطة", "حقيبة", "bag", "handbag", "توت باج"], words: ["شنط", "شنطة", "حقيبة", "bag"] },
    { keys: ["حذاء", "شوز", "كوتشي", "سنيكر", "صندل", "shoe"], words: ["حذاء", "شوز", "كوتشي"] },
    { keys: ["فستان", "بلوزة", "تيشيرت", "قميص", "ملابس", "هدوم", "جينز", "بنطلون", "طقم"], words: ["ملابس", "فستان", "بلوزة", "تيشيرت"] },
    { keys: ["ساعة", "ساعات", "watch"], words: ["ساعة", "ساعات"] },
    { keys: ["نظارة", "نظارات"], words: ["نظارة"] },
    { keys: ["اكسسوار", "إكسسوار", "خاتم", "سلسلة", "حلق"], words: ["إكسسوار"] }
  ];

  for (const intent of intents) {
    if (intent.keys.some(k => ctx.includes(k))) {
      const items = pickProducts(list, intent.words.concat(intent.keys), budget, 4);
      const label = intent.words[0];
      if (items.length) {
        const head = budget
          ? `تمام! لـ«${label}» في حدود ${money(budget)} دي اقتراحاتي ✨`
          : `تمام! لـ«${label}» رشّحتلكِ دول ✨`;
        return `${head}\n${formatList(items)}\nتحبي لون معيّن أو استخدام يومي ولا سهرات؟`;
      }
      return budget
        ? `حاضر بخصوص ${label} في حدود ${money(budget)} 💫 قولي تفضيلي لون أو ستايل (كاجوال/رسمي) وأدقّق أكتر.`
        : `حاضر بخصوص ${label} 💫 ميزانيتك تقريبًا كام عشان أرشّحلكِ المناسب؟`;
    }
  }

  if (budget) {
    const items = pickProducts(list, [], budget, 5);
    if (items.length) {
      return `في حدود ${money(budget)} تقدري تبدأي بـ:\n${formatList(items)}\nقولي شنطة ولا ملابس ولا حذاء وأضيّق النتيجة.`;
    }
    return `ميزانية ${money(budget)} تمام 👍 قولي النوع (شنطة / ملابس / حذاء) وأدورلكِ الأنسب.`;
  }

  if (/غالي|رخيص|سعر|بكام|كام /.test(t) && list.length) {
    const sorted = [...list].filter(p => p.price).sort((a, b) => a.price - b.price).slice(0, 4);
    return `أمثلة على الأسعار الحالية 💸\n${formatList(sorted)}\nميزانيته كام وأرشّحلكِ جوّاها؟`;
  }

  // fallback with catalog taste
  if (list.length) {
    const sample = list.slice(0, 3);
    return `قولي أكتر شوية وأنا أساعدك أحسن 💡\nمثال: «شنطة بيج تحت 500» أو «فستان كاجوال»\nمن المتاح حاليًا:\n${formatList(sample)}`;
  }

  return `أنا نورا مساعدة ${store} ✨\nقولي النوع + الميزانية (لو حابة) وأرشّحلكِ.\nأو واتساب: 01064519541`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      openai: Boolean(process.env.OPENAI_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      freeLocal: true
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { message, history, catalog, mode, siteName } = body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const messages = [
      ...(Array.isArray(history) ? history.slice(-12) : []),
      { role: "user", content: message.slice(0, 2500) }
    ];

    let system = mode === "admin" ? ADMIN_SYSTEM : SYSTEM;
    if (siteName) system += `\n\nاسم المتجر الحالي: ${siteName}`;
    if (Array.isArray(catalog) && catalog.length) {
      const sample = catalog.slice(0, 50).map(p => {
        const off = p.isOffer ? " | عرض" : "";
        const old = p.oldPrice ? ` | قبل ${p.oldPrice}` : "";
        return `#${p.id || ""} ${p.name} | ${p.category || ""} | ${p.price}${old}${off}`;
      }).join("\n");
      system += `\n\nكتالوج المتجر (رشّحي منه فقط):\n${sample}`;
    }

    const preferExternal = process.env.AI_PREFER_EXTERNAL === "1" || process.env.GEMINI_API_KEY;
    if (preferExternal) {
      try {
        const result = await resilientChat(system, messages, 650);
        const reply = String(result.reply || "").trim();
        if (reply) return res.status(200).json({ reply, provider: result.provider || "ai" });
      } catch (aiError) {
        console.error("AI providers failed:", aiError.message);
        return res.status(200).json({
          reply: localSmartReply(message, catalog, mode, history, siteName),
          provider: "local",
          note: "local-after-ai-fail"
        });
      }
    }

    return res.status(200).json({
      reply: localSmartReply(message, catalog, mode, history, siteName),
      provider: "local",
      note: "smart-local"
    });
  } catch (e) {
    console.error(e);
    return res.status(200).json({
      reply: "حصلت لخبطة بسيطة 😅 قولي تاني: شنطة / ملابس / حذاء وميزانيتك.",
      provider: "error"
    });
  }
}
