import { openrouterChat, openrouterSearchChat, resilientChat } from "./_ai.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "6746972381");
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN1 || process.env.GH_TOKEN || "";

async function tg(method, body) {
  if (!BOT_TOKEN) return { ok: false, description: "TELEGRAM_BOT_TOKEN غير مضبوط في Vercel" };
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    return data;
  } catch (error) {
    console.error("Telegram API error", error.message);
    return { ok: false, description: `تعذر الاتصال بتليجرام: ${error.message}` };
  }
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
  const url = (text.match(/https?:\/\/[^\s<>]+/i) || [])[0];
  if (url) return { command: `/importurl ${url.replace(/[)\]،,.]+$/, "")}` };
  // إضافة يدوية: ضيف اسم | سعر | قسم | رابط صورة
  if (/(?:ضيف|أضف|اضف)\s+/.test(t) && /\|/.test(text)) {
    return { command: `/add ${text.replace(/^(?:ضيف|أضف|اضف)\s+/i, "").trim()}` };
  }
  if (/(?:ضيف|أضف|اضف)\s+.+/.test(t) && /\d{3,}/.test(t) && !url) {
    return { command: `/addquick ${text}` };
  }
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
async function getLastBotError() {
  try { const f = await getFile("bot-status.json"); return f ? JSON.parse(f.content) : null; } catch { return null; }
}
async function rememberBotError(operation, error) {
  try {
    const old = await getFile("bot-status.json");
    const status = { ok: false, operation, error: String(error?.message || error || "خطأ غير معروف").slice(0, 500), time: new Date().toISOString() };
    await putFile("bot-status.json", JSON.stringify(status, null, 2), `bot: record error in ${operation}`, old?.sha);
  } catch (saveError) { console.error("could not save bot error", saveError.message); }
}
function errorText(status) {
  if (!status || status.ok !== false) return "مفيش أخطاء مسجلة حاليًا ✅";
  const when = new Date(status.time).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
  return `آخر مشكلة حصلت كانت في: <b>${status.operation}</b>\nالسبب: ${status.error}\nالوقت: ${when}\n\nلو تحب، ابعتلي نفس الطلب تاني وأنا أحاول أصلحه.`;
}

async function askAi(question, catalog = []) {
  const system = "أنت نوير، صاحب المدير ومساعده داخل تليجرام. اتكلم مصري بسيط جدًا، طبيعي وودود، كأنك شخص فاهمه. جاوب على السؤال مباشرة في جملة أو جملتين، من غير كلام تقني أو أسماء محركات أو قوائم أوامر. نفّذ الطلب الواضح، ولو ناقص اسأل سؤالًا واحدًا فقط. لا تقل إنك نفذت حاجة إلا بعد تنفيذها فعلًا.";
  const prompt = `السؤال: ${question.slice(0, 1500)}\nالمنتجات الحالية: ${JSON.stringify(catalog.slice(0, 30))}`;
  try {
    const result = await resilientChat(system, [{ role: "user", content: prompt }], 350);
    return result.reply;
  } catch {
    return "حصلت لخبطة بسيطة 😅 جرّب تاني وأنا معاك.";
  }
}

