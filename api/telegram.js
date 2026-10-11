const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT = String(process.env.TELEGRAM_ADMIN_CHAT || "6746972381");
const GH_OWNER = "ahmedgabr1560-coder";
const GH_REPO = "noirtech-store";
const GH_TOKEN = process.env.GITHUB_TOKEN1 || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

async function tg(method, body) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await r.json();
  } catch (e) {
    return { ok: false, description: String(e.message || e) };
  }
}
async function reply(chatId, text, extra = {}) {
  return tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

const MENU = {
  inline_keyboard: [
    [{ text: "📦 المنتجات", callback_data: "cmd_products" }, { text: "➕ إضافة منتج", callback_data: "hint_add" }],
    [{ text: "🤖 اسأل نورا", callback_data: "menu_ai" }, { text: "📊 الحالة", callback_data: "menu_status" }]
  ]
};

async function ghGet(path) {
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "NEXORA" }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}
async function ghPut(path, content, message, sha) {
  const body = { message, content: Buffer.from(content, "utf8").toString("base64"), branch: "main" };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "NEXORA" },
    body: JSON.stringify(body)
  });
  return { ok: r.ok, data: await r.json() };
}

async function getFileUrl(fileId) {
  const meta = await tg("getFile", { file_id: fileId });
  const fp = meta?.result?.file_path;
  if (!fp) return null;
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${fp}`;
}

function helpText() {
  return `🛍 <b>NEXORA — كلمني عادي</b>

مش لازم أوامر. اكتب زي ما تحب:

• «اعرض المنتجات»
• «ضيف iPhone 16 بسعر 52000 موبايلات»
• «رشحلي موبايل بـ 15000»
• «حالة الموقع»

أو ابعت <b>صورة المنتج</b> واكتب تحتها:
الاسم | السعر | القسم

🌐 https://nexoraegypt.vercel.app
📝 https://nexoraegypt.vercel.app/admin.html`;
}

function parsePrice(text) {
  const m = String(text).replace(/,/g, "").match(/(\d{3,7})/);
  return m ? Number(m[1]) : 0;
}

function detectCategory(text) {
  const t = String(text).toLowerCase();
  if (/لابتوب|laptop|ماك بوك|macbook/.test(t)) return "laptops";
  if (/شاشة|monitor/.test(t)) return "monitors";
  if (/تلفزيون|tv|منزل|ثلاجة/.test(t)) return "home";
  if (/سماع|سماعة|ساعة|كابل|شاحن|تابلت|إكسسوار|اكسسوار/.test(t)) return "accessories";
  if (/موبايل|هاتف|ايفون|آيفون|phone|iphone|سامسونج|galaxy/.test(t)) return "phones";
  return "phones";
}

async function addProduct({ name, price, category, image, products, sha }) {
  const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
  const item = {
    id,
    name: String(name).slice(0, 120),
    category: category || "phones",
    price: Math.round(price),
    oldPrice: null,
    image: image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80",
    badge: "جديد",
    hidden: false,
    description: name + " — متوفر لدى NEXORA",
    rating: 4.4,
    reviews: 5,
    best: false,
    newest: true
  };
  products.unshift(item);
  const put = await ghPut("products.json", JSON.stringify(products, null, 2), "bot: add " + name, sha);
  return { put, item, products };
}

async function localAi(q, list) {
  const t = String(q || "").toLowerCase();
  const pick = (cat) => (list || []).filter(p => p.category === cat).slice(0, 4);
  if (/موبايل|هاتف|iphone|سامسونج/.test(t)) {
    const items = pick("phones");
    if (items.length) return "تمام 📱:\n" + items.map(p => "• " + p.name + " — " + p.price + " ج.م").join("\n") + "\nقولي ميزانيتك أدقق.";
    return "قولي ميزانية الموبايل وأرشّحلك.";
  }
  if (/لابتوب|laptop/.test(t)) return "💻 اللابتوبات: شغل ولا ألعاب؟ والميزانية كام؟";
  if (/سماع|سماعة/.test(t)) return "🎧 عزل ضوضاء ولا سماعة رياضية؟";
  if (/منتج|عرض|كتالوج/.test(t)) return "عندنا " + (list?.length || 0) + " منتج. اكتب «اعرض المنتجات» أو قولي فئة.";
  return "أنا نورا 🤖 كلمني عادي: ترشيح، إضافة منتج، أو حالة الموقع.";
}

