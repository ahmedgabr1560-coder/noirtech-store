/* NEXORA — frontend demo store (localStorage only) */
const DEMO = true;

const CATEGORIES = [
  { id: "phones", name: "الموبايلات", icon: "📱", href: "#phones" },
  { id: "laptops", name: "اللابتوبات", icon: "💻", href: "#laptops" },
  { id: "monitors", name: "الشاشات", icon: "🖥️", href: "#monitors" },
  { id: "home", name: "منزلية", icon: "🏠", href: "#home-app" },
  { id: "accessories", name: "إكسسوارات", icon: "🎧", href: "#accessories" }
];

/** Products loaded from products.json (bot-managed) */
let PRODUCTS = [];

let cart = JSON.parse(localStorage.getItem("nx_cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("nx_user") || "null");
let usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
let regAvatar = null;
let pendingAvatar = null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function money(n) {
  return Number(n).toLocaleString("ar-EG") + " ج.م";
}
function stars(r) {
  const full = Math.round(r);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
async function notifyAdmin(type, message, extra) {
  try {
    const payload = { type: type, message: message || "" };
    if (extra && typeof extra === "object") {
      if (extra.order) payload.order = extra.order;
    }
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("notify failed", e);
  }
}
function saveCart() {
  localStorage.setItem("nx_cart", JSON.stringify(cart));
  updateCartUI();
}
function discountPct(p) {
  if (!p.oldPrice || p.oldPrice <= p.price) return null;
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
}

function productCard(p) {
  const off = discountPct(p);
  return `<article class="product-card" data-id="${p.id}">
    <div class="product-media" data-open="${p.id}">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      ${off ? `<span class="badge-off">-${off}%</span>` : ""}
      <span class="badge-demo">تجريبي</span>
    </div>
    <div class="product-body">
      <h3 class="product-name" data-open="${p.id}">${p.name}</h3>
      <div class="rating" title="تقييم تجريبي">${stars(p.rating)} <span>(${p.reviews})</span></div>
      <div class="price-row">
        <span class="price">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
      </div>
      <button type="button" class="add-btn" data-add="${p.id}">أضف للسلة</button>
    </div>
  </article>`;
}

function renderGrid(el, list) {
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state">لا توجد منتجات في هذا القسم حاليًا.</div>`;
    return;
  }
  el.innerHTML = list.map(productCard).join("");
}

function renderAll() {
  $("#catsGrid").innerHTML = CATEGORIES.map(c =>
    `<a class="cat-card" href="${c.href}"><div class="ico">${c.icon}</div><h3>${c.name}</h3></a>`
  ).join("");

  renderGrid($("#bestGrid"), PRODUCTS.filter(p => p.best).slice(0, 8));
  renderGrid($("#newGrid"), PRODUCTS.filter(p => p.newest).slice(0, 8));
  renderGrid($("#phonesGrid"), PRODUCTS.filter(p => p.category === "phones"));
  renderGrid($("#laptopsGrid"), PRODUCTS.filter(p => p.category === "laptops"));
  renderGrid($("#monitorsGrid"), PRODUCTS.filter(p => p.category === "monitors"));
  renderGrid($("#homeGrid"), PRODUCTS.filter(p => p.category === "home"));
  renderGrid($("#accessoriesGrid"), PRODUCTS.filter(p => p.category === "accessories"));
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  $("#cartCount").textContent = count;
  const box = $("#cartItems");
  const fields = $("#checkoutFields");
  if (!cart.length) {
    box.innerHTML = `<div class="empty-cart">السلة فارغة<br><small>أضف منتجات ثم أتمم الطلب</small></div>`;
    $("#cartTotal").textContent = money(0);
    if (fields) fields.hidden = true;
    return;
  }
  if (fields) {
    fields.hidden = false;
    if (currentUser) {
      if ($("#orderName") && !$("#orderName").value) $("#orderName").value = currentUser.name || "";
      if ($("#orderPhone") && !$("#orderPhone").value) $("#orderPhone").value = currentUser.phone || "";
      if ($("#orderAddress") && !$("#orderAddress").value) $("#orderAddress").value = currentUser.address || "";
    }
  }
  box.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    if (!p) return "";
    return `<div class="cart-line">
      <img src="${p.image}" alt="" />
      <div>
        <h4>${p.name}</h4>
        <div class="price">${money(p.price)}</div>
        <div class="qty-controls">
          <button type="button" data-dec="${p.id}">−</button>
          <span>${i.qty}</span>
          <button type="button" data-inc="${p.id}">+</button>
        </div>
      </div>
      <button type="button" class="icon-close" data-remove="${p.id}" style="width:30px;height:30px;font-size:1rem">×</button>
    </div>`;
  }).join("");
  const total = cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  $("#cartTotal").textContent = money(total);
}

