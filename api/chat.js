import { openrouterSearchChat, resilientChat } from "./_ai.js";

async function autoAddRequestedProduct(message, catalog) {
  const token = process.env.OPENROUTER_API_KEY;
  const gh = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN;
  if (!token || !gh) return null;
  try {
    const prompt = `ابحث على الويب عن الجهاز الذي يطلبه العميل في النص التالي، وأرجع JSON فقط لمنتج واحد محدد، أو {"notFound":true} إذا لم تجد منتجًا واضحًا. الشكل: {"name":"","category":"phones|laptops|audio|wearables","price":0,"oldPrice":null,"image":"https://...","description":"","specs":{},"sourceUrl":"https://..."}. استخدم سعرًا تقريبيًا بالجنيه المصري، وصورة مباشرة قابلة للفتح، ورابط صفحة المصدر. لا تخترع بيانات أو روابط. طلب العميل: ${message.slice(0, 1000)}`;
    const ai = await openrouterSearchChat("أنت باحث منتجات دقيق. أخرج JSON فقط.", [{ role: "user", content: prompt }], 900);
    const raw = ai.text.match(/\{[\s\S]*\}/)?.[0];
    if (!raw) return null;
    const item = JSON.parse(raw);
    const categories = new Set(["phones", "laptops", "audio", "wearables"]);
    if (item.notFound || !item.name || !categories.has(item.category) || Number(item.price) <= 0 || !/^https?:\/\//i.test(String(item.image)) || !/^https?:\/\//i.test(String(item.sourceUrl))) return null;
    const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${gh}`, "User-Agent": "NoirTech-AutoCatalog" };
    const fileResponse = await fetch("https://api.github.com/repos/ahmedgabr1560-coder/noirtech-store/contents/products.json", { headers });
    if (!fileResponse.ok) return null;
    const file = await fileResponse.json();
    const products = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    const normalized = String(item.name).toLowerCase();
    if (products.some(p => String(p.name || "").toLowerCase() === normalized)) return { duplicate: true, name: item.name };
    const id = Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1;
    const product = { id, name: String(item.name).slice(0, 120), category: item.category, price: Math.round(Number(item.price)), oldPrice: Number(item.oldPrice) > Number(item.price) ? Math.round(Number(item.oldPrice)) : null, image: String(item.image), badge: "طلب عميل", hidden: false, description: String(item.description || "").slice(0, 500), specs: item.specs && typeof item.specs === "object" ? item.specs : {}, sourceUrl: String(item.sourceUrl) };
    const put = await fetch("https://api.github.com/repos/ahmedgabr1560-coder/noirtech-store/contents/products.json", { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ message: `auto: add requested product ${product.name}`, content: Buffer.from(JSON.stringify([...products, product], null, 2), "utf8").toString("base64"), branch: "main", sha: file.sha }) });
    if (!put.ok) return null;
    return { added: true, name: product.name };
  } catch (error) { console.error("auto product add failed", error.message); return null; }
}

async function notifyAdminCustomerMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT;
  if (!token || !chatId) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `💬 رسالة من عميل عبر شات NoirTech:

${message.slice(0, 1800)}`, disable_web_page_preview: true })
    });
    const data = await r.json();
    return Boolean(data.ok);
  } catch { return false; }
}

async function notifyAdminProductRequest(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT;
  if (!token || !chatId) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `📥 طلب عميل لتوفير جهاز غير موجود:\n\n${message.slice(0, 1200)}\n\nاكتب في البوت: «ضيف الجهاز ده» أو ابعت رابط المنتج لإضافته.`, disable_web_page_preview: true })
    });
    const data = await r.json();
    return Boolean(data.ok);
  } catch { return false; }
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
- لا تنفذ أي تعديل إداري على الموقع من دردشة الزوار. يمكنك فقط إرسال رسالة العميل للمسؤول عندما يطلب ذلك بوضوح، ولا تدّعي الإرسال إلا بعد نجاحه.
- لو أرسل لك كتالوج المنتجات، استخدمه في الترشيح واذكر السعر الموجود فيه فقط، ولا تخمن منتجًا غير موجود.

كتالوج المنتجات الحالي:
${JSON.stringify(Array.isArray(catalog) ? catalog.slice(0, 40) : [])}`;

    const asksForUnavailableProduct = /(?:مش موجود|غير موجود|مش متوفر|غير متوفر|مش عندكم|مش لاقي|اطلبلي|وفرلي|عايز أطلب|عايزه يتوفر|عايزه عندكم)/i.test(message) && /(?:جهاز|موبايل|هاتف|آيفون|iphone|سامسونج|samsung|لابتوب|تابلت|سماعة|ساعة|playstation|بلايستيشن)/i.test(message);
    const asksToContactAdmin = /(?:ابعت|ابعث|أرسل|ارسل|كلم|كلّم|تواصل).*(?:المسؤول|المسئول|الإدارة|الاداره|المدير|خدمة العملاء|الدعم)|(?:المسؤول|المسئول|الإدارة|الاداره|المدير).*(?:ابعت|ابعث|أرسل|ارسل|كلم|كلّم|تواصل)/i.test(message);
    const knownCatalog = Array.isArray(catalog) ? catalog.map(p => String(p?.name || "").toLowerCase()) : [];
    let requestNotice = "";
    if (asksToContactAdmin) {
      const sent = await notifyAdminCustomerMessage(message);
      requestNotice = sent ? "\n\n✅ تمام، بعت رسالتك للمسؤول وهيكلمك قريب." : "\n\n⚠️ حاولت أبعت للمسؤول لكن الرسالة ما اتبعتتش دلوقتي. جرّب تاني بعد شوية.";
    }
    if (asksForUnavailableProduct && !knownCatalog.some(name => name && message.toLowerCase().includes(name))) {
      const auto = await autoAddRequestedProduct(message, catalog);
      if (auto?.added) requestNotice += `\n\n✅ الجهاز مش موجود قبل كده، فبحثت عنه وضفته تلقائيًا للموقع: ${auto.name}.`;
      else if (auto?.duplicate) requestNotice += `\n\n✅ الجهاز موجود بالفعل في الكتالوج: ${auto.name}.`;
      else if (await notifyAdminProductRequest(message)) requestNotice += "\n\n📨 سجلت طلب توفير الجهاز عند فريق NoirTech، وهيتم مراجعته وإضافته لو مناسب.";
    }
    const chatMessages = [
      ...(Array.isArray(history) ? history.slice(-12).filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string").map(m => ({ role: m.role, content: m.content.slice(0, 2000) })) : []),
      { role: "user", content: message.slice(0, 2000) }
    ];
    const wantsLivePrice = /(سعر|اسعار|أسعار|بكام|بكم|تكلف|كام|price|prices|cost|how much|latest price|current price)/i.test(message);
    if (wantsLivePrice && process.env.OPENROUTER_API_KEY) {
      const livePrompt = `${systemPrompt}

وضع البحث المباشر عن الأسعار:
- ابحث على الويب الآن عن أحدث أسعار المنتج الذي يسأل عنه المستخدم، وفضّل مصر والجنيه المصري إذا لم يحدد بلدًا.
- ابدأ بالبحث في Amazon Egypt (amazon.eg) وNoon Egypt (noon.com/egypt-ar)، واذكر أيهما ظهر منه السعر. استخدم مصادر مصرية أخرى فقط إذا لم تجد نتيجة موثوقة هناك.
- لا تخلط بين سعر مستعمل أو عرض قديم أو سعر استيراد؛ صنّف السعر بوضوح واذكر تاريخ البحث.
- اذكر أن السعر تقريبي وقابل للتغيير، ولا تعتبره سعر NoirTech الرسمي إلا إذا كان موجودًا في الكتالوج.
- اذكر اسم المتجر أو الموقع وموقعه كرابط إن أمكن، ولا تخترع مصادر أو أرقامًا.
- إذا لم تجد سعرًا موثوقًا، قل ذلك بوضوح واطلب الموديل والبلد. أجب بالعربية المصرية المختصرة.`;
      try {
        const live = await openrouterSearchChat(livePrompt, chatMessages, 650);
        const sources = live.citations.length ? `\n\nمصادر البحث:\n${live.citations.map((url, i) => `${i + 1}. ${url}`).join("\n")}` : "";
        return res.status(200).json({ reply: live.text + sources + requestNotice, provider: "openrouter-search" });
      } catch (searchError) {
        console.error("Live price search failed", searchError.message);
      }
    }
    const result = await resilientChat(systemPrompt, chatMessages, 450);
    return res.status(200).json({ reply: result.reply + requestNotice, provider: result.provider });
  } catch (err) {
    console.error("chat request failed", err);
    if (req.headers["x-noir-debug"] === "1") return res.status(200).json({ reply: "debug", error: String(err?.message || err).slice(0, 500) });
    return res.status(200).json({ reply: "حصلت مشكلة بسيطة وأنا بحاول أجاوبك. جرّب تبعت السؤال تاني بعد لحظات، ولو استمرت ابعت للمسؤول وأنا أوصلهاله.", error: "تعذر تشغيل مساعد الذكاء الاصطناعي" });
  }
}
