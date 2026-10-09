import { resilientChat } from "./_ai.js";

const SYSTEM = `أنت مساعد NEXORA الذكي لمتجر إلكترونيات في مصر.

شخصيتك:
- ودود، خفيف دم باعتدال، عامية مصرية.
- تساعد العميل يختار منتج بسرعة ووضوح.

أسلوب الرد:
1) رد قصير ومفيد.
2) اسأل عن الميزانية أو الاستخدام لو ناقص.
3) اقترح فئة أو منتج مناسب.
4) عند الطلب وجّه للسلة أو واتساب: 01064519541

المنتجات: موبايلات، لابتوبات، شاشات، أجهزة منزلية، إكسسوارات.
شحن داخل مصر، تواصل: 01064519541 | ahmedgabr1560@gmail.com

قواعد: عربي، 2–5 جمل، بدون اختراع أسعار دقيقة لو مش متاحة.`;

function localSmartReply(message, catalog) {
  const t = String(message || "").toLowerCase();
  const list = Array.isArray(catalog) ? catalog : [];

  function pick(cat, limit = 3) {
    return list
      .filter(p => (p.category || "").includes(cat) || (p.name || "").toLowerCase().match(new RegExp(cat, "i")))
      .slice(0, limit)
      .map(p => p.name + (p.price ? ` (~${Number(p.price).toLocaleString("ar-EG")} ج.م)` : ""))
      .join(" · ");
  }

  if (/هاتف|موبايل|ايفون|آيفون|سامسونج|phone|iphone|galaxy|pixel/.test(t)) {
    const s = pick("phone") || pick("phones");
    return s
      ? `تمام 📱 من الموبايلات عندنا مثلاً:\n${s}\nقولي ميزانيتك وأرشّح الأدق.`
      : "في قسم الموبايلات تشكيلة كبيرة 📱 قولي ميزانيتك؟";
  }
  if (/لابتوب|لاب|ماك|macbook|laptop|جهاز/.test(t)) {
    const s = pick("laptop");
    return s
      ? `اللابتوبات متاحة 💻 مثل:\n${s}\nشغل ولا ألعاب؟`
      : "اللابتوبات جاهزة 💻 تحب خفيف للشغل ولا قوي للألعاب؟";
  }
  if (/سماع|ايربود|airpods|هيدفون|صوت|jbl|sony|buds/.test(t)) {
    return "الصوتيات عندنا سماعات رأس وأذن 🎧 تحب عزل ضوضاء ولا سماعة صغيرة؟";
  }
  if (/ساع|watch|ساعة|garmin|fitbit|band/.test(t)) {
    return "الساعات الذكية موجودة ⌚ رياضة ولا استخدام يومي؟";
  }
  if (/شاشة|monitor|عرض/.test(t) && !/عرض/.test(t)) {
    return "الشاشات متوفرة للشغل والألعاب 🖥️ قولي المقاس التقريبي؟";
  }
  if (/عرض|خصم|رخيص|سعر|بكام/.test(t)) {
    return "العروض تتغير حسب المنتج 🔥 قولي الفئة (موبايل/لابتوب/سماعة) وميزانيتك.";
  }
  if (/شحن|توصيل|ضمان|ارجاع|إرجاع|طلب/.test(t)) {
    return "الشحن داخل مصر ✅ والطلب من السلة بعد تسجيل الدخول.\nواتساب: 01064519541";
  }
  if (/مرحبا|اهلا|أهل|السلام|hello|hi|هاي|ازيك|إزيك/.test(t)) {
    return "أهلاً بيك في NEXORA 👋 أنا مساعدك.\nتحب موبايل، لابتوب، شاشة، ولا إكسسوار؟";
  }
  return "حاضر 😄 قولي عايز مساعدة في إيه: موبايل، لابتوب، شاشة، ولا إكسسوار؟ ولو عندك ميزانية اكتبها.";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history, catalog } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const messages = [
      ...(Array.isArray(history) ? history.slice(-12) : []),
      { role: "user", content: message.slice(0, 2000) }
    ];

    // Enrich system with a few catalog samples when available
    let system = SYSTEM;
    if (Array.isArray(catalog) && catalog.length) {
      const sample = catalog.slice(0, 25).map(p => `${p.name} | ${p.category} | ${p.price}`).join("\n");
      system += `\n\nعينة من كتالوج المتجر:\n${sample}`;
    }

    try {
      const result = await resilientChat(system, messages, 500);
      return res.status(200).json({ reply: result.reply, provider: result.provider });
    } catch (aiError) {
      console.error("AI providers failed:", aiError.message);
      return res.status(200).json({
        reply: localSmartReply(message, catalog),
        provider: "local",
        note: "fallback"
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(200).json({ reply: localSmartReply("", []) });
  }
}
