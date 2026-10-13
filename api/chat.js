import { resilientChat } from "./_ai.js";

const SYSTEM = `أنت «نورا» مساعدة NEXORA الذكية لمتجر الموضة والأزياء في مصر.

شخصيتك:
- مصرية خفيفة الدم، بتهزر باعتدال، ودودة وذكية.
- بتتكلم عامية مصرية مفهومة، مش فصحى ثقيلة.
- بتضحك وتمزح لما يناسب، ومن غير ما تخرج عن المهمة.
- هدفك تساعد العميل يختار بسرعة ويطلب بسهولة.

أسلوب الرد:
1) رد حيوي ومفيد (٢–٦ جمل).
2) لو ناقص ميزانية أو استخدام: اسأل سؤال واحد واضح.
3) اقترح منتجات/فئات من الكتالوج لو متاح.
4) استخدم إيموجي باعتدال.
5) عند الطلب: وجّه للسلة بعد تسجيل الدخول، أو واتساب 01064519541.

المنتجات: ملابس، شنط، أحذية، ساعات، نظارات، إكسسوارات موضة.
التواصل: 01064519541 | ahmedgabr1560@gmail.com
الموقع: NEXORA

قواعد مهمة:
- عربي مصري.
- متختراعش أسعار دقيقة لو مش موجودة في الكتالوج.
- متقولش إنك نموذج تجريبي.
- لو سأل عن مقارنة، ادّي نقاط عملية قصيرة.`;

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