async function interpretAdminRequest(text, catalog = []) {
  const system = `أنت نوير، مساعد بسيط جدًا يتكلم مع المدير كإنسان طبيعي. افهم كلامه ونفّذ الطلب الواضح تلقائيًا. اكتب reply بالمصرية في جملة أو جملتين فقط، بدون تفاصيل تقنية أو أسماء أوامر أو محركات. لو الطلب سؤال عام جاوب عليه ببساطة، ولو ناقص اسأل سؤال توضيح واحدًا فقط. لا تقل إنك نفذت شيئًا قبل أن ينفذه النظام فعليًا.
الأوامر المسموحة فقط:
/menu, /help, /status, /config, /products, /settitle نص, /setabout نص, /setfooter نص, /sethero نص, /setdesc نص, /setbadgehero نص, /setbtn نص, /setname نص, /setsite نص, /setaddress نص, /setphone قيمة, /setemail قيمة, /theme dark|gold|purple|red, /setlayout luxury|minimal|neon, /setorder hero,categories,phones,laptops,audio,wearables,about,contact, /setcategory phones|laptops|audio|wearables اسم, /setcolor gold|accent|bg|card|text|muted|light|dark #hex, /toggle about|contact|categories|whatsapp|telegram|ai, /setprice رقم سعر, /hide رقم, /show رقم, /importproducts عدد [فئة], /importurl رابط, /add اسم | سعر | قسم | صورة. أو ابعت رابط فقط أو صورة+تعليق.
لا تخترع رقم منتج أو قيمة غير مذكورة. أرجع JSON فقط بالشكل: {"command":"...","reply":"تأكيد قصير بالمصرية"}.`;
  try {
    const result = await resilientChat(system, [{ role: "user", content: `طلب المدير: ${text.slice(0, 1200)}\nالمنتجات: ${JSON.stringify(catalog.slice(0, 30))}` }], 260);
    const raw = result.reply.match(/\{[\s\S]*\}/)?.[0];
    const plan = raw ? JSON.parse(raw) : {};
    const allowed = /^(\/(?:menu|help|status|config|products|settitle|setabout|setfooter|sethero|setdesc|setbadgehero|setbtn|setname|setsite|setaddress|setphone|setemail|theme|setlayout|setorder|setcategory|setcolor|toggle|setprice|hide|show|importproducts|importurl))(?:\s|$)/;
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
  const allowed = new Set(["phones", "laptops", "audio", "wearables", "monitors", "home", "accessories"]);
  return list.filter(p => p && typeof p.name === "string" && p.name.trim() && allowed.has(p.category) && Number(p.price) > 0 && /^https?:\/\//i.test(String(p.image)) && typeof p.description === "string").slice(0, count).map(p => ({
    name: p.name.trim().slice(0, 120), category: p.category, price: Math.round(Number(p.price)), oldPrice: Number(p.oldPrice) > Number(p.price) ? Math.round(Number(p.oldPrice)) : null,
    image: String(p.image), badge: typeof p.badge === "string" ? p.badge.slice(0, 30) : "مستورد", hidden: false,
    description: p.description.slice(0, 500), specs: p.specs && typeof p.specs === "object" ? p.specs : {}, sourceUrl: String(p.sourceUrl || "")
  }));
}

