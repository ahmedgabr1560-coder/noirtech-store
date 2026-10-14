import { resilientChat } from "./_ai.js";

const SYSTEM = `أنت «نورا» مساعدة متجر الموضة الذكية في مصر (NEXORA / اسم الموقع الحالي).

شخصيتك تفاعلية جدًا:
- مصرية خفيفة الدم، بتهزر وتجاوب بسرعة، ودودة وذكية.
- بتتكلم عامية مصرية، مش روبوت رسمي.
- بتتفاعلي: تسألي، تقتري، تشجعي، وتكملي الحوار مش رد واحد وبس.
- بتفتكري سياق المحادثة (history) وترجعي عليه.

أسلوب الرد التفاعلي:
1) افتحي بجملة حيّة (مش قالب مكرر كل مرة).
2) ادّي فائدة عملية (ترشيح / مقارنة / ميزانية).
3) اختمي بسؤال واحد واضح عشان المحادثة تكمل.
4) استخدمي إيموجي باعتدال (١–٣).
5) لو الكتالوج موجود: اذكري أسماء وأسعار حقيقية منه.
6) لو العميل متردد: ادّي خيارين بس بوضوح.
7) للطلب: وجّهي للسلة أو واتساب 01064519541.

قواعد:
- عربي مصري.
- متختراعش أسعار مش في الكتالوج.
- متقولش إنك نموذج تجريبي أو fallback.
- خلي الرد ٢–٧ جمل، مش فقرة طويلة مملة.`;

const ADMIN_SYSTEM = `أنت مساعد إداري ذكي لمتجر NEXORA (موضة وأزياء في مصر).
تساعد صاحب المتجر في: إدارة المنتجات، العروض، الطلبات، الألوان، المخزون، التسويق، والرد على العملاء.
ردي بالعامية المصرية، واضح ومباشر، خطوات عملية.
لو سألت عن شيء تقني في اللوحة: أشرحي أين يضغط (إضافة منتج / العروض / الطلبات / الإحصائيات).
متختراعش أرقام مبيعات حقيقية لو مش متاحة.`;

function money(n) {
  try { return Number(n).toLocaleString("ar-EG") + " ج.م"; } catch { return n + " ج.م"; }
}

function pickFromCatalog(list, cats, limit = 4) {
  const catSet = new Set((cats || []).map(c => String(c).toLowerCase()));
  const scored = (list || []).filter(p => !p.hidden).map(p => {
    const c = String(p.category || "").toLowerCase();
    const name = String(p.name || "");
    let score = 0;
    if (catSet.has(c)) score += 3;
    for (const k of catSet) {
      if (name.toLowerCase().includes(k)) score += 1;
    }
    return { p, score };
  }).filter(x => x.score > 0);
  scored.sort((a, b) => b.score - a.score || (a.p.price || 0) - (b.p.price || 0));
  return scored.slice(0, limit).map(x => x.p);
}

function formatList(items) {
  if (!items.length) return "";
  return items.map((p, i) => `${i + 1}) ${p.name}${p.price ? ` — ${money(p.price)}` : ""}`).join("\n");
}

function extractBudget(t) {
  const m = String(t).replace(/,/g, "").match(/(\d{3,7})\s*(الف|ألف|k)?/i);
  if (!m) return null;
  let n = Number(m[1]);
  if (m[2]) n = n < 1000 ? n * 1000 : n;
  return n;
}