function localSmartReply(message, catalog) {
  const t = String(message || "");
  const low = t.toLowerCase();
  const list = Array.isArray(catalog) ? catalog : [];
  const budget = extractBudget(t);

  const jokes = [
    "على رأيك 😄",
    "تمام يا وحش 🔥",
    "خليني أ facilitلك الاختيار ✨",
  ];
  // avoid broken arabic in jokes
  const opener = ["تمام 😄", "حاضر 🔥", "يلا نختار بذوق ✨", "أوكيه 👌"][Math.floor(Math.random() * 4)];

  if (/مرحبا|اهلا|أهل|السلام|hello|hi|هاي|ازيك|إزيك|صباح|مساء/.test(low)) {
    return "أهلاً بيكِ في NEXORA 👋 أنا نورا مساعدة المتجر.\nتحبي نبدأ بشنطة، ملابس، أحذية، ولا إكسسوار؟ ولو عندكِ ميزانية اكتبيها وأنا أفلتر.";
  }
  if (/شكر|تسلم|ممتاز|رائع|جامد/.test(low)) {
    return "العفو يا غالي 🙌 لو حابب نكمّل اختيار أو نعمل طلب من السلة قولي وأنا معاك.";
  }
  if (/انسان|بشري|مين انت|انت مين|ai|ذكاء/.test(low)) {
    return "أنا نورا 🤖 مساعدة NEXORA الذكية — هنا عشان تسهّل عليك الاختيار والشراء. تحب نبدأ بإيه؟";
  }

  if (/شحن|توصيل|مواعيد|كام يوم/.test(low)) {
    return "الشحن داخل مصر ✅ والتوصيل حسب المنطقة.\nتقدر تطلب من السلة بعد تسجيل الدخول، أو واتساب: 01064519541";
  }
  if (/ضمان|ارجاع|إرجاع|استبدال/.test(low)) {
    return "الأجهزة أصلية ومعاها ضمان حسب نوع المنتج ✅\nلو حابب تفاصيل منتج معيّن ابعت اسمه.";
  }
  if (/طلب|اشتري|ادفع|سلة|checkout/.test(low)) {
    return "تمام! اختار المنتج → أضفه للسلة → سجّل دخول → أتمم الطلب.\nولو حابب مساعدة سريعة: واتساب 01064519541";
  }

  // Category intents
  const intents = [
    { re: /شنط|شنطة|حقيبة|bag|bags/, cats: ["fashion", "bags"], label: "شنط 👜" },
    { re: /فستان|بلوزة|تيشيرت|جاكيت|ملابس|حريمي|رجالي|كاجوال|dress|shirt/, cats: ["fashion", "women-fashion", "men-fashion"], label: "ملابس 👗" },
    { re: /حذاء|كوتشي|سنيكر|شبشب|shoe|shoes/, cats: ["fashion", "shoes"], label: "أحذية 👠" },
    { re: /ساعه|ساعة|watch/, cats: ["fashion", "watches"], label: "ساعات ⌚" },
    { re: /نظار|glasses|eyewear/, cats: ["fashion", "eyewear"], label: "نظارات 🕶️" },
    { re: /اكسسوار|إكسسوار|خاتم|حلق|accessory/, cats: ["fashion", "fashion-accessories"], label: "إكسسوارات ✨" },
  ];

  for (const intent of intents) {
    if (intent.re.test(low)) {
      let items = pickFromCatalog(list, intent.cats, 5);
      if (budget) {
        const near = items.filter(p => p.price && p.price <= budget * 1.05);
        if (near.length) items = near;
        else {
          const under = list.filter(p => intent.cats.includes(String(p.category || "").toLowerCase()) && p.price && p.price <= budget)
            .sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5);
          if (under.length) items = under;
        }
      }
      const block = formatList(items);
      if (block) {
        return `${opener} من ${intent.label} عندنا مثلًا:\n${block}\n\n${budget ? `ميزانيتك حوالي ${money(budget)} — ` : ""}قولي استخدامك (ألعاب/شغل/يومي) وأضيقلك الاختيار.`;
      }
      return `${opener} قسم ${intent.label} متاح في المتجر.\n${budget ? `ميزانيتك ${money(budget)} — ` : ""}قولي تفضيلاتك وأرشّحلك.`;
    }
  }

  if (/عرض|خصم|رخيص|تخفيض/.test(low)) {
    const deals = list.filter(p => p.oldPrice && p.price && p.oldPrice > p.price).slice(0, 5);
    const block = formatList(deals);
    return block
      ? `العروض حالياً 🔥\n${block}\nحابب فئة معيّنة؟`
      : "العروض تتغير باستمرار 🔥 قولي الفئة وميزانيتك وأدورلك أفضل قيمة.";
  }

  if (/قارن|فرق|ولا |أنسب|افضل|أفضل/.test(low)) {
    return "حاضر نقارن بذوق 🔍 ابعت اسمين منتجات أو قولي الاستخدام (ألعاب/تصوير/شغل) وميزانيتك وأقولك الأنسب.";
  }

  // generic with catalog hints
  const top = list.slice(0, 3);
  const hint = formatList(top);
  return `${opener} قولي عايزة مساعدة في إيه: شنطة، ملابس، أحذية، ولا إكسسوار؟\nولو عندك ميزانية اكتبها وأنا أفلتر على طول.${hint ? `\n\nمن المميز عندنا:\n${hint}` : ""}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { message, history, catalog } = body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const messages = [
      ...(Array.isArray(history) ? history.slice(-16) : []),
      { role: "user", content: message.slice(0, 2500) }
    ];

    let system = SYSTEM;
    if (Array.isArray(catalog) && catalog.length) {
      const sample = catalog.slice(0, 40).map(p => `#${p.id || ""} ${p.name} | ${p.category} | ${p.price}`).join("\n");
      system += `\n\nكتالوج مختصر من المتجر (استخدمه في الترشيح):\n${sample}`;
    }

    try {
      const result = await resilientChat(system, messages, 700);
      return res.status(200).json({ reply: result.reply, provider: result.provider || "ai" });
    } catch (aiError) {
      console.error("AI providers failed:", aiError.message);
      return res.status(200).json({
        reply: localSmartReply(message, catalog),
        provider: "local",
        note: "fallback"
      });
    }
  } catch (e) {
    console.error(e);
    return res.status(200).json({
      reply: "حصلت لخبطة بسيطة 😅 جرّبي تاني أو قولي: شنطة / ملابس / حذاء وميزانيتك.",
      provider: "error"
    });
  }
}