function addToCart(id) {
  const item = cart.find(x => x.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart();
  const p = PRODUCTS.find(x => x.id === id);
  toast(p ? `تمت إضافة ${p.name}` : "تمت الإضافة");
}

function openCart() {
  $("#cartOverlay").classList.add("open");
  $("#cartDrawer").classList.add("open");
}
function closeCart() {
  $("#cartOverlay").classList.remove("open");
  $("#cartDrawer").classList.remove("open");
}

function openProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const off = discountPct(p);
  $("#productDetail").innerHTML = `
    <div><img src="${p.image}" alt="${p.name}" /></div>
    <div>
      <span class="detail-badge">بيانات تجريبية</span>
      <h2 style="margin-bottom:8px">${p.name}</h2>
      <div class="rating" style="margin-bottom:10px">${stars(p.rating)} <span>(${p.reviews} تقييم تجريبي)</span></div>
      <div class="price-row" style="margin-bottom:12px">
        <span class="price" style="font-size:1.35rem">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
        ${off ? `<span class="badge-off" style="position:static">-${off}%</span>` : ""}
      </div>
      <p class="muted" style="margin-bottom:16px">${p.desc}</p>
      <button type="button" class="btn btn-primary" data-add="${p.id}">أضف للسلة</button>
    </div>`;
  $("#productOverlay").classList.add("open");
  $("#productModal").classList.add("open");
}
function closeProduct() {
  $("#productOverlay").classList.remove("open");
  $("#productModal").classList.remove("open");
}

function openAuth(tab = "login") {
  $("#authOverlay").classList.add("open");
  $("#authModal").classList.add("open");
  switchAuth(tab);
}
function closeAuth() {
  $("#authOverlay").classList.remove("open");
  $("#authModal").classList.remove("open");
}
function switchAuth(tab = "login") {
  const loginPanel = document.getElementById("loginPanel");
  const registerPanel = document.getElementById("registerPanel");
  if (loginPanel) loginPanel.hidden = tab !== "login";
  if (registerPanel) registerPanel.hidden = tab !== "register";
}

function updateUserUI() {
  const label = $("#accountLabel");
  if (currentUser) {
    label.textContent = (currentUser.name || "حسابي").split(" ")[0];
  } else {
    label.textContent = "حسابي";
  }
}

function openProfile() {
  if (!currentUser) return openAuth("login");
  $("#profName").value = currentUser.name || "";
  $("#profPhone").value = currentUser.phone || "";
  $("#profEmail").value = currentUser.email || "";
  $("#profAddress").value = currentUser.address || "";
  $("#profileName").textContent = currentUser.name || "الملف الشخصي";
  $("#profileEmail").textContent = currentUser.email || "";
  const img = document.getElementById("profileAvatar");
  const fb = document.getElementById("profileFallback");
  if (currentUser.avatar) {
    if (img) { img.src = currentUser.avatar; img.classList.add("is-on"); }
    if (fb) fb.classList.add("is-off");
  } else {
    if (img) { img.removeAttribute("src"); img.classList.remove("is-on"); }
    if (fb) {
      fb.classList.remove("is-off");
      fb.textContent = (currentUser.name || "?").trim().charAt(0).toUpperCase();
    }
  }
  $("#profileOverlay").classList.add("open");
  $("#profileModal").classList.add("open");
}
function closeProfile() {
  $("#profileOverlay").classList.remove("open");
  $("#profileModal").classList.remove("open");
}

