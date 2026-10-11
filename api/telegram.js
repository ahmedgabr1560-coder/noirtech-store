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
    [{ text: "📦 المنتجات", callback_data: "cmd_products" }, { text: "➕ إضافة", callback_data: "hint_add" }],
    [{ text: "🤖 نورا AI", callback_data: "menu_ai" }, { text: "📊 الحالة", callback_data: "menu_status" }],
    [{ text: "❓ مساعدة", callback_data: "menu_help" }]
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
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "NEXORA" },
    body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64"), branch: "main", sha })
  });
  return { ok: r.ok, data: await r.json() };
}

function helpText() {
  return "🛍 <b>لوحة NEXORA</b>\n\n📦 /products — عرض المنتجات\n➕ /add الاسم | السعر | القسم | رابط الصورة\n🤖 /ai سؤالك\n📊 /status\n❓ /help\n\n🌐 https://nexoraegypt.vercel.app\n📝 إضافة منتج: https://nexoraegypt.vercel.app/admin.html";
}

async function localAi(q, list) {
  const t = String(q || "").toLowerCase();
  const phones = (list || []).filter(p => p.category === "phones").slice(0, 4);
  if (/موبايل|هاتف|iphone|سامسونج/.test(t)) {
    if (phones.length) return "تمام 📱 من الموبايلات:\n" + phones.map(p => "• " + p.name + " — " + p.price + " ج.م").join("\n") + "\nقولي ميزانيتك أدقق أكتر.";
    return "تمام 📱 قولي ميزانيتك وأرشّحلك.";
  }
  if (/لابتوب|laptop/.test(t)) return "اللابتوبات 💻 قولي: شغل ولا ألعاب؟ والميزانية كام؟";
  if (/سماع|سماعة/.test(t)) return "الصوتيات 🎧 عزل ضوضاء ولا سماعة رياضية؟";
  return "أنا نورا 🤖 مساعدة NEXORA. قولي: موبايل / لابتوب / سماعة وميزانيتك.";
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
      if (data === "menu_help" || data === "menu_status") {
        await reply(chatId, data === "menu_status" ? ("✅ NEXORA\n🌐 https://nexoraegypt.vercel.app\n🔑 GitHub: " + (GH_TOKEN ? "مربوط" : "لا")) : helpText(), { reply_markup: MENU });
      } else if (data === "cmd_products") {
        const f = await ghGet("products.json");
        const list = f ? JSON.parse(f.content) : [];
        const top = list.slice(0, 8).map(p => "#" + p.id + " " + p.name + " — " + p.price).join("\n");
        await reply(chatId, "📦 <b>عينة منتجات (" + list.length + ")</b>\n" + (top || "فارغ"), { reply_markup: MENU });
      } else if (data === "hint_add") {
        await reply(chatId, "➕ الصيغة:\n<code>/add الاسم | السعر | القسم | رابط الصورة</code>\nالأقسام: phones laptops monitors home accessories", { reply_markup: MENU });
      } else if (data === "menu_ai") {
        await reply(chatId, "🤖 اكتب:\n<code>/ai رشحلي موبايل بميزانية 15000</code>", { reply_markup: MENU });
      } else {
        await reply(chatId, helpText(), { reply_markup: MENU });
      }
      return res.status(200).json({ ok: true });
    }

    const msg = body.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chatId = String(msg.chat?.id || "");
    const text = String(msg.text || msg.caption || "").trim();
    if (!text) return res.status(200).json({ ok: true });

    if (chatId !== ADMIN_CHAT) {
      await reply(chatId, "⛔ لوحة الإدارة خاصة بالمالك.\nللتسوق: https://nexoraegypt.vercel.app");
      return res.status(200).json({ ok: true });
    }

    const [cmd, ...args] = text.split(/\s+/);
    const command = (cmd || "").toLowerCase().replace(/@\w+/, "");

    if (command === "/start" || command === "/help" || command === "/menu") {
      try {
        await tg("setMyCommands", { commands: [
          { command: "start", description: "🏠 القائمة" },
          { command: "products", description: "📦 المنتجات" },
          { command: "add", description: "➕ إضافة منتج" },
          { command: "ai", description: "🤖 نورا AI" },
          { command: "status", description: "📊 الحالة" },
          { command: "help", description: "❓ مساعدة" }
        ]});
      } catch (_) {}
      await reply(chatId, command === "/menu" ? "🎛 اختار من القائمة:" : helpText(), { reply_markup: MENU });
      return res.status(200).json({ ok: true });
    }

    if (command === "/status") {
      await reply(chatId, "✅ NEXORA شغال\n🌐 https://nexoraegypt.vercel.app\n🔑 GitHub: " + (GH_TOKEN ? "مربوط ✅" : "❌"));
      return res.status(200).json({ ok: true });
    }

    if (command === "/products") {
      const f = await ghGet("products.json");
      const list = f ? JSON.parse(f.content) : [];
      const top = list.slice(0, 12).map(p => "#" + p.id + " " + p.name + " — " + p.price + " ج.م").join("\n");
      await reply(chatId, "📦 المنتجات (" + list.length + ")\n\n" + (top || "لا يوجد"));
      return res.status(200).json({ ok: true });
    }

    if (command === "/ai") {
      const q = args.join(" ").trim();
      if (!q) {
        await reply(chatId, "اكتب بعد /ai سؤالك\nمثال: /ai رشحلي موبايل بـ 15000");
        return res.status(200).json({ ok: true });
      }
      const f = await ghGet("products.json");
      const list = f ? JSON.parse(f.content) : [];
      await reply(chatId, await localAi(q, list));
      return res.status(200).json({ ok: true });
    }

    if (command === "/add") {
      const raw = args.join(" ");
      const parts = raw.split("|").map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) {
        await reply(chatId, "الصيغة:\n/add الاسم | السعر | القسم | رابط الصورة");
        return res.status(200).json({ ok: true });
      }
      const f = await ghGet("products.json");
      if (!f) {
        await reply(chatId, "❌ تعذر قراءة products.json");
        return res.status(200).json({ ok: true });
      }
      let products = [];
      try { products = JSON.parse(f.content); } catch (_) {}
      const name = parts[0];
      const price = Number(String(parts[1]).replace(/[^0-9]/g, ""));
      let category = (parts[2] || "accessories").toLowerCase();
      if (/موبايل|phone/.test(category)) category = "phones";
      else if (/لابتوب|laptop/.test(category)) category = "laptops";
      else if (/شاشة|monitor/.test(category)) category = "monitors";
      else if (/منزل|home/.test(category)) category = "home";
      const allowed = new Set(["phones", "laptops", "monitors", "home", "accessories"]);
      if (!allowed.has(category)) category = "accessories";
      const image = parts[3] && /^https?:\/\//i.test(parts[3]) ? parts[3] : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80";
      if (!name || !price) {
        await reply(chatId, "الاسم والسعر مطلوبين");
        return res.status(200).json({ ok: true });
      }
      const id = Math.max(0, ...products.map(x => Number(x.id) || 0)) + 1;
      products.unshift({
        id, name: name.slice(0, 120), category, price: Math.round(price), oldPrice: null,
        image, badge: "جديد", hidden: false,
        description: name + " — متوفر لدى NEXORA",
        rating: 4.4, reviews: 5, best: false, newest: true
      });
      const put = await ghPut("products.json", JSON.stringify(products, null, 2), "bot: add " + name, f.sha);
      if (put.ok) await reply(chatId, "✅ تمت الإضافة\n#" + id + " " + name + "\n💰 " + price + " ج.م\n📂 " + category);
      else await reply(chatId, "❌ فشل الحفظ: " + (put.data?.message || ""));
      return res.status(200).json({ ok: true });
    }

    // natural language -> AI
    const f = await ghGet("products.json");
    const list = f ? JSON.parse(f.content) : [];
    await reply(chatId, await localAi(text, list), { reply_markup: MENU });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("telegram error", e);
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
}