function htmlMeta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i");
  return (html.match(re)?.[1] || html.match(alt)?.[1] || "").replace(/&amp;/g, "&").trim();
}
function absoluteUrl(value, base) {
  try { return new URL(value, base).toString(); } catch { return ""; }
}
async function importProductFromUrl(url) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 NoirTech Product Importer" } });
  if (!r.ok) throw new Error(`تعذر فتح الرابط (${r.status})`);
  const html = (await r.text()).slice(0, 140000);
  const title = htmlMeta(html, "og:title") || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, " ").trim() || "";
  const image = absoluteUrl(htmlMeta(html, "og:image"), url);
  const description = htmlMeta(html, "og:description") || htmlMeta(html, "description");
  const visible = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, " ").replace(/\s+/g, " ").slice(0, 18000);
  const prompt = `استخرج بيانات منتج إلكتروني من صفحة الويب التالية. أرجع JSON فقط بهذا الشكل: {"name":"","category":"phones|laptops|audio|wearables","price":0,"oldPrice":null,"image":"","description":"","specs":{},"badge":null}. السعر رقم تقريبي بالجنيه المصري إن وجد، ولا تخترع سعرًا؛ إذا لم يوجد استخدم 0. استخدم الصورة المرفقة إن كانت صالحة.\nالعنوان: ${title}\nالصورة: ${image}\nالوصف: ${description}\nمحتوى الصفحة: ${visible}`;
  const ai = await openrouterChat("أنت مستخرج بيانات منتجات دقيق. لا تضف شرحًا خارج JSON.", [{ role: "user", content: prompt }], 700);
  const raw = ai.match(/\{[\s\S]*\}/)?.[0];
  if (!raw) throw new Error("لم أستطع استخراج بيانات المنتج");
  const item = JSON.parse(raw);
  const categories = new Set(["phones", "laptops", "audio", "wearables", "monitors", "home", "accessories"]);
  const finalImage = absoluteUrl(item.image || image, url);
  if (!item.name || !categories.has(item.category) || Number(item.price) <= 0 || !/^https?:\/\//i.test(finalImage)) throw new Error("الرابط لا يحتوي اسمًا وسعرًا وصورة صالحة لمنتج إلكتروني");
  return { name: String(item.name).slice(0, 120), category: item.category, price: Math.round(Number(item.price)), oldPrice: Number(item.oldPrice) > Number(item.price) ? Math.round(Number(item.oldPrice)) : null, image: finalImage, badge: item.badge ? String(item.badge).slice(0, 30) : "مستورد", hidden: false, description: String(item.description || description || "").slice(0, 500), specs: item.specs && typeof item.specs === "object" ? item.specs : {}, sourceUrl: url };
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
    // استقبال صورة منتج + تعليق
    if (msg?.photo && !msg?.text) {
      const photos = msg.photo || [];
      const fileId = photos[photos.length - 1]?.file_id;
      const caption = (msg.caption || "").trim();
      if (!fileId) return res.status(200).json({ ok: true });
      await reply(chatId, "📷 استلمت الصورة... بجيب الرابط وأضيف المنتج");
      try {
        const fileRes = await tg("getFile", { file_id: fileId });
        const filePath = fileRes?.result?.file_path;
        if (!filePath) throw new Error("تعذر جلب ملف الصورة");
        const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        const prodFile = await getFile("products.json");
        let products = prodFile ? JSON.parse(prodFile.content) : [];
        const prodSha = prodFile?.sha;
        const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
        // parse caption: اسم | سعر | قسم
        let name = caption || `منتج ${id}`;
        let price = 0;
        let category = "accessories";
        if (caption.includes("|")) {
          const parts = caption.split("|").map(s => s.trim());
          name = parts[0] || name;
          price = Number(String(parts[1] || "").replace(/[^0-9]/g, "")) || 0;
          const catRaw = (parts[2] || "").toLowerCase();
          if (/phone|موبايل|هاتف/.test(catRaw)) category = "phones";
          else if (/laptop|لابتوب/.test(catRaw)) category = "laptops";
          else if (/monitor|شاشة/.test(catRaw)) category = "monitors";
          else if (/home|منزل/.test(catRaw)) category = "home";
          else category = "accessories";
        } else if (caption) {
          const priceMatch = caption.match(/(\d{3,})/);
          if (priceMatch) price = Number(priceMatch[1]);
          name = caption.replace(/\d{3,}/, "").replace(/ج\.?م|جنيه|سعر/gi, "").trim() || name;
        }
        if (!price) {
          await reply(chatId, "اكتب مع الصورة التعليق بهذا الشكل:\nالاسم | السعر | القسم\nمثال: iPhone 16 | 45000 | phones");
          return res.status(200).json({ ok: true });
        }
        products.push({
          id, name, category, price, oldPrice: null, image: imageUrl,
          badge: "جديد", hidden: false,
          description: name + " — متوفر لدى NEXORA",
          specs: {}, rating: 4.3, reviews: 10, best: false, newest: true
        });
        const putRes = await putFile("products.json", JSON.stringify(products, null, 2), `bot: add product from photo ${name}`, prodSha);
        if (putRes.ok) await reply(chatId, `✅ تم إضافة المنتج من الصورة\n#${id} ${name}\n💰 ${price} ج.م`);
        else await reply(chatId, `❌ فشل الحفظ: ${putRes.error || putRes.data?.message || ""}`);
      } catch (e) {
        await reply(chatId, "❌ " + String(e.message || e).slice(0, 200));
      }
      return res.status(200).json({ ok: true });
    }
    if (!msg?.text && !msg?.caption) return res.status(200).json({ ok: true });
    if (!msg?.text && msg?.caption) {
      // treat caption-only with photo already handled; caption without photo ignored
      return res.status(200).json({ ok: true });
    }
    let text = msg.text.trim();
    if (/^(ايه حصل|إيه حصل|اي حصل|إيه المشكلة|ايه المشكلة|ما المشكلة|الأخطاء|الاخطاء|آخر مشكلة|اخر مشكلة)\s*[؟?!.]*$/i.test(text)) {
      await reply(chatId, errorText(await getLastBotError()));
      return res.status(200).json({ ok: true });
    }
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
      await reply(chatId, `✅ NoirTech\n🌐 https://noirtech-store.vercel.app\n🔑 GitHub: ${GH_TOKEN ? "مربوط ✅" : "❌ أضف GITHUB_TOKEN"}\n\n${errorText(await getLastBotError())}`);
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

    if (command === "/add") {
      // format: name | price | category | imageUrl
      const raw = args.join(" ");
      const parts = raw.split("|").map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) {
        await reply(chatId, "صيغة الإضافة:\n/add الاسم | السعر | القسم | رابط الصورة\n\nالأقسام: phones laptops monitors home accessories\n\nأو ابعت رابط منتج مباشرة\nأو صورة + تعليق: الاسم | السعر | القسم");
        return res.status(200).json({ ok: true });
      }
      if (!products) { await reply(chatId, "❌ ملف المنتجات غير متاح"); return res.status(200).json({ ok: true }); }
      const name = parts[0];
      const price = Number(String(parts[1]).replace(/[^0-9]/g, ""));
      let category = (parts[2] || "accessories").toLowerCase();
      if (/موبايل|هاتف|phone/.test(category)) category = "phones";
      else if (/لابتوب|laptop/.test(category)) category = "laptops";
      else if (/شاشة|monitor/.test(category)) category = "monitors";
      else if (/منزل|home/.test(category)) category = "home";
      else if (/سماع|ساع|audio|wear/.test(category)) category = "accessories";
      const allowed = new Set(["phones","laptops","monitors","home","accessories","audio","wearables"]);
      if (!allowed.has(category)) category = "accessories";
      let image = parts[3] || "";
      if (!image || !/^https?:\/\//i.test(image)) {
        image = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80";
      }
      if (!name || !price) {
        await reply(chatId, "الاسم والسعر مطلوبين");
        return res.status(200).json({ ok: true });
      }
      const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
      products.push({
        id, name: name.slice(0, 120), category, price: Math.round(price), oldPrice: null,
        image, badge: "جديد", hidden: false,
        description: name + " — متوفر لدى NEXORA",
        specs: {}, rating: 4.2, reviews: 8, best: false, newest: true
      });
      if (await saveProducts(products, `bot: add ${name}`)) {
        await reply(chatId, `✅ تم إضافة المنتج\n#${id} ${name}\n📂 ${category}\n💰 ${price} ج.م`);
      }
      return res.status(200).json({ ok: true });
    }
    if (command === "/addquick") {
      // natural: ضيف iPhone 16 بسعر 45000
      if (!products) { await reply(chatId, "❌ ملف المنتجات غير متاح"); return res.status(200).json({ ok: true }); }
      const raw = args.join(" ");
      const priceMatch = raw.match(/(\d{3,})/);
      const price = priceMatch ? Number(priceMatch[1]) : 0;
      let name = raw
        .replace(/^(?:ضيف|أضف|اضف)\s+/i, "")
        .replace(/ب?سعر\s*\d+/gi, "")
        .replace(/\d{3,}/g, "")
        .replace(/ج\.?م|جنيه/gi, "")
        .trim();
      if (!name || !price) {
        await reply(chatId, "مثال: ضيف iPhone 16 Pro بسعر 45000");
        return res.status(200).json({ ok: true });
      }
      let category = "phones";
      const nl = name.toLowerCase();
      if (/macbook|laptop|لابتوب|thinkpad|dell|hp |asus/.test(nl)) category = "laptops";
      else if (/monitor|شاشة|ultragear|odyssey/.test(nl)) category = "monitors";
      else if (/watch|سماعة|airpods|buds|band|headset/.test(nl)) category = "accessories";
      else if (/مكنسة|خلاط|ثلاجة|home/.test(nl)) category = "home";
      const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
      const image = category === "laptops"
        ? "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=80"
        : category === "monitors"
        ? "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80";
      products.push({
        id, name: name.slice(0, 120), category, price: Math.round(price), oldPrice: null,
        image, badge: "جديد", hidden: false,
        description: name + " — متوفر لدى NEXORA",
        specs: {}, rating: 4.2, reviews: 5, best: false, newest: true
      });
      if (await saveProducts(products, `bot: addquick ${name}`)) {
        await reply(chatId, `✅ تم إضافة\n#${id} ${name}\n💰 ${price} ج.م\n(تقدر تبعت صورة لاحقًا وتعدل)`);
      }
      return res.status(200).json({ ok: true });
    }

    if (command === "/importurl") {
      const url = args[0];
      if (!url || !/^https?:\/\//i.test(url)) { await reply(chatId, "ابعت رابط المنتج مع كلمة: ضيفه"); return res.status(200).json({ ok: true }); }
      if (!products) { await reply(chatId, "❌ ملف المنتجات غير متاح"); return res.status(200).json({ ok: true }); }
      await reply(chatId, "🔎 بقرأ صفحة المنتج وبستخرج الصورة والسعر والوصف والمواصفات...");
      try {
        const item = await importProductFromUrl(url);
        const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
        products.push({ ...item, id });
        if (await saveProducts(products, `bot: import product from ${url}`)) await reply(chatId, `✅ اتضاف المنتج ونشرته في الموقع مباشرة\n📦 ${item.name}\n💰 ${item.price} جنيه\n🖼 الصورة والوصف والمواصفات جاهزة.`);
      } catch (e) {
        console.error("url product import failed", e);
        await reply(chatId, `❌ ما نشرتش المنتج لأن الرابط ناقص أو غير مناسب.\nالسبب: ${String(e.message || "فشل الاستخراج").slice(0, 220)}`);
      }
      return res.status(200).json({ ok: true });
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
          if (req.headers["x-noir-debug"] === "1") return res.status(200).json({ ok: true, imported: withIds.length });
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
    await rememberBotError("تنفيذ طلب البوت", err);
    return res.status(200).json({ ok: true });
  }
}