// Events
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) { addToCart(Number(add.dataset.add)); return; }
  const open = e.target.closest("[data-open]");
  if (open) { openProduct(Number(open.dataset.open)); return; }
  const inc = e.target.closest("[data-inc]");
  if (inc) {
    const it = cart.find(x => x.id === Number(inc.dataset.inc));
    if (it) { it.qty += 1; saveCart(); }
    return;
  }
  const dec = e.target.closest("[data-dec]");
  if (dec) {
    const id = Number(dec.dataset.dec);
    const it = cart.find(x => x.id === id);
    if (it) { it.qty -= 1; if (it.qty <= 0) cart = cart.filter(x => x.id !== id); saveCart(); }
    return;
  }
  const rm = e.target.closest("[data-remove]");
  if (rm) { cart = cart.filter(x => x.id !== Number(rm.dataset.remove)); saveCart(); }
});

$("#cartBtn").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#cartOverlay").addEventListener("click", closeCart);
$("#closeProduct").addEventListener("click", closeProduct);
$("#productOverlay").addEventListener("click", closeProduct);
$("#closeAuth").addEventListener("click", closeAuth);
$("#authOverlay").addEventListener("click", closeAuth);
$("#closeProfile").addEventListener("click", closeProfile);
$("#profileOverlay").addEventListener("click", closeProfile);

$("#accountBtn").addEventListener("click", () => {
  if (currentUser) openProfile();
  else openAuth("login");
});

document.getElementById("goToRegister")?.addEventListener("click", () => switchAuth("register"));
document.getElementById("goToLogin")?.addEventListener("click", () => switchAuth("login"));

$("#menuToggle").addEventListener("click", () => {
  $("#catNav").classList.toggle("open");
});

$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("#searchInput").value.trim().toLowerCase();
  if (!q) return;
  const found = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));
  renderGrid($("#bestGrid"), found.length ? found : []);
  toast(found.length ? `نتائج البحث: ${found.length}` : "لا توجد نتائج");
  document.getElementById("best").scrollIntoView({ behavior: "smooth" });
});

$("#regAvatarInput")?.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (f.size > 2e6) return toast("الصورة كبيرة (حد 2MB)");
  const r = new FileReader();
  r.onload = () => {
    regAvatar = r.result;
    const img = document.getElementById("regAvatarPreview");
    const ph = document.getElementById("regAvatarPlaceholder");
    if (img) { img.src = regAvatar; img.classList.add("is-on"); }
    if (ph) ph.classList.add("is-off");
  };
  r.readAsDataURL(f);
});

$("#profileAvatarInput")?.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (f.size > 2e6) return toast("الصورة كبيرة");
  const r = new FileReader();
  r.onload = () => {
    pendingAvatar = r.result;
    const img = document.getElementById("profileAvatar");
    const fb = document.getElementById("profileFallback");
    if (img) { img.src = pendingAvatar; img.classList.add("is-on"); }
    if (fb) fb.classList.add("is-off");
  };
  r.readAsDataURL(f);
});

$("#registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#regName").value.trim();
  const phone = $("#regPhone").value.trim();
  const email = $("#regEmail").value.trim().toLowerCase();
  const password = $("#regPassword").value;
  if (!regAvatar) {
    toast("صورة البروفايل مطلوبة");
    document.querySelector(".avatar-ring")?.classList.add("required-pulse");
    setTimeout(() => document.querySelector(".avatar-ring")?.classList.remove("required-pulse"), 1200);
    return;
  }
  if (!name) return toast("اكتب الاسم");
  if (!phone) return toast("اكتب رقم الهاتف");
  if (!email) return toast("اكتب البريد الإلكتروني");
  if (!password || password.length < 4) return toast("كلمة المرور قصيرة");
  usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
  if (usersDB.some(u => u.email === email)) return toast("هذا البريد مسجّل بالفعل");
  const user = { name, phone, email, password, address: "", avatar: regAvatar };
  usersDB.push(user);
  localStorage.setItem("nx_users", JSON.stringify(usersDB));
  currentUser = { name, phone, email, address: "", avatar: regAvatar };
  localStorage.setItem("nx_user", JSON.stringify(currentUser));
  regAvatar = null;
  updateUserUI();
  closeAuth();
  toast("تم إنشاء الحساب بنجاح");
  notifyAdmin("register", "👤 " + name + "\n📞 " + phone + "\n📧 " + email + "\n🖼 صورة بروفايل: نعم\n✅ حساب جديد على NEXORA");
  openProfile();
});

