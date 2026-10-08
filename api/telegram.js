import { openrouterSearchChat, resilientChat } from "./_ai.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "6746972381");
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}
async function reply(chatId, text, extra = {}) {
  return tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}
function keyboard(rows) { return { inline_keyboard: rows }; }
const MAIN_MENU = keyboard([
  [{ text: "📦 المنتجات", callback_data: "menu_products" }, { text: "🎨 التصميم", callback_data: "menu_design" }],
  [{ text: "🤖 مساعد AI", callback_data: "menu_ai" }, { text: "✍️ النصوص", callback_data: "menu_content" }],
  [{ text: "🧱 الأقسام", callback_data: "menu_sections" }, { text: "📊 الحالة", callback_data: "menu_status" }],
  [{ text: "❓ المساعدة", callback_data: "menu_help" }]
]);
const PRODUCT_MENU = keyboard([
  [{ text: "📋 عرض المنتجات", callback_data: "cmd_products" }, { text: "➕ إضافة منتج", callback_data: "hint_add" }],
  [{ text: "💰 تعديل سعر", callback_data: "hint_price" }, { text: "👁 إخفاء/إظهار", callback_data: "hint_visibility" }],
  [{ text: "⬅️ القائمة الرئيسية", callback_data: "menu_main" }]
]);
const DESIGN_MENU = keyboard([
  [{ text: "🌑 Luxury", callback_data: "theme_dark" }, { text: "✨ Gold", callback_data: "theme_gold" }],
  [{ text: "💜 Purple", callback_data: "theme_purple" }, { text: "🔴 Red", callback_data: "theme_red" }],
  [{ text: "🧱 شكل الصفحة", callback_data: "layout_hint" }, { text: "⬅️ الرئيسية", callback_data: "menu_main" }]
]);
function naturalIntent(text) {
  const t = text.toLowerCase();
  const normalized = t.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const importCount = (normalized.match(/(?:\d+)\s*(?:جهاز|منتج|موبايل|هاتف)/) || [])[1];
  if (/(?:ضيف|أضف|اضف|استورد|استيراد|import)/.test(t) && /(?:من الإنترنت|من الانترنت|من النت|online|internet|web|الويب|جهاز|منتج)/.test(t)) {
    return { command: `/importproducts ${Math.min(100, Math.max(1, Number(importCount || 100)))}` };
  }
  const id = (t.match(/(?:منتج|رقم|#)\s*(\d+)/) || [])[1];
  const price = (t.match(/(?:سعر|بكام|بـ|الى|إلى)\s*(?:المنتج\s*)?(\d{3,})/) || [])[1];
  if (/قائمة|الأوامر|المينيو|القائمه/.test(t)) return { command: "/menu" };
  if (/اعرض|عرض|المنتجات|المنتج/.test(t) && !/سعر|اخف|اظهر|إظهر/.test(t)) return { command: "/products" };
  if (/ذهبي|دهبي|gold/.test(t)) return { command: "/theme gold" };
  if (/بنفسجي|purple/.test(t)) return { command: "/theme purple" };
  if (/احمر|أحمر|red/.test(t)) return { command: "/theme red" };
  if (/داكن|غامق|dark/.test(t)) return { command: "/theme dark" };
  if (id && price && /سعر|بكام|غيّر|غير|تعديل/.test(t)) return { command: `/setprice ${id} ${price}` };
  if (id && /اخف|إخف|اختف/.test(t)) return { command: `/hide ${id}` };
  if (id && /اظهر|إظهر|إظهار/.test(t)) return { command: `/show ${id}` };
  return null;
}
async function getFile(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "NoirTech-Bot" };
  if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, { headers });
  if (!r.ok) return null;
  const data = await r.json();
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}
async function askAi(question, catalog = []) {
  const system = "أنت نوير، مساعد شخصي ذكي للمدير داخل تليجرام، وتحدث معه كإنسان طبيعي وليس كواجهة أوامر. افهم العربية المصرية والفصحى والإنجليزية والعربيزي، ورد بالمصرية البسيطة الودودة مع خفة دم خفيفة. أجب عن أي سؤال عام أو تقني أو تجاري أو تعليمي، وساعد في إدارة متجر NoirTech. عند طلب تعديل واضح للموقع أو المنتجات نفّذ الأمر المناسب تلقائيًا إذا كان مدعومًا، ولا تقل إنك نفذت شيئًا قبل التنفيذ الفعلي. إذا كان الطلب ناقصًا اسأل سؤال توضيح واحدًا فقط. لا تكرر قائمة الأوامر إلا إذا طلبها المدير. لديك معرفة بالهواتف والتابلت واللابتوبات والكمبيوتر والجيمنج والشاشات والكاميرات والشبكات والتخزين والصوتيات والتلفزيونات والساعات والمنزل الذكي والإكسسوارات. كن مفيدًا ومختصرًا.";
  const prompt = `السؤال: ${question.slice(0, 1500)}\nالمنتجات الحالية: ${JSON.stringify(catalog.slice(0, 30))}`;
  try {
    const result = await resilientChat(system, [{ role: "user", content: prompt }], 350);
    return `${result.reply}\n\n<i>المحرك: ${result.provider === "claude" ? "Claude" : result.provider === "openrouter" ? "OpenRouter" : result.provider === "gemini" ? "Gemini" : "OpenAI"}</i>`;
  } catch {
    return "🤖 حصلت زحمة صغيرة في المحركات 😅 جرّب تاني بعد لحظات.";
  }
}

async function interpretAdminRequest(text, catalog = []) {
  const system = `أنت نوير، مساعد شخصي حواري ومدير عمليات متجر NoirTech داخل تليجرام. تعامل مع المدير كإنسان طبيعي: افهم المقصود من الكلام، أجب عن الأسئلة العامة، ونفّذ تلقائيًا الطلبات التي تطابق أمرًا مدعومًا. حوّل طلب التعديل إلى أمر واحد فقط من القائمة المسموحة، أو اترك command فارغًا إذا كان سؤالًا أو محادثة لا تحتاج تنفيذًا. في reply اكتب ردًا طبيعيًا بالمصرية: إجابة مباشرة، أو تأكيدًا قصيرًا لما ستنفذه، أو سؤال توضيح واحدًا عند الحاجة. لا تكتب ردًا آليًا مثل "استخدم /help" إلا إذا طلب المدير المساعدة.
الأوامر المسموحة فقط:
/menu, /help, /status, /config, /products, /settitle نص, /setabout نص, /setfooter نص, /sethero نص, /setdesc نص, /setbadgehero نص, /setbtn نص, /setname نص, /setsite نص, /setaddress نص, /setphone قيمة, /setemail قيمة, /theme dark|gold|purple|red, /setlayout luxury|minimal|neon, /setorder hero,categories,phones,laptops,audio,wearables,about,contact, /setcategory phones|laptops|audio|wearables اسم, /setcolor gold|accent|bg|card|text|muted|light|dark #hex, /toggle about|contact|categories|whatsapp|telegram|ai, /setprice رقم سعر, /hide رقم, /show رقم, /importproducts عدد [فئة].
لا تخترع رقم منتج أو قيمة غير مذكورة. أرجع JSON فقط بالشكل: {"command":"...","reply":"تأكيد قصير بالمصرية"}.`;
  try {
    const result = await resilientChat(system, [{ role: "user", content: `طلب المدير: ${text.slice(0, 1200)}\nالمنتجات: ${JSON.stringify(catalog.slice(0, 30))}` }], 260);
    const raw = result.reply.match(/\{[\s\S]*\}/)?.[0];
    const plan = raw ? JSON.parse(raw) : {};
    const allowed = /^(\/(?:menu|help|status|config|products|settitle|setabout|setfooter|sethero|setdesc|setbadgehero|setbtn|setname|setsite|setaddress|setphone|setemail|theme|setlayout|setorder|setcategory|setcolor|toggle|setprice|hide|show|importproducts))(?:\s|$)/;
    if (!plan.command || !allowed.test(plan.command)) return { command: "", reply: plan.reply || result.reply };
    return { command: plan.command.trim(), reply: plan.reply || "✅ حاضر، نفذت طلبك." };
  } catch { return { command: "", reply: "🤖 حصلت لخبطة بسيطة وأنا بفهم الطلب 😅 اكتبلي المطلوب بطريقتك، وأنا هحاول أساعدك أو أسألك عن الجزء الناقص." }; }
}

async function putFile(path, content, message, sha) {
  if (!GH_TOKEN) return { ok: false, error: "⚠️ أضف GITHUB_TOKEN على Vercel أولاً" };
  const body = { message, content: Buffer.from(content, "utf8").toString("base64"), branch: "main" };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "NoirTech-Bot"
    },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  return { ok: r.ok, data };
}
function helpText() {
  return `🎛 <b>مساعد NoirTech جاهز</b>

اكتب طلبك بطريقتك العادية، من غير أوامر، مثل:

📦 «اعرض المنتجات»
💰 «غيّر سعر الآيفون إلى 60000»
🎨 «خلّي الموقع باللون الذهبي»
✍️ «غيّر عنوان الصفحة إلى أحدث الأجهزة»
🌐 «ضيف 100 جهاز من الإنترنت مع الصور والوصف»
🤖 «رشحلي لابتوب للجرافيك»
💬 «اشرحلي الفرق بين OLED وLCD»

هفهم طلبك وأنفذه مباشرة أو أسألك عن المعلومة الناقصة فقط.`;
}
const THEMES = {
  dark: { bg: "#07070a", bgCard: "#0f0f14", gold: "#f0b429", goldLight: "#ffd666", goldDark: "#d4920a", accent: "#7c5cff", text: "#f4f4f8", textMuted: "#9898a6" },
  gold: { bg: "#0c0a06", bgCard: "#16120a", gold: "#ffc233", goldLight: "#ffe08a", goldDark: "#c49200", accent: "#d4a017", text: "#fff8e7", textMuted: "#b8a88a" },
  purple: { bg: "#0a0712", bgCard: "#120e1c", gold: "#c4a0ff", goldLight: "#e0c8ff", goldDark: "#8b5cf6", accent: "#a78bfa", text: "#f3e8ff", textMuted: "#a89bb8" },
  red: { bg: "#0c0707", bgCard: "#160e0e", gold: "#ff5c5c", goldLight: "#ff8a8a", goldDark: "#e11d48", accent: "#f43f5e", text: "#fff1f1", textMuted: "#b89a9a" }
};
async function importProductsFromWeb(count, categoryHint = "") {
  const system = `أنت جامع بيانات منتجات إلكترونيات من الويب لمتجر في مصر. ابحث على الإنترنت الآن وأرجع JSON فقط، بدون Markdown أو شرح، عبارة عن مصفوفة من ${count} عنصرًا حقيقيًا ومختلفًا قدر الإمكان.

كل عنصر يجب أن يحتوي بالضبط على: name (اسم المنتج والموديل)، category (واحدة من phones أو laptops أو audio أو wearables)، price (رقم صحيح تقريبي بالجنيه المصري)، oldPrice (رقم أو null)، image (رابط صورة مباشر https قابل للفتح)، description (وصف عربي قصير)، specs (كائن من 3 إلى 6 مواصفات قصيرة)، badge (نص قصير أو null)، sourceUrl (رابط صفحة المصدر).

الشروط: اختر أجهزة إلكترونية فقط، لا تخترع روابط صور؛ استخدم روابط صور مباشرة من صفحات الشركات أو المتاجر أو مواقع الصور العامة. لا تكرر نفس الموديل. الأسعار تقريبية للسوق المصري واعتبرها قابلة للتغيير. ${categoryHint ? `ركز على فئة ${categoryHint}.` : "وزع النتائج بين الفئات الأربع."}`;
  const result = await openrouterSearchChat(system, [{ role: "user", content: `استورد ${count} جهازًا إلكترونيًا من الإنترنت مع الصور والوصف والمواصفات. أعد JSON صالحًا فقط.` }], Math.min(7500, Math.max(1800, count * 75)));
  const raw = result.text.match(/\[[\s\S]*\]/)?.[0];
  if (!raw) throw new Error("لم يرجع محرك البحث قائمة JSON صالحة");
  let list;
  try { list = JSON.parse(raw); } catch { throw new Error("تعذر قراءة بيانات المنتجات القادمة من الويب"); }
  const allowed = new Set(["phones", "laptops", "audio", "wearables"]);
  return list.filter(p => p && typeof p.name === "string" && p.name.trim() && allowed.has(p.category) && Number(p.price) > 0 && /^https?:\/\//i.test(String(p.image)) && typeof p.description === "string").slice(0, count).map(p => ({
    name: p.name.trim().slice(0, 120), category: p.category, price: Math.round(Number(p.price)), oldPrice: Number(p.oldPrice) > Number(p.price) ? Math.round(Number(p.oldPrice)) : null,
    image: String(p.image), badge: typeof p.badge === "string" ? p.badge.slice(0, 30) : "مستورد", hidden: false,
    description: p.description.slice(0, 500), specs: p.specs && typeof p.specs === "object" ? p.specs : {}, sourceUrl: String(p.sourceUrl || "")
  }));
}

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ ok: true });
  if (req.method !== "POST") return res.status(405).end();
  try {
    const body = req.body || {};
    const query = body.callback_query;
    const msg = body.message || body.edited_message;
    const chatId = String(query?.message?.chat?.id || msg?.chat?.id || "");
    if (!chatId) return res.status(200).json({ ok: true });
    if (chatId !== ADMIN_CHAT) {
      if (query?.id) await tg("answerCallbackQuery", { callback_query_id: query.id, text: "للإدارة فقط", show_alert: true });
      else await reply(chatId, "⛔ للإدارة فقط");
      return res.status(200).json({ ok: true });
    }
    if (query) {
      await tg("answerCallbackQuery", { callback_query_id: query.id });
      const data = query.data || "";
      if (data === "menu_main") await reply(chatId, "🎛 <b>لوحة NoirTech</b>\nاختار القسم:", { reply_markup: MAIN_MENU });
      else if (data === "menu_products") await reply(chatId, "📦 <b>إدارة المنتجات</b>\nاختار العملية أو اكتبها بطريقتك:", { reply_markup: PRODUCT_MENU });
      else if (data === "menu_design") await reply(chatId, "🎨 <b>التصميم والثيمات</b>", { reply_markup: DESIGN_MENU });
      else if (data === "menu_ai") await reply(chatId, "🤖 <b>نوير — مساعدك السريع</b> 😄\nاكتب طلبك بطريقتك، مثل:\n• اعمل وصف لمنتج جديد\n• رشحلي جهاز مناسب للتصميم\n• عايز أغير شكل الموقع\n• اعرضلي منتجات تحت 30000\n\nأنا أفهم طلبك وأنفذه مباشرة.", { reply_markup: keyboard([[{ text: "📦 تحليل المنتجات", callback_data: "ai_products" }], [{ text: "✍️ كتابة وصف", callback_data: "ai_copy" }, { text: "💡 فكرة للمتجر", callback_data: "ai_idea" }], [{ text: "⬅️ الرئيسية", callback_data: "menu_main" }]]) });
      else if (data === "menu_content") await reply(chatId, "✍️ اكتب طلبك مباشرة، مثل: <i>غيّر عنوان الصفحة إلى أحدث الأجهزة</i> أو <i>اكتب وصفًا جديدًا للمتجر</i>.");
      else if (data === "menu_sections") await reply(chatId, "🧱 اكتب الترتيب بالكلام، مثل: <i>خلّي المنتجات قبل قسم عن المتجر، وأظهر التواصل في الآخر</i>.");
      else if (data === "menu_status") await reply(chatId, "✅ البوت متصل\n🌐 noirtech-store.vercel.app");
      else if (data === "menu_help") await reply(chatId, helpText(), { reply_markup: MAIN_MENU });
      else if (data === "cmd_products") {
        const f = await getFile("products.json");
        const list = f ? JSON.parse(f.content) : [];
        await reply(chatId, list.filter(p => !p.hidden).slice(0, 30).map(p => `#${p.id} ${p.name} — ${p.price}`).join("\n") || "لا منتجات");
      }
      else if (data.startsWith("theme_")) { const theme = data.replace("theme_", ""); await reply(chatId, `✨ اكتب فقط: <i>خلّي شكل الموقع ${theme === "gold" ? "ذهبي" : theme}</i> وأنا أنفذه مباشرة.`); }
      else if (data === "hint_add") await reply(chatId, "➕ اكتب مثلًا: <i>أضف iPhone 16 Pro Max بسعر 62999 مع صورة ووصف</i>.");
      else if (data === "hint_price") await reply(chatId, "💰 اكتب مثلًا: <i>غيّر سعر iPhone 16 إلى 59999</i>.");
      else if (data === "hint_visibility") await reply(chatId, "👁 اكتب مثلًا: <i>اخفِ منتج AirPods</i> أو <i>أظهره</i>.");
      else if (data === "layout_hint") await reply(chatId, "🧱 اكتب مثلًا: <i>خلّي تصميم الصفحة فاخر</i> أو <i>بسيط</i> أو <i>نيون</i>.");
      else if (data === "ai_products") { const f = await getFile("products.json"); const list = f ? JSON.parse(f.content) : []; await reply(chatId, await askAi("حلل المنتجات الحالية واقترح تحسينات قصيرة", list), { reply_markup: MAIN_MENU }); }
      else if (data === "ai_copy") await reply(chatId, "✍️ اكتب اسم المنتج ومميزاته، وأنا أكتب لك وصفًا جاهزًا للنشر.");
      else if (data === "ai_idea") await reply(chatId, "💡 مثال: اكتب <i>اقترح حملة لمنتجات الجيمنج</i> وأنا أجهز لك فكرة ونسخة إعلان.");
      return res.status(200).json({ ok: true });
    }
    if (!msg?.text) return res.status(200).json({ ok: true });
    let text = msg.text.trim();
    if (!text.startsWith("/")) {
      const intent = naturalIntent(text);
      if (intent) text = intent.command;
      else {
        const f = await getFile("products.json"); const list = f ? JSON.parse(f.content) : [];
        const plan = await interpretAdminRequest(text, list);
        if (plan.command) { text = plan.command; }
        else { await reply(chatId, plan.reply, { reply_markup: MAIN_MENU }); return res.status(200).json({ ok: true }); }
      }
    }
    if (chatId !== ADMIN_CHAT) { await reply(chatId, "⛔ للإدارة فقط"); return res.status(200).json({ ok: true }); }
    const [cmd, ...args] = text.split(/\s+/);
    const command = (cmd || "").toLowerCase().replace(/@\w+/, "");
    if (command === "/start" || command === "/help" || command === "/menu") { await reply(chatId, command === "/menu" ? "🎛 <b>لوحة NoirTech</b>\nاختار القسم:" : helpText(), { reply_markup: MAIN_MENU }); return res.status(200).json({ ok: true }); }
    if (command === "/status") {
      await reply(chatId, `✅ NoirTech\n🌐 https://noirtech-store.vercel.app\n🔑 GitHub: ${GH_TOKEN ? "مربوط ✅" : "❌ أضف GITHUB_TOKEN"}`);
      return res.status(200).json({ ok: true });
    }
    const cfgFile = await getFile("site-config.json");
    let config = null, cfgSha = null;
    if (cfgFile) { try { config = JSON.parse(cfgFile.content); cfgSha = cfgFile.sha; } catch (e) {} }
    async function saveConfig(c, message) {
      const result = await putFile("site-config.json", JSON.stringify(c, null, 2), message, cfgSha);
      if (!result.ok) { await reply(chatId, `❌ ${result.error || result.data?.message || "فشل"}`); return false; }
      cfgSha = result.data?.content?.sha || cfgSha;
      return true;
    }
    if (command === "/config") {
      if (!config) { await reply(chatId, "لا يوجد config"); return res.status(200).json({ ok: true }); }
      await reply(chatId, `⚙️ ${config.siteName}\n${config.ownerName}\n${config.heroHighlight}\n📞 ${config.phone}\ngold=${config.colors?.gold}\naccent=${config.colors?.accent}`);
      return res.status(200).json({ ok: true });
    }
    if (!BOT_TOKEN) { await reply(chatId, "❌ البوت غير مهيأ: أضف TELEGRAM_BOT_TOKEN في Vercel"); return res.status(200).json({ ok: true }); }
    if (command === "/settitle" || command === "/setabout" || command === "/setfooter") {
      const v = args.join(" ");
      if (!v || !config) { await reply(chatId, `استخدم: ${command} النص`); return res.status(200).json({ ok: true }); }
      const key = { "/settitle": "heroTitle", "/setabout": "aboutText", "/setfooter": "footerText" }[command];
      config[key] = v;
      if (await saveConfig(config, `bot: ${command}`)) await reply(chatId, "✅ تم تحديث النص ونشره");
      return res.status(200).json({ ok: true });
    }
    if (command === "/setlayout") {
      const layout = (args[0] || "").toLowerCase();
      if (!config || !["luxury", "minimal", "neon"].includes(layout)) { await reply(chatId, "استخدم: /setlayout luxury|minimal|neon"); return res.status(200).json({ ok: true }); }
      config.layout = layout;
      if (await saveConfig(config, `bot: layout ${layout}`)) await reply(chatId, `✅ تم تغيير النمط إلى ${layout}`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/setorder") {
      const allowed = ["hero", "categories", "phones", "laptops", "audio", "wearables", "about", "contact"];
      const order = args.join(" ").split(",").map(x => x.trim()).filter(x => allowed.includes(x));
      if (!config || order.length < 2) { await reply(chatId, "استخدم مفاتيح الأقسام مفصولة بفواصل"); return res.status(200).json({ ok: true }); }
      config.sectionOrder = [...new Set(order)];
      if (await saveConfig(config, "bot: section order")) await reply(chatId, "✅ تم تغيير ترتيب الأقسام");
      return res.status(200).json({ ok: true });
    }
    if (command === "/setcategory") {
      const key = (args[0] || "").toLowerCase(); const label = args.slice(1).join(" ");
      if (!config || !["phones", "laptops", "audio", "wearables"].includes(key) || !label) { await reply(chatId, "مثال: /setcategory phones 📱 الهواتف الذكية"); return res.status(200).json({ ok: true }); }
      config.categoryLabels = { ...(config.categoryLabels || {}), [key]: label };
      if (await saveConfig(config, "bot: category label")) await reply(chatId, "✅ تم تحديث اسم القسم");
      return res.status(200).json({ ok: true });
    }
    if (command === "/theme") {
      const name = (args[0] || "").toLowerCase();
      if (!THEMES[name] || !config) { await reply(chatId, "/theme dark|gold|purple|red"); return res.status(200).json({ ok: true }); }
      config.colors = { ...config.colors, ...THEMES[name] };
      if (await saveConfig(config, `bot: theme ${name}`)) await reply(chatId, `✅ ثيم ${name}`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/setcolor") {
      const key = (args[0] || "").toLowerCase(); const val = args[1];
      const map = { gold: "gold", accent: "accent", bg: "bg", card: "bgCard", text: "text", muted: "textMuted", light: "goldLight", dark: "goldDark" };
      if (!map[key] || !val || !config) { await reply(chatId, "مثال: /setcolor gold #ffaa00"); return res.status(200).json({ ok: true }); }
      config.colors = config.colors || {}; config.colors[map[key]] = val;
      if (await saveConfig(config, `bot: color ${key}`)) await reply(chatId, `✅ ${key}=${val}`);
      return res.status(200).json({ ok: true });
    }
    const textCmds = {
      "/sethero": "heroHighlight",
      "/setdesc": "heroDesc",
      "/setbadgehero": "heroBadge",
      "/setbtn": "heroBtn",
      "/setname": "ownerName",
      "/setsite": "siteName",
      "/setaddress": "address"
    };
    if (textCmds[command]) {
      const v = args.join(" ");
      if (!v || !config) { await reply(chatId, `استخدم: ${command} النص`); return res.status(200).json({ ok: true }); }
      config[textCmds[command]] = v;
      if (await saveConfig(config, `bot: ${command}`)) await reply(chatId, `✅ تم`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/setphone" || command === "/setemail") {
      const v = args[0];
      if (!v || !config) { await reply(chatId, `استخدم: ${command} القيمة`); return res.status(200).json({ ok: true }); }
      config[command === "/setphone" ? "phone" : "email"] = v;
      if (await saveConfig(config, `bot: ${command}`)) await reply(chatId, `✅ ${v}`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/toggle") {
      const key = (args[0] || "").toLowerCase();
      const map = { about: "showAbout", contact: "showContact", categories: "showCategories", whatsapp: "showFloatWhatsapp", telegram: "showFloatTelegram", ai: "showFloatAI" };
      if (!map[key] || !config) { await reply(chatId, "/toggle about|contact|categories|whatsapp|telegram|ai"); return res.status(200).json({ ok: true }); }
      config[map[key]] = !config[map[key]];
      if (await saveConfig(config, `bot: toggle ${key}`)) await reply(chatId, `✅ ${key}: ${config[map[key]] ? "ظاهر" : "مخفي"}`);
      return res.status(200).json({ ok: true });
    }
    const prodFile = await getFile("products.json");
    let products = null, prodSha = null;
    if (prodFile) { try { products = JSON.parse(prodFile.content); prodSha = prodFile.sha; } catch (e) {} }
    async function saveProducts(list, message) {
      const result = await putFile("products.json", JSON.stringify(list, null, 2), message, prodSha);
      if (!result.ok) { await reply(chatId, `❌ ${result.error || result.data?.message || "فشل"}`); return false; }
      return true;
    }
    if (command === "/importproducts") {
      const count = Math.min(100, Math.max(1, Number(args[0]) || 100));
      const category = args.slice(1).join(" ");
      if (!products) { await reply(chatId, "❌ ملف المنتجات غير متاح"); return res.status(200).json({ ok: true }); }
      await reply(chatId, `🔎 جاري البحث عن ${count} جهاز من الإنترنت وتجهيز الصور والوصف...\nقد يستغرق الأمر قليلًا.`);
      try {
        const imported = await importProductsFromWeb(count, category);
        if (imported.length < Math.max(1, Math.floor(count * 0.6))) throw new Error(`تم التحقق من ${imported.length} منتج فقط من أصل ${count}`);
        const nextId = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
        const withIds = imported.map((p, i) => ({ ...p, id: nextId + i }));
        products.push(...withIds);
        if (await saveProducts(products, `bot: import ${withIds.length} products from web`)) {
          await reply(chatId, `✅ تم الاستيراد والنشر تلقائيًا\n📦 أضيف: ${withIds.length} جهاز\n🖼 كل عنصر معه صورة ووصف ومواصفات\n🌐 المصدر: الإنترنت\n\nاستخدم /products لرؤيتها.`);
        }
      } catch (e) {
        console.error("product import failed", e);
        await reply(chatId, `❌ لم يتم النشر حتى لا نضيف بيانات ناقصة.\nالسبب: ${String(e.message || "فشل البحث").slice(0, 220)}`);
      }
      return res.status(200).json({ ok: true });
    }
    if (command === "/products") {
      if (!products) { await reply(chatId, "لا منتجات"); return res.status(200).json({ ok: true }); }
      const lines = products.filter(p => !p.hidden).slice(0, 30).map(p => `#${p.id} ${p.name} — ${p.price}`);
      await reply(chatId, lines.join("\n"));
      return res.status(200).json({ ok: true });
    }
    if (command === "/addproduct") {
      const parts = args.join(" ").split("|").map(x => x.trim());
      const [name, category, price, image] = parts;
      const allowed = ["phones", "laptops", "audio", "wearables"];
      if (!products || !name || !allowed.includes(category) || !Number(price) || !image) { await reply(chatId, "مثال: /addproduct iPhone 16|phones|62999|https://..."); return res.status(200).json({ ok: true }); }
      const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
      products.push({ id, name, category, price: Number(price), oldPrice: null, image, badge: null, hidden: false });
      if (await saveProducts(products, `bot: add product #${id}`)) await reply(chatId, `✅ تمت إضافة #${id} — ${name}`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/editproduct") {
      const id = Number(args[0]); const field = args[1]; const value = args.slice(2).join(" ");
      const p = products?.find(x => x.id === id);
      const fields = ["name", "price", "oldPrice", "category", "image", "badge"];
      if (!p || !fields.includes(field) || !value) { await reply(chatId, "مثال: /editproduct 1 price 59999"); return res.status(200).json({ ok: true }); }
      if (["price", "oldPrice"].includes(field) && !Number(value)) { await reply(chatId, "السعر يجب أن يكون رقمًا"); return res.status(200).json({ ok: true }); }
      p[field] = ["price", "oldPrice"].includes(field) ? Number(value) : value;
      if (await saveProducts(products, `bot: edit product #${id}`)) await reply(chatId, "✅ تم تعديل المنتج");
      return res.status(200).json({ ok: true });
    }
    if (command === "/deleteproduct") {
      const id = Number(args[0]);
      if (!products?.some(x => x.id === id)) { await reply(chatId, "مثال: /deleteproduct 1"); return res.status(200).json({ ok: true }); }
      products = products.filter(x => x.id !== id);
      if (await saveProducts(products, `bot: delete product #${id}`)) await reply(chatId, "✅ تم حذف المنتج");
      return res.status(200).json({ ok: true });
    }
    if (command === "/setprice") {
      const id = Number(args[0]), price = Number(args[1]);
      const p = products?.find(x => x.id === id);
      if (!p || !price) { await reply(chatId, "/setprice 1 59999"); return res.status(200).json({ ok: true }); }
      p.price = price;
      if (await saveProducts(products, `bot: price #${id}`)) await reply(chatId, `✅ ${p.name} = ${price}`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/setbadge") {
      const id = Number(args[0]); const badge = args.slice(1).join(" ");
      const p = products?.find(x => x.id === id);
      if (!p) { await reply(chatId, "/setbadge 1 جديد"); return res.status(200).json({ ok: true }); }
      p.badge = !badge || badge === "-" ? null : badge;
      if (await saveProducts(products, `bot: badge #${id}`)) await reply(chatId, `✅ تم`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/hide" || command === "/show") {
      const id = Number(args[0]); const p = products?.find(x => x.id === id);
      if (!p) { await reply(chatId, `${command} 1`); return res.status(200).json({ ok: true }); }
      p.hidden = command === "/hide";
      if (await saveProducts(products, `bot: ${command} #${id}`)) await reply(chatId, `✅ تم`);
      return res.status(200).json({ ok: true });
    }
    if (command === "/orders") {
      await reply(chatId, "الطلبات الجديدة بتجيلك كإشعار هنا تلقائي");
      return res.status(200).json({ ok: true });
    }
    await reply(chatId, "غير معروف — /help");
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
}
