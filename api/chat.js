import { resilientChat } from "./_ai.js";

const SYSTEM = `أنت "نوير"، المساعد الذكي لمتجر NoirTech للإلكترونيات الفاخرة في مصر.

شخصيتك:
- خفيف دم، بتضحك وتهزر بلطف.
- عامية مصرية مريحة.
- تساعد بوضوح بعد الهزار.

أسلوب الرد:
1) هزار/ابتسامة خفيفة.
2) إجابة مفيدة.
3) سؤال متابعة واحد (ميزانية؟ استخدام؟).
4) لو متردد: خيارين مع سبب.
5) وجّه للسلة أو واتساب/تليجرام.

المتجر: هواتف، لابتوبات، سماعات، ساعات.
شحن داخل مصر، ضمان أصلي، إرجاع 14 يوم.
تواصل: 01064519541 | ahmedgabr1560@gmail.com

قواعد: عربي 2–6 جمل، إيموجي باعتدال.`;

function localSmartReply(message) {
  const t = String(message || "").toLowerCase();
  if (/هاتف|موبايل|ايفون|آيفون|سامسونج|phone|iphone|galaxy/.test(t)) {
    return "يا وحش 😄 في قسم الهواتف عندنا تشكيلة حلوة من آيفون وسامسونج وشياومي.\nقولي ميزانيتك كام تقريبًا؟ وأنا أرشّحلك أنسب اختيار.";
  }
  if (/لابتوب|لاب|ماك|macbook|laptop|جهاز/.test(t)) {
    return "اللابتوبات عندنا جاهزة للشغل والألعاب 💻\nتحب جهاز خفيف للشغل، ولا قوي للألعاب؟";
  }
  if (/سماع|ايربود|airpods|هيدفون|صوت|jbl|sony/.test(t)) {
    return "الصوتيات دي حكاية 🎧\nعايز سماعة رأس بعزل ضوضاء، ولا سماعة أذن صغيرة؟";
  }
  if (/ساع|watch|ساعة|garmin|fitbit/.test(t)) {
    return "الساعات الذكية عندنا شيك وعملية ⌚\nرياضة وتدريب، ولا شكل أنيق يومي؟";
  }
  if (/عرض|خصم|رخيص|سعر|بكام/.test(t)) {
    return "العروض بتتحرك حسب المنتج 🔥\nقولي فئة إيه (هاتف/لابتوب/سماعة/ساعة) وميزانيتك، وأظبطلك أنسب صفقة.";
  }
  if (/شحن|توصيل|ضمان|ارجاع|إرجاع/.test(t)) {
    return "شحن داخل مصر ✅ ضمان أصلي ✅ وإرجاع خلال 14 يوم.\nتحب أساعدك تختار منتج دلوقتي؟";
  }
  if (/مرحبا|اهلا|أهلًا|السلام|hello|hi|هاي/.test(t)) {
    return "أهلاً بيك في NoirTech 👋 أنا نوير.\nتحب نبدأ بهاتف، لابتوب، سماعة، ولا ساعة؟";
  }
  return "تمام 😄 قولي عايز مساعدة في إيه بالظبط: هاتف، لابتوب، سماعة، ولا ساعة؟\nولو عندك ميزانية قولي عليها وأنا أرشّح بسرعة.";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const messages = [
      ...(Array.isArray(history) ? history.slice(-12) : []),
      { role: "user", content: message.slice(0, 2000) }
    ];

    try {
      const result = await resilientChat(SYSTEM, messages, 500);
      return res.status(200).json({ reply: result.reply, provider: result.provider });
    } catch (aiError) {
      console.error("AI providers failed, using local smart reply:", aiError.message);
      return res.status(200).json({
        reply: localSmartReply(message),
        provider: "local",
        note: "fallback"
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(200).json({ reply: localSmartReply("") });
  }
}