$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
  const user = usersDB.find(u => u.email === email && String(u.password) === String(password));
  if (!user) {
    const exists = usersDB.some(u => u.email === email);
    return toast(exists ? "كلمة المرور غير صحيحة" : "لا يوجد حساب بهذا البريد");
  }
  currentUser = { name: user.name, phone: user.phone, email: user.email, address: user.address || "", avatar: user.avatar || null };
  localStorage.setItem("nx_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuth();
  toast(`مرحبًا ${user.name}`);
  notifyAdmin("login", `👤 ${user.name}\n📞 ${user.phone || "-"}\n📧 ${user.email}`);
});

$("#profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return;
  currentUser.name = $("#profName").value.trim();
  currentUser.phone = $("#profPhone").value.trim();
  currentUser.email = $("#profEmail").value.trim().toLowerCase();
  currentUser.address = $("#profAddress").value.trim();
  if (pendingAvatar) { currentUser.avatar = pendingAvatar; pendingAvatar = null; }
  localStorage.setItem("nx_user", JSON.stringify(currentUser));
  usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
  const i = usersDB.findIndex(u => u.email === currentUser.email);
  if (i >= 0) {
    usersDB[i] = { ...usersDB[i], ...currentUser };
    localStorage.setItem("nx_users", JSON.stringify(usersDB));
  }
  updateUserUI();
  closeProfile();
  toast("تم حفظ الملف الشخصي");
  notifyAdmin("profile", `👤 ${currentUser.name}\n📞 ${currentUser.phone}\n📧 ${currentUser.email}\n📍 ${currentUser.address || "-"}`);
});

$("#logoutBtn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("nx_user");
  updateUserUI();
  closeProfile();
  toast("تم تسجيل الخروج");
});


function showOrderSuccess(orderId) {
  const idEl = document.getElementById("orderSuccessId");
  if (idEl) idEl.textContent = orderId;
  document.getElementById("orderSuccessOverlay")?.classList.add("open");
  document.getElementById("orderSuccessModal")?.classList.add("open");
}
function closeOrderSuccess() {
  document.getElementById("orderSuccessOverlay")?.classList.remove("open");
  document.getElementById("orderSuccessModal")?.classList.remove("open");
}
document.getElementById("orderSuccessClose")?.addEventListener("click", closeOrderSuccess);
document.getElementById("orderSuccessOverlay")?.addEventListener("click", closeOrderSuccess);