function localSmartReply(message, catalog, mode) {
  const t = String(message || "").trim();
  const low = t.toLowerCase();
  const list = Array.isArray(catalog) ? catalog.filter(p => !p.hidden) : [];
  const budget = extractBudget(t);

  // —— وضع الإدارة ——
  if (mode === "admin") {
    if (/عرض|خصم|bundle|قطعت/.test(t)) {
      return "لإضافة عرض من منتج موجود:\n1) لوحة التحكم → إضافة منتج\n2) اختاري «② عرض / خصم»\n3) اختاري المنتج من القائمة\n4) حطي سعر القطعة بعد الخصم و/أو ٢ قطع بسعر… و ٣ قطع بسعر…\n5) احفظي — هيظهر في قسم العروض على الموقع.";
    }
    if (/طلب|تسليم|مسلّم|احص|مبيع/.test(t)) {
      return "متابعة الطلبات:\n• الطلبات → غيّري الحالة أو اضغطي «تأكيد التسليم»\n• أول ما يتأكد التسليم، المبلغ يدخل في «مبيعات المسلّم» وصافي الربح\n• تقدري تحذفي طلب قديم أو تمسحي كل الطلبات من نفس الصفحة.";
    }
    if (/منتج|اضاف|صورة|لون|مخزون/.test(t)) {
      return "إضافة منتج عادي:\n1) إضافة منتج → «① منتج عادي»\n2) الاسم، السعر، القسم، الألوان، المخزون، الصورة من المعرض\n3) احفظي\nلو عايزة عرض مش منتج جديد: استخدمي تبويب العروض واختارى منتج موجود.";
    }
    if (/ذكاء|ai|شات|مفتاح|openai|رصيد/.test(low)) {
      return "الشات شغال مجانًا بالوضع المحلي الذكي دلوقتي.\nلو حابة ذكاء أقوى بدون ما تدفعي كتير: اعملي مفتاح مجاني من Google AI Studio (Gemini) وحطيه في Vercel باسم GEMINI_API_KEY — مجاني لحد حد يومي كويس.";
    }
    return "أنا مساعدة الإدارة 💼 قولي عايزة تظبطي إيه:\n• إضافة منتج / عرض\n• الطلبات والتسليم\n• الألوان والمخزون\n• صياغة رد لعميلة\nهديكِ الخطوات بالظبط.";
  }

  // —— وضع العملاء ——
  const greet = /ازيك|أهلا|اهلا|مرحبا|السلام|هاي|hello|hi/.test(low) || t.length < 3;
  if (greet && !/شنط|حذاء|فستان|تيشيرت|عرض/.test(t)) {
    return "أهلاً بيكِ في NEXORA ✨ أنا نورا.\nتحبي نبدأ بشنطة، ملابس، حذاء، ولا إكسسوار؟ ولو ميزانيتكِ جاهزة اكتبيها وأنا أفلترلكِ.";
  }

  if (/سعر|بكام|كام\s|تمن/.test(t) && list.length) {
    const items = list.slice(0, 5);
    return "حاضر 👇 دي أمثلة من الأسعار الحالية:\n" + formatList(items) + "\nقولي ميزانيتك أو نوع المنتج وأدقّق أكتر.";
  }

  if (/عرض|خصم|تخفيض/.test(t)) {
    const offers = list.filter(p => p.isOffer || (p.oldPrice && p.price && p.oldPrice > p.price)).slice(0, 5);
    if (offers.length) return "العروض المتاحة دلوقتي 🔥\n" + formatList(offers) + "\nادخلي قسم العروض أو قولي ميزانيتك.";
    return "العروض بتتحدث من لوحة التحكم. ادخلي قسم «العروض» في الموقع، أو قولي عايزة شنطة/ملابس/حذاء وأرشّحلكِ.";
  }

  if (/طلب|اوردر|توصيل|شحن|واتس|تليفون|رقم/.test(t)) {
    return "الطلب سهل 🛒\n1) أضيفي للسلة (واختاري اللون لو مطلوب)\n2) اكتبي الاسم والموبايل والعنوان\n3) إتمام الطلب\nللتواصل السريع: واتساب 01064519541";
  }

  if (/لون|الوان|ألوان/.test(t)) {
    return "معظم المنتجات ليها ألوان — افتحي صفحة المنتج واختاري اللون (إجباري قبل الإضافة للسلة). لو منتج معيّن قولي اسمه.";
  }

  // categories keywords
  const map = [
    [["شنط", "شنطة", "bag", "حقيبة"], ["bag", "bags", "handbag", "شنط"]],
    [["حذاء", "شوز", "كوتشي", "سنيكر"], ["shoes", "shoe", "حذاء"]],
    [["فستان", "بلوزة", "تيشيرت", "قميص", "ملابس", "هدوم"], ["women", "men", "kids", "ملابس"]],
    [["ساعة", "ساعات"], ["watch", "watches"]],
    [["نظارة", "نظارات"], ["eyewear", "glasses"]],
    [["اكسسوار", "إكسسوار", "خاتم", "سلسلة"], ["accessories", "acc"]]
  ];
  for (const [words, tags] of map) {
    if (words.some(w => t.includes(w) || low.includes(w))) {
      let items = pickFromCatalog(list, tags, 5);
      if (!items.length) items = list.filter(p => words.some(w => String(p.name||"").includes(w))).slice(0, 5);
      if (budget) items = (items.length ? items : list).filter(p => Number(p.price||0) <= budget + 50).slice(0, 5);
      if (items.length) {
        return `تمام! ترشيحات تناسب «${words[0]}»${budget ? " في حدود " + money(budget) : ""}:\n${formatList(items)}\nتحبي لون معيّن أو مقاس؟`;
      }
      return `حاضر بخصوص ${words[0]} ✨ الميزانية كام تقريبًا وأرشّحلكِ أسرع؟ أو ابحثي من شريط البحث فوق.`;
    }
  }

  if (budget) {
    const items = list.filter(p => Number(p.price || 0) > 0 && Number(p.price) <= budget).slice(0, 6);
    if (items.length) return `في حدود ${money(budget)} تقدري تختاري:\n${formatList(items)}\nقولي شنطة ولا ملابس ولا حذاء؟`;
    return `ميزانية ${money(budget)} تمام — قولي النوع (شنطة / ملابس / حذاء) وأدورلكِ الأنسب.`;
  }

  if (/شكرا|ميرسي|تسلم/.test(t)) return "العفو يا قمر 💕 لو احتجتي أي حاجة تاني نورة هنا.";

  // generic help with catalog sample
  if (list.length) {
    const sample = list.slice(0, 4);
    return "قولي بوضوح أكتر وأنا أساعدك 💡\nمثال: «شنطة بيج تحت 500» أو «عرض على الأحذية»\nمن المتاح حاليًا:\n" + formatList(sample);
  }
  return "أنا نورا مساعدة NEXORA ✨\nقولي: نوع المنتج + الميزانية (لو حابة) وأرشّحلكِ.\nأو تواصلي واتساب: 01064519541";
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
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      freeLocal: true,
      mode: process.env.GEMINI_API_KEY ? "gemini-or-local" : "free-local"
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { message, history, catalog, mode } = body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const messages = [
      ...(Array.isArray(history) ? history.slice(-16) : []),
      { role: "user", content: message.slice(0, 2500) }
    ];

    let system = (mode === 'admin') ? ADMIN_SYSTEM : SYSTEM;
    if (Array.isArray(catalog) && catalog.length) {
      const sample = catalog.slice(0, 40).map(p => `#${p.id || ""} ${p.name} | ${p.category} | ${p.price}`).join("\n");
      system += `\n\nكتالوج مختصر من المتجر (استخدمه في الترشيح):\n${sample}`;
    }

    // مجاني افتراضيًا: رد محلي ذكي بدون رصيد مدفوع
    // لو حابة محركات خارجية مجانية (Gemini) خليه يحاول الأول لما المفتاح يكون موجود
    const preferExternal = process.env.AI_PREFER_EXTERNAL === "1" || process.env.GEMINI_API_KEY;
    if (preferExternal) {
      try {
        const result = await resilientChat(system, messages, 700);
        return res.status(200).json({ reply: result.reply, provider: result.provider || "ai" });
      } catch (aiError) {
        console.error("AI providers failed:", aiError.message);
        return res.status(200).json({
          reply: localSmartReply(message, catalog, mode),
          provider: "local",
          note: "free-local",
          error: String(aiError.message || aiError).slice(0, 180)
        });
      }
    }
    return res.status(200).json({
      reply: localSmartReply(message, catalog, mode),
      provider: "local",
      note: "free-local"
    });
  } catch (e) {
    console.error(e);
    return res.status(200).json({
      reply: "حصلت لخبطة بسيطة 😅 جرّبي تاني أو قولي: شنطة / ملابس / حذاء وميزانيتك.",
      provider: "error"
    });
  }
}
