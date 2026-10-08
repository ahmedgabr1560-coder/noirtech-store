import { openrouterSearchChat, resilientChat } from "./_ai.js";

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
- أجب عن أي سؤال عام أو تقني أو تعليمي أو عن البرمجة أو السفر أو الصحة العامة أو التاريخ أو الثقافة أو النصائح اليومية، حتى لو لم يكن له أي علاقة بالمتجر.
- لديك معرفة عملية بفئات الأجهزة: الهواتف، التابلت، اللابتوبات، أجهزة الكمبيوتر، التجميعات، الجيمنج، الشاشات، الكاميرات، العدسات، الطابعات، الراوترات والشبكات، وحدات التخزين، الكيبورد والماوس، السماعات، التلفزيونات، الساعات والأساور، الأجهزة المنزلية الذكية، الشواحن والباوربانك والإكسسوارات.
- عند ترشيح جهاز اسأل أو استنتج: الاستخدام، الميزانية، الحجم، الأداء، البطارية، نظام التشغيل، قابلية النقل، والكاميرا أو الألعاب حسب الحالة. قارن ببساطة واذكر المميزات والعيوب والبدائل.
- لو السؤال لا علاقة له بالمتجر، أجب عنه مباشرة وبشكل مفيد كأنك مساعد AI عام. لا ترفض السؤال ولا تحوّله للمتجر ولا تذكر المتجر إلا إذا كان ذلك مفيدًا فعلًا.
- لا تقل "لا أستطيع" لمجرد أن السؤال خارج نطاق المتجر؛ استخدم معرفتك العامة وأعطِ أفضل إجابة ممكنة. اذكر حدود المعرفة فقط عند الحاجة، وقدم بديلًا عمليًا أو اسأل سؤال توضيح واحدًا.
- لا تخترع أسعارًا أو مخزونًا أو مواصفات غير مؤكدة. قل بوضوح عندما تكون المعلومة تقريبية أو تحتاج تأكيدًا.
- لا تطلب كلمات مرور أو توكنات أو بيانات بطاقات أو معلومات حساسة.

معلومات NoirTech:
- متجر إلكترونيات في مصر: هواتف، لابتوبات، سماعات، وساعات ذكية.
- أمثلة المنتجات: iPhone 16 Pro Max، Galaxy S25 Ultra، MacBook Pro، Dell XPS، AirPods Pro 2، Sony XM5، Apple Watch Ultra 2.
- شحن داخل مصر، ضمان أصلي، وإرجاع خلال 14 يومًا حسب سياسة المتجر.
- التواصل: 01064519541 | ahmedgabr1560@gmail.com.
- الموقع: https://noirtech-store.vercel.app

قواعد الإجابة:
- أنت مساعد عام أولًا ومساعد متجر ثانيًا: ابدأ بإجابة مباشرة على السؤال نفسه، ثم أضف تفاصيل مفيدة عند الحاجة.
- استخدم 2–6 جمل غالبًا، ويمكنك استخدام نقاط مرتبة للأسئلة الطويلة.
- استخدم الإيموجي باعتدال.
- اختم بسؤال متابعة ذكي فقط عندما يكون مفيدًا، وليس بشكل آلي في كل رد.
- لا تنفذ أي تعديل إداري على الموقع من دردشة الزوار؛ وجّههم للدعم أو واتساب عند الحاجة.
- لو أرسل لك كتالوج المنتجات، استخدمه في الترشيح واذكر السعر الموجود فيه فقط، ولا تخمن منتجًا غير موجود.

كتالوج المنتجات الحالي:
${JSON.stringify(Array.isArray(catalog) ? catalog.slice(0, 40) : [])}`;

    const chatMessages = [
      ...(Array.isArray(history) ? history.slice(-12).filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string").map(m => ({ role: m.role, content: m.content.slice(0, 2000) })) : []),
      { role: "user", content: message.slice(0, 2000) }
    ];
    const wantsLivePrice = /(سعر|اسعار|أسعار|بكام|بكم|تكلف|كام|price|prices|cost|how much|latest price|current price)/i.test(message);
    if (wantsLivePrice && process.env.OPENROUTER_API_KEY) {
      const livePrompt = `${systemPrompt}

وضع البحث المباشر عن الأسعار:
- ابحث على الويب الآن عن أحدث أسعار المنتج الذي يسأل عنه المستخدم، وفضّل مصر والجنيه المصري إذا لم يحدد بلدًا.
- لا تخلط بين سعر مستعمل أو عرض قديم أو سعر استيراد؛ صنّف السعر بوضوح واذكر تاريخ البحث.
- اذكر أن السعر تقريبي وقابل للتغيير، ولا تعتبره سعر NoirTech الرسمي إلا إذا كان موجودًا في الكتالوج.
- اذكر اسم المتجر أو الموقع وموقعه كرابط إن أمكن، ولا تخترع مصادر أو أرقامًا.
- إذا لم تجد سعرًا موثوقًا، قل ذلك بوضوح واطلب الموديل والبلد. أجب بالعربية المصرية المختصرة.`;
      try {
        const live = await openrouterSearchChat(livePrompt, chatMessages, 650);
        const sources = live.citations.length ? `\n\nمصادر البحث:\n${live.citations.map((url, i) => `${i + 1}. ${url}`).join("\n")}` : "";
        return res.status(200).json({ reply: live.text + sources, provider: "openrouter-search" });
      } catch (searchError) {
        console.error("Live price search failed", searchError.message);
      }
    }
    const result = await resilientChat(systemPrompt, chatMessages, 450);
    return res.status(200).json({ reply: result.reply, provider: result.provider });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
