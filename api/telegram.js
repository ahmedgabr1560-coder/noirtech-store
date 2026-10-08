const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8737261045:AAGXsJDLKJAf0xsJzegLjWcBX3PUHZlzqow";
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

async function getFileFromGitHub(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "NoirTech-Bot" };
  if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, { headers });
  if (!r.ok) return null;
  const data = await r.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { content, sha: data.sha };
}

async function putFileToGitHub(path, content, message, sha) {
  if (!GH_TOKEN) return { ok: false, error: "GITHUB_TOKEN غير مضبوط على Vercel" };
  const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "NoirTech-Bot"
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch: "main"
    })
  });
  const data = await r.json();
  return { ok: r.ok, data };
}

function helpText() {
  return `🎛 <b>لوحة تحكم NoirTech</b>\n\n📦 <b>المنتجات</b>\n/products — عرض المنتجات\n/product &lt;id&gt; — تفاصيل منتج\n/setprice &lt;id&gt; &lt;سعر&gt; — تغيير السعر\n/setold &lt;id&gt; &lt;سعر&gt; — سعر قديم (0 للحذف)\n/setbadge &lt;id&gt; &lt;نص&gt; — شارة (- للحذف)\n/hide &lt;id&gt; — إخفاء\n/show &lt;id&gt; — إظهار\n\n🛒 /orders — آخر الطلبات\nℹ️ /status — حالة المتجر\n/help — المساعدة`;
}

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ ok: true, service: "NoirTech Telegram Admin" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const update = req.body || {};
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) return res.status(200).json({ ok: true });

    const chatId = String(msg.chat.id);
    const text = (msg.text || "").trim();

    if (chatId !== ADMIN_CHAT) {
      await reply(chatId, "⛔ هذا البوت مخصص لإدارة متجر NoirTech فقط.");
      return res.status(200).json({ ok: true });
    }

    const [cmd, ...args] = text.split(/\s+/);
    const command = (cmd || "").toLowerCase().replace(/@\w+/, "");

    if (command === "/start" || command === "/help") {
      await reply(chatId, helpText());
      return res.status(200).json({ ok: true });
    }

    if (command === "/status") {
      await reply(chatId, `✅ <b>NoirTech يعمل</b>\n🌐 https://noirtech-store.vercel.app\n🤖 البوت متصل\n🔑 GitHub: ${GH_TOKEN ? "مربوط ✅" : "غير مربوط — عدّل GITHUB_TOKEN على Vercel"}`);
      return res.status(200).json({ ok: true });
    }

    let products = null;
    let sha = null;
    const file = await getFileFromGitHub("products.json");
    if (file) {
      try { products = JSON.parse(file.content); sha = file.sha; } catch (e) { products = null; }
    }

    if (command === "/products") {
      if (!products || !Array.isArray(products)) {
        await reply(chatId, "⚠️ لا يوجد products.json");
        return res.status(200).json({ ok: true });
      }
      const lines = products.filter(p => !p.hidden).slice(0, 40).map(
        p => `#${p.id} ${p.name}\n   💰 ${Number(p.price).toLocaleString("ar-EG")} ج.م${p.badge ? " | " + p.badge : ""}`
      );
      await reply(chatId, `📦 <b>المنتجات (${products.filter(p => !p.hidden).length})</b>\n\n${lines.join("\n\n")}`);
      return res.status(200).json({ ok: true });
    }

    if (command === "/product") {
      const id = Number(args[0]);
      if (!id || !products) { await reply(chatId, "استخدم: /product &lt;id&gt;"); return res.status(200).json({ ok: true }); }
      const p = products.find(x => x.id === id);
      if (!p) { await reply(chatId, "غير موجود"); return res.status(200).json({ ok: true }); }
      await reply(chatId, `📱 <b>${p.name}</b>\nID: ${p.id}\nقسم: ${p.category}\nسعر: ${p.price}\nقديم: ${p.oldPrice || "—"}\nشارة: ${p.badge || "—"}\nمخفي: ${p.hidden ? "نعم" : "لا"}`);
      return res.status(200).json({ ok: true });
    }

    async function saveProducts(newProducts, message) {
      const content = JSON.stringify(newProducts, null, 2);
      const result = await putFileToGitHub("products.json", content, message, sha);
      if (!result.ok) {
        await reply(chatId, `❌ فشل الحفظ: ${result.error || result.data?.message || "خطأ"}`);
        return false;
      }
      return true;
    }

    if (command === "/setprice") {
      const id = Number(args[0]);
      const price = Number(args[1]);
      if (!id || !price || !products) { await reply(chatId, "مثال: /setprice 1 59999"); return res.status(200).json({ ok: true }); }
      const p = products.find(x => x.id === id);
      if (!p) { await reply(chatId, "غير موجود"); return res.status(200).json({ ok: true }); }
      const old = p.price; p.price = price;
      if (await saveProducts(products, `bot: price #${id} ${old}->${price}`))
        await reply(chatId, `✅ ${p.name}\n${old} ← <b>${price}</b> ج.م`);
      return res.status(200).json({ ok: true });
    }

    if (command === "/setold") {
      const id = Number(args[0]);
      const price = Number(args[1]);
      if (!id || args[1] === undefined || !products) { await reply(chatId, "مثال: /setold 1 65000 أو 0"); return res.status(200).json({ ok: true }); }
      const p = products.find(x => x.id === id);
      if (!p) { await reply(chatId, "غير موجود"); return res.status(200).json({ ok: true }); }
      p.oldPrice = price === 0 ? null : price;
      if (await saveProducts(products, `bot: oldPrice #${id}`))
        await reply(chatId, `✅ السعر القديم لـ ${p.name} تم تحديثه`);
      return res.status(200).json({ ok: true });
    }

    if (command === "/setbadge") {
      const id = Number(args[0]);
      const badge = args.slice(1).join(" ");
      if (!id || !products) { await reply(chatId, "مثال: /setbadge 1 جديد"); return res.status(200).json({ ok: true }); }
      const p = products.find(x => x.id === id);
      if (!p) { await reply(chatId, "غير موجود"); return res.status(200).json({ ok: true }); }
      p.badge = !badge || badge === "-" ? null : badge;
      if (await saveProducts(products, `bot: badge #${id}`))
        await reply(chatId, `✅ شارة ${p.name}: ${p.badge || "تم الحذف"}`);
      return res.status(200).json({ ok: true });
    }

    if (command === "/hide" || command === "/show") {
      const id = Number(args[0]);
      if (!id || !products) { await reply(chatId, `استخدم: ${command} &lt;id&gt;`); return res.status(200).json({ ok: true }); }
      const p = products.find(x => x.id === id);
      if (!p) { await reply(chatId, "غير موجود"); return res.status(200).json({ ok: true }); }
      p.hidden = command === "/hide";
      if (await saveProducts(products, `bot: ${command} #${id}`))
        await reply(chatId, command === "/hide" ? `🙈 تم إخفاء ${p.name}` : `👁 تم إظهار ${p.name}`);
      return res.status(200).json({ ok: true });
    }

    if (command === "/orders") {
      const ordersFile = await getFileFromGitHub("orders.json");
      if (!ordersFile) { await reply(chatId, "لا توجد طلبات محفوظة. الطلبات الجديدة توصلك كإشعار."); return res.status(200).json({ ok: true }); }
      try {
        const orders = JSON.parse(ordersFile.content);
        const last = (Array.isArray(orders) ? orders : []).slice(-10).reverse();
        if (!last.length) { await reply(chatId, "لا توجد طلبات."); return res.status(200).json({ ok: true }); }
        const t = last.map((o, i) => `${i + 1}. ${o.name || "—"} | ${o.phone || "—"}\n   ${o.total || "—"} | ${o.date || ""}`).join("\n\n");
        await reply(chatId, `🛒 <b>آخر الطلبات</b>\n\n${t}`);
      } catch (e) { await reply(chatId, "تعذر قراءة الطلبات."); }
      return res.status(200).json({ ok: true });
    }

    await reply(chatId, "أمر غير معروف. /help");
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
}
