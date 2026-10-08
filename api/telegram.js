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
async function reply(chatId, text) {
  return tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
}
async function getFile(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "NoirTech-Bot" };
  if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, { headers });
  if (!r.ok) return null;
  const data = await r.json();
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
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
  return `🎛 <b>تحكم كامل — NoirTech</b>\n\n📦 <b>المنتجات</b>\n/products | /product id\n/setprice id سعر\n/setbadge id نص\n/hide id | /show id\n\n🎨 <b>التصميم</b>\n/config\n/theme dark|gold|purple|red\n/setcolor gold #ffaa00\n\n✍️ <b>النصوص</b>\n/sethero نص\n/setdesc وصف\n/setbadgehero شارة\n/setbtn نص الزر\n/setname الاسم\n/setsite الاسم\n\n📞 /setphone | /setemail | /setaddress\n👁 /toggle about|contact|categories|whatsapp|telegram|ai\n🛒 /orders\nℹ️ /status /help`;
}
const THEMES = {
  dark: { bg: "#07070a", bgCard: "#0f0f14", gold: "#f0b429", goldLight: "#ffd666", goldDark: "#d4920a", accent: "#7c5cff", text: "#f4f4f8", textMuted: "#9898a6" },
  gold: { bg: "#0c0a06", bgCard: "#16120a", gold: "#ffc233", goldLight: "#ffe08a", goldDark: "#c49200", accent: "#d4a017", text: "#fff8e7", textMuted: "#b8a88a" },
  purple: { bg: "#0a0712", bgCard: "#120e1c", gold: "#c4a0ff", goldLight: "#e0c8ff", goldDark: "#8b5cf6", accent: "#a78bfa", text: "#f3e8ff", textMuted: "#a89bb8" },
  red: { bg: "#0c0707", bgCard: "#160e0e", gold: "#ff5c5c", goldLight: "#ff8a8a", goldDark: "#e11d48", accent: "#f43f5e", text: "#fff1f1", textMuted: "#b89a9a" }
};
export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ ok: true });
  if (req.method !== "POST") return res.status(405).end();
  try {
    const msg = (req.body || {}).message || (req.body || {}).edited_message;
    if (!msg?.text) return res.status(200).json({ ok: true });
    const chatId = String(msg.chat.id);
    const text = msg.text.trim();
    if (chatId !== ADMIN_CHAT) { await reply(chatId, "⛔ للإدارة فقط"); return res.status(200).json({ ok: true }); }
    const [cmd, ...args] = text.split(/\s+/);
    const command = (cmd || "").toLowerCase().replace(/@\w+/, "");
    if (command === "/start" || command === "/help") { await reply(chatId, helpText()); return res.status(200).json({ ok: true }); }
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