$("#checkoutBtn").addEventListener("click", async () => {
  if (!cart.length) return toast("السلة فارغة");
  if (!currentUser) {
    closeCart();
    openAuth("login");
    return toast("سجّل الدخول أولاً لإتمام الطلب");
  }

  const name = ($("#orderName")?.value || currentUser.name || "").trim();
  const phone = ($("#orderPhone")?.value || currentUser.phone || "").trim();
  const address = ($("#orderAddress")?.value || currentUser.address || "").trim();
  const note = ($("#orderNote")?.value || "").trim();

  if (!name) return toast("اكتب اسم المستلم");
  if (!phone || phone.length < 10) return toast("اكتب رقم هاتف صحيح");
  if (!address) return toast("اكتب عنوان التوصيل");

  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.address = address;
  localStorage.setItem("nx_user", JSON.stringify(currentUser));
  let db = JSON.parse(localStorage.getItem("nx_users") || "[]");
  const ui = db.findIndex(u => u.email === currentUser.email);
  if (ui >= 0) {
    db[ui] = { ...db[ui], ...currentUser };
    localStorage.setItem("nx_users", JSON.stringify(db));
  }
  updateUserUI();

  const orderId = "NX-" + Date.now().toString().slice(-8);
  const lines = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    if (!p) return null;
    return "• " + p.name + " × " + i.qty + " = " + (p.price * i.qty).toLocaleString("ar-EG") + " ج.م";
  }).filter(Boolean);
  const total = cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  const orderRecord = {
    id: orderId,
    at: new Date().toISOString(),
    customer: { name: name, phone: phone, email: currentUser.email, address: address, note: note },
    items: cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return p ? { id: p.id, name: p.name, price: p.price, qty: i.qty } : null;
    }).filter(Boolean),
    total: total,
    status: "new"
  };
  const orders = JSON.parse(localStorage.getItem("nx_orders") || "[]");
  orders.unshift(orderRecord);
  localStorage.setItem("nx_orders", JSON.stringify(orders.slice(0, 50)));

  let orderMsg = "🆔 " + orderId + "\n";
  orderMsg += "👤 " + name + "\n📞 " + phone + "\n📧 " + currentUser.email + "\n📍 " + address + "\n";
  if (note) orderMsg += "📝 " + note + "\n";
  orderMsg += "\n📦 المنتجات:\n" + lines.join("\n");
  orderMsg += "\n\n💰 الإجمالي: " + total.toLocaleString("ar-EG") + " ج.م";
  orderMsg += "\n✅ طلب مؤكد — تواصل مع العميل";

  const btn = $("#checkoutBtn");
  if (btn) { btn.disabled = true; btn.textContent = "جاري إرسال الطلب..."; }

  
  const richItems = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      qty: i.qty,
      image: p.image,
      category: p.category,
      description: p.description || p.desc || "",
      specs: p.specs || {}
    };
  }).filter(Boolean);

  const orderPayload = {
    id: orderId,
    total: total,
    customer: { name: name, phone: phone, email: currentUser.email, address: address, note: note },
    items: richItems
  };

  try {
    await notifyAdmin("order", orderMsg, { order: orderPayload });
  } catch (e) {}


  const waText = encodeURIComponent("طلب NEXORA " + orderId + "\n\n" + orderMsg);
  window.open("https://wa.me/201064519541?text=" + waText, "_blank");

  cart = [];
  saveCart();
  closeCart();
  if ($("#orderNote")) $("#orderNote").value = "";
  showOrderSuccess(orderId);
  toast("تم تأكيد طلبك بنجاح");
  if (btn) { btn.disabled = false; btn.textContent = "إتمام الطلب الآن"; }
});


$("#contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputs = e.target.querySelectorAll("input, textarea");
  const vals = [...inputs].map(i => i.value.trim()).filter(Boolean);
  await notifyAdmin("contact", vals.join("\n") || "رسالة فارغة");
  toast("تم إرسال رسالتك ✅");
  e.target.reset();
});

// Init — load products from JSON (Telegram bot can update them)
async function loadProducts() {
  try {
    const r = await fetch("/products.json?t=" + Date.now());
    if (!r.ok) throw new Error("fail");
    const data = await r.json();
    PRODUCTS = (Array.isArray(data) ? data : []).filter(p => !p.hidden).map(p => ({
      ...p,
      rating: p.rating || 4.2,
      reviews: p.reviews || 20,
      best: p.best ?? (p.id % 3 === 0),
      newest: p.newest ?? (p.id % 4 === 0),
      desc: p.description || p.desc || (p.name + " — متوفر في NEXORA"),
      // map legacy categories
      category: p.category === "audio" || p.category === "wearables" ? "accessories" : p.category
    }));
  } catch (e) {
    console.error(e);
    PRODUCTS = [];
  }
  renderAll();
  updateCartUI();
}

loadProducts();
updateUserUI();


/* —— AI Chat (same behavior as before) —— */
window._aiHistory = JSON.parse(localStorage.getItem("nx_ai_history") || "[]");
window._aiBusy = false;

