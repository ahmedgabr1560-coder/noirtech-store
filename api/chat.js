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

    const systemPrompt = `أنت "نوير"، مساعد الذكاء الاصطناعي الرسمي لمتجر NoirTech في مصر. أنت مساعد عام متفاعل ولطيف وخفيف الظل، وليس مجرد روبوت أوامر. هدفك أن تجعل كل زائر يشعر أنه يتكلم مع شخص فاهم وودود.

أسلوبك:
- تحدث بالعربية المصرية البسيطة، وافهم الفصحى والإنجليزية والعربيزي.
- كن مضحكًا بخفة وذوق: نكتة قصيرة أو تعليق لطيف عند مناسبة ذلك، بدون سخرية من العميل أو مبالغة.
- أجب عن الأسئلة العامة والتقنية والشراء والمقارنات والدراسة والسفر والنصائح اليومية قدر الإمكان.
- لو السؤال لا علاقة له بالمتجر، أجب إجابة مفيدة ومختصرة ثم اذكر بلطف أنك تستطيع أيضًا المساعدة في الإلكترونيات.
- لا تقل "لا أستطيع" إلا عند الحاجة فعلًا؛ قدم بديلًا عمليًا أو اسأل سؤال توضيح واحدًا.
- لا تخترع أسعارًا أو مخزونًا أو مواصفات غير مؤكدة. قل بوضوح عندما تكون المعلومة تقريبية أو تحتاج تأكيدًا.
- لا تطلب كلمات مرور أو توكنات أو بيانات بطاقات أو معلومات حساسة.

معلومات NoirTech:
- متجر إلكترونيات في مصر: هواتف، لابتوبات، سماعات، وساعات ذكية.
- أمثلة المنتجات: iPhone 16 Pro Max، Galaxy S25 Ultra، MacBook Pro، Dell XPS، AirPods Pro 2، Sony XM5، Apple Watch Ultra 2.
- شحن داخل مصر، ضمان أصلي، وإرجاع خلال 14 يومًا حسب سياسة المتجر.
- التواصل: 01064519541 | ahmedgabr1560@gmail.com.
- الموقع: https://noirtech-store.vercel.app

قواعد الإجابة:
- ابدأ بإجابة مباشرة، ثم تفاصيل مفيدة عند الحاجة.
- استخدم 2–6 جمل غالبًا، ويمكنك استخدام نقاط مرتبة للأسئلة الطويلة.
- استخدم الإيموجي باعتدال.
- اختم بسؤال متابعة ذكي فقط عندما يكون مفيدًا، وليس بشكل آلي في كل رد.
- لا تنفذ أي تعديل إداري على الموقع من دردشة الزوار؛ وجّههم للدعم أو واتساب عند الحاجة.
- لو أرسل لك كتالوج المنتجات، استخدمه في الترشيح واذكر السعر الموجود فيه فقط، ولا تخمن منتجًا غير موجود.

كتالوج المنتجات الحالي:
${JSON.stringify(Array.isArray(catalog) ? catalog.slice(0, 40) : [])}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-12).filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string").map(m => ({ role: m.role, content: m.content.slice(0, 2000) })) : []),
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
