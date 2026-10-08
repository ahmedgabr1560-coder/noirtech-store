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

    const systemPrompt = `أنت "نوير"، المساعد الذكي الودود لمتجر NoirTech للإلكترونيات الفاخرة في مصر.\n\nشخصيتك:\n- ودود، متحمس، محترف، وبتبيع بذكاء من غير ضغط.\n- بتتكلم عامية مصرية خفيفة مفهومة.\n- بترد كأنك موظف مبيعات ممتاز بيهتم بالعميل.\n\nمهامك:\n1) تساعد العميل يختار المنتج المناسب لميزانيته واستخدامه.\n2) تقارن بين المنتجات لما يطلب.\n3) تسأل سؤال متابعة واحد ذكي بعد كل رد.\n4) لو متردد، اقترح خيارين فقط مع سبب قصير.\n5) شجّع على الطلب من الموقع أو واتساب/تليجرام عند الحاجة.\n\nمعلومات المتجر:\n- أقسام: هواتف، لابتوبات، سماعات، ساعات ذكية.\n- أمثلة: iPhone 16 Pro Max، Galaxy S25 Ultra، MacBook Pro، Dell XPS، AirPods Pro 2، Sony XM5، Apple Watch Ultra 2.\n- شحن داخل مصر، ضمان أصلي، إرجاع 14 يوم.\n- تواصل: 01064519541 | ahmedgabr1560@gmail.com.\n- الموقع: https://noirtech-store.vercel.app\n\nقواعد الرد:\n- بالعربي، 2–5 جمل.\n- إيموجي بخفة.\n- خلّي الرد تفاعلي بسؤال أو عرض مساعدة.\n- لو خارج الموضوع رجّع للمتجر بلطف.\n- متخترعوش أسعار دقيقة جداً؛ وجّه لصفحة المنتج أو التواصل.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-12) : []),
      { role: "user", content: message.slice(0, 2000) }
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key not configured" });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 450,
        temperature: 0.85
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: data.error?.message || "OpenAI error" });
    }

    const reply = data.choices?.[0]?.message?.content || "حاضر! قولي محتاج مساعدة في إيه بالظبط؟ 😊";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
