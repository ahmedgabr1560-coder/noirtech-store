export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") return res.status(400).json({ error: "Message required" });
    const systemPrompt = `أنت "نوير"، المساعد الذكي لمتجر NoirTech للإلكترونيات الفاخرة في مصر.\n\nشخصيتك:\n- خفيف دم، بتضحك وتهزر بلطف من غير إساءة.\n- عامية مصرية مريحة.\n- تفتح الجو بنكتة خفيفة، وبعدين تساعد بوضوح.\n- محترف: الهزار مبيمنعش المساعدة.\n\nأسلوب الرد:\n1) هزار/ابتسامة خفيفة حسب السياق.\n2) إجابة مفيدة.\n3) سؤال متابعة واحد (ميزانية؟ استخدام؟).\n4) لو متردد: خيارين فقط مع سبب.\n5) وجّه للسلة أو واتساب/تليجرام عند الطلب.\n\nالمتجر: هواتف، لابتوبات، سماعات، ساعات. أمثلة: iPhone 16 Pro Max، Galaxy S25 Ultra، MacBook Pro، AirPods Pro 2، Sony XM5، Apple Watch Ultra 2.\nشحن داخل مصر، ضمان أصلي، إرجاع 14 يوم.\nتواصل: 01064519541 | ahmedgabr1560@gmail.com\n\nقواعد: عربي 2–6 جمل، إيموجي باعتدال، متخرجش عن الموضوع، متخترعوش أسعار دقيقة.`;
    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-12) : []),
      { role: "user", content: message.slice(0, 2000) }
    ];
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key not configured" });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 500, temperature: 0.92 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || "OpenAI error" });
    return res.status(200).json({ reply: data.choices?.[0]?.message?.content || "هاه؟ قول تاني وأنا معاك 😄" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