function openAiChat() {
  document.getElementById("aiPanel")?.classList.add("open");
  document.getElementById("aiOverlay")?.classList.add("open");
  document.getElementById("aiInput")?.focus();
}
function closeAiChat() {
  document.getElementById("aiPanel")?.classList.remove("open");
  document.getElementById("aiOverlay")?.classList.remove("open");
}
function escapeAiText(t) {
  return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function formatAiReply(t) {
  return escapeAiText(t).replace(/\n/g, "<br>");
}
function appendAiMsg(html, who) {
  const box = document.getElementById("aiMessages");
  if (!box) return;
  const div = document.createElement("div");
  div.className = "ai-msg " + who;
  div.innerHTML = `<div class="ai-bubble">${html}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
function addAiTyping() {
  const box = document.getElementById("aiMessages");
  if (!box) return;
  const typing = document.createElement("div");
  typing.className = "ai-msg bot";
  typing.id = "aiTyping";
  typing.innerHTML = `<div class="ai-bubble ai-typing"><i></i><i></i><i></i></div>`;
  box.appendChild(typing);
  box.scrollTop = box.scrollHeight;
}
function localAiReply(msg) {
  const m = msg.toLowerCase();
  if (/موبايل|هاتف|phone|ايفون|آيفون/.test(m)) return "عندنا قسم موبايلات تجريبي كامل 📱 قول ميزانيتك وأرشّحلك من القائمة.";
  if (/لابتوب|لاب|laptop|ماك/.test(m)) return "اللابتوبات في NEXORA جاهزة للتصفح 💻 تحب جهاز للشغل ولا للألعاب؟";
  if (/سماعة|اكسسوار|إكسسوار|سماعة/.test(m)) return "الإكسسوارات والعروض تحت قسم العروض 🎧";
  if (/عرض|خصم|رخيص/.test(m)) return "شوف قسم العروض في الصفحة — فيه خصومات تجريبية مميزة 🔥";
  if (/مرحبا|اهلا|السلام|hi|hello/.test(m)) return "أهلاً بيك في NEXORA 👋 تحب مساعدة في موبايل، لابتوب، ولا إكسسوار؟";
  return "تمام 😄 قولي عايز إيه بالظبط: موبايل، لابتوب، شاشة، ولا إكسسوار؟";
}
async function handleAiSend() {
  if (window._aiBusy) return;
  const input = document.getElementById("aiInput");
  const sendBtn = document.getElementById("aiSend");
  const text = (input?.value || "").trim();
  if (!text) return;
  window._aiBusy = true;
  appendAiMsg(escapeAiText(text), "user");
  if (input) input.value = "";
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "…"; }
  addAiTyping();
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: window._aiHistory.slice(-12),
        catalog: PRODUCTS.slice(0, 40).map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price }))
      })
    });
    const data = await res.json().catch(() => ({}));
    document.getElementById("aiTyping")?.remove();
    const reply = (res.ok && data.reply) ? data.reply : localAiReply(text);
    appendAiMsg(formatAiReply(reply), "bot");
    window._aiHistory.push({ role: "user", content: text }, { role: "assistant", content: reply });
    window._aiHistory = window._aiHistory.slice(-20);
    localStorage.setItem("nx_ai_history", JSON.stringify(window._aiHistory));
  } catch {
    document.getElementById("aiTyping")?.remove();
    const reply = localAiReply(text);
    appendAiMsg(formatAiReply(reply), "bot");
  } finally {
    window._aiBusy = false;
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "➤"; }
    input?.focus();
  }
}

document.getElementById("aiChatBtn")?.addEventListener("click", openAiChat);
document.getElementById("aiClose")?.addEventListener("click", closeAiChat);
document.getElementById("aiOverlay")?.addEventListener("click", closeAiChat);
document.getElementById("aiSend")?.addEventListener("click", handleAiSend);
document.getElementById("aiInput")?.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); }
});
document.getElementById("aiSuggestions")?.addEventListener("click", e => {
  const chip = e.target.closest(".ai-chip");
  if (!chip) return;
  const q = chip.getAttribute("data-q");
  const input = document.getElementById("aiInput");
  if (input && q) { input.value = q; handleAiSend(); }
});