function wantsProducts(t) {
  return /اعرض|عرض المنتجات|المنتجات|شو المنتجات|قائمة المنتجات/.test(t);
}
function wantsStatus(t) {
  return /حالة|status|شغال|الموقع/.test(t) && !/منتج/.test(t);
}
function wantsAdd(t) {
  return /ضيف|أضف|اضف|زود منتج|منتج جديد/.test(t);
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return res.status(200).json({ ok: true, service: "nexora-telegram" });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId = String(cq.message?.chat?.id || "");
      const data = cq.data || "";
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      if (data === "menu_status") await reply(chatId, "✅ NEXORA شغال\n🌐 https://nexoraegypt.vercel.app\n🔑 GitHub: " + (GH_TOKEN ? "مربوط ✅" : "❌"), { reply_markup: MENU });
      else if (data === "cmd_products") {
        const f = await ghGet("products.json");
        const list = f ? JSON.parse(f.content) : [];
        const top = list.slice(0, 10).map(p => "#" + p.id + " " + p.name + " — " + p.price).join("\n");
        await reply(chatId, "📦 المنتجات (" + list.length + ")\n\n" + (top || "فارغ"), { reply_markup: MENU });
      } else if (data === "hint_add") {
        await reply(chatId, "➕ كلمني عادي:\n«ضيف Galaxy A36 بسعر 22000 موبايلات»\n\nأو ابعت صورة واكتب تحتها:\nالاسم | السعر | القسم", { reply_markup: MENU });
      } else if (data === "menu_ai") {
        await reply(chatId, "🤖 اسألني عادي:\n«رشحلي موبايل بـ 15000»", { reply_markup: MENU });
      } else await reply(chatId, helpText(), { reply_markup: MENU });
      return res.status(200).json({ ok: true });
    }

    const msg = body.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chatId = String(msg.chat?.id || "");
    if (chatId !== ADMIN_CHAT) {
      await reply(chatId, "للتسوق من الموقع:\nhttps://nexoraegypt.vercel.app");
      return res.status(200).json({ ok: true });
    }

    // Photo + caption add
    if (msg.photo && msg.photo.length) {
      const caption = String(msg.caption || "").trim();
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const imageUrl = await getFileUrl(fileId);
      const parts = caption.split("|").map(s => s.trim()).filter(Boolean);
      let name = parts[0] || caption || "منتج جديد";
      let price = parsePrice(parts[1] || caption);
      let category = detectCategory(parts[2] || caption);
      if (parts.length >= 2) {
        name = parts[0];
        price = parsePrice(parts[1]);
        if (parts[2]) category = detectCategory(parts[2]);
      }
      if (!price) {
        await reply(chatId, "وصّلت الصورة ✅\nاكتب معاها السعر، مثال:\n<code>Galaxy A36 | 22000 | phones</code>");
        return res.status(200).json({ ok: true });
      }
      const f = await ghGet("products.json");
      if (!f) { await reply(chatId, "❌ تعذر قراءة المنتجات"); return res.status(200).json({ ok: true }); }
      let products = JSON.parse(f.content);
      const { put, item } = await addProduct({ name, price, category, image: imageUrl, products, sha: f.sha });
      if (put.ok) await reply(chatId, "✅ اتضاف بالصورة\n#" + item.id + " " + item.name + "\n💰 " + item.price + " ج.م");
      else await reply(chatId, "❌ فشل الحفظ");
      return res.status(200).json({ ok: true });
    }

    const text = String(msg.text || "").trim();
    if (!text) return res.status(200).json({ ok: true });

    const low = text.toLowerCase();
    const isCmd = text.startsWith("/");
    const command = isCmd ? text.split(/\s+/)[0].toLowerCase().replace(/@\w+/, "") : "";
    const args = isCmd ? text.split(/\s+/).slice(1) : [];

    if (command === "/start" || command === "/help" || command === "/menu" || /^(مساعدة|مساعده|ابدأ|ابدء)$/i.test(text)) {
      await reply(chatId, helpText(), { reply_markup: MENU });
      return res.status(200).json({ ok: true });
    }

    if (command === "/status" || wantsStatus(low)) {
      await reply(chatId, "✅ NEXORA شغال\n🌐 https://nexoraegypt.vercel.app\n🔑 GitHub: " + (GH_TOKEN ? "مربوط ✅" : "❌"), { reply_markup: MENU });
      return res.status(200).json({ ok: true });
    }

    if (command === "/products" || wantsProducts(low)) {
      const f = await ghGet("products.json");
      const list = f ? JSON.parse(f.content) : [];
      const top = list.slice(0, 12).map(p => "#" + p.id + " " + p.name + " — " + p.price + " ج.م").join("\n");
      await reply(chatId, "📦 المنتجات (" + list.length + ")\n\n" + (top || "فارغ"), { reply_markup: MENU });
      return res.status(200).json({ ok: true });
    }

    // Natural or /add product
    if (command === "/add" || wantsAdd(low)) {
      let raw = command === "/add" ? args.join(" ") : text;
      raw = raw.replace(/^(ضيف|أضف|اضف|زود)\s*(منتج)?\s*/i, "").trim();
      let parts = raw.split("|").map(s => s.trim()).filter(Boolean);
      let name, price, category, image;
      if (parts.length >= 2) {
        name = parts[0];
        price = parsePrice(parts[1]);
        category = parts[2] ? detectCategory(parts[2]) : detectCategory(raw);
        image = parts[3];
      } else {
        price = parsePrice(raw);
        category = detectCategory(raw);
        name = raw
          .replace(/\d{3,7}/g, " ")
          .replace(/ج\.?م|جنيه|بسعر|سعر|موبايلات|لابتوبات|شاشات|إكسسوارات|اكسسوارات|phones|laptops/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
      if (!name || !price) {
        await reply(chatId, "تمام، عشان أضيف منتج قولي كده:\n«ضيف Galaxy A36 بسعر 22000 موبايلات»\nأو:\nالاسم | السعر | القسم");
        return res.status(200).json({ ok: true });
      }
      const f = await ghGet("products.json");
      if (!f) { await reply(chatId, "❌ تعذر قراءة المنتجات"); return res.status(200).json({ ok: true }); }
      let products = JSON.parse(f.content);
      const { put, item } = await addProduct({ name, price, category, image, products, sha: f.sha });
      if (put.ok) await reply(chatId, "✅ تم\n#" + item.id + " " + item.name + "\n💰 " + item.price + " ج.م\n📂 " + item.category);
      else await reply(chatId, "❌ فشل الحفظ: " + (put.data?.message || ""));
      return res.status(200).json({ ok: true });
    }

    if (command === "/ai") {
      const q = args.join(" ") || "مرحبا";
      const f = await ghGet("products.json");
      const list = f ? JSON.parse(f.content) : [];
      await reply(chatId, await localAi(q, list), { reply_markup: MENU });
      return res.status(200).json({ ok: true });
    }

    // Default: smart reply (no command needed)
    const f = await ghGet("products.json");
    const list = f ? JSON.parse(f.content) : [];
    await reply(chatId, await localAi(text, list), { reply_markup: MENU });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("telegram error", e);
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
}
