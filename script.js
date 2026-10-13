
function paymentLabel(method) {
  const map = { cod: "عند الاستلام", vodafone: "فودافون كاش", instapay: "إنستا باي", transfer: "تحويل بنكي", card: "بطاقة" };
  return map[method] || method || "عند الاستلام";
}
function updatePayInstructions() {
  const box = document.getElementById("payInstructions");
  if (!box) return;
  const method = document.querySelector('input[name="payMethod"]:checked')?.value || "cod";
  const c = window.siteConfig || {};
  const vf = c.vodafoneCash || c.phone || "";
  const ip = c.instapay || c.email || "";
  const note = c.paymentNote || "بعد التحويل ابعتي صورة الإيصال على واتساب.";
  if (method === "vodafone") {
    box.hidden = false;
    box.innerHTML = "<strong>فودافون كاش:</strong> <span dir=\"ltr\">" + vf + "</span><br><small>" + note + "</small>";
  } else if (method === "instapay") {
    box.hidden = false;
    box.innerHTML = "<strong>إنستا باي:</strong> <span dir=\"ltr\">" + ip + "</span><br><small>" + note + "</small>";
  } else if (method === "transfer") {
    box.hidden = false;
    box.innerHTML = "<strong>تحويل بنكي:</strong> تواصلي لتأكيد الحساب<br><small>" + note + "</small>";
  } else {
    box.hidden = true;
    box.innerHTML = "";
  }
}
document.addEventListener("change", (e) => {
  if (e.target && e.target.name === "payMethod") updatePayInstructions();
});

function applyGeneralConfig(c) {
  if (!c) return;
  const phone = (c.phone || "").trim();
  const email = (c.email || "").trim();
  const wa = String(c.whatsapp || phone || "").replace(/[^0-9]/g, "");
  const tg = (c.telegramBot || "").replace(/^@/, "").trim();
  const addr = (c.address || "").trim();

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.textContent = val; };
  setTxt("contactPhone", phone);
  setTxt("contactEmail", email);
  setTxt("contactAddress", addr);
  if (c.footerText) setTxt("footerText", c.footerText);
  if (c.aboutText || c.footerAbout) setTxt("footerAbout", c.aboutText || c.footerAbout);

  // WhatsApp float
  const waEl = document.getElementById("floatWhatsapp") || document.querySelector('a[href*="wa.me"]');
  if (waEl) {
    if (wa) waEl.href = "https://wa.me/" + wa;
    waEl.style.display = c.showFloatWhatsapp === false ? "none" : "";
  }
  // Telegram float
  const tgEl = document.getElementById("floatTelegram") || document.querySelector('a[href*="t.me"]');
  if (tgEl) {
    if (tg) tgEl.href = "https://t.me/" + tg;
    tgEl.style.display = c.showFloatTelegram === false ? "none" : "";
  }
  // AI float
  const aiEl = document.getElementById("floatAiBtn") || document.getElementById("aiToggle") || document.querySelector(".ai-fab, #aiOpen, .ai-open");
  if (aiEl) {
    aiEl.style.display = c.showFloatAI === false ? "none" : "";
  }
  // contact anchors in page
  document.querySelectorAll('a[href^="tel:"]').forEach(a => { if (phone) a.href = "tel:" + phone; });
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => { if (email) a.href = "mailto:" + email; });
}

function applyBrandConfig(c) {
  if (!c) return;
  const name = (c.siteName || "NEXORA").trim();
  const mark = (c.logoMark || name.slice(0, 2) || "NX").trim().slice(0, 3).toUpperCase();
  const tag = (c.siteTagline || "").trim();
  const fav = (c.favicon || "").trim();
  const logoName = document.getElementById("logoName");
  const logoMark = document.getElementById("logoMarkText");
  const docTitle = document.getElementById("docTitle");
  if (logoName) logoName.textContent = name;
  if (logoMark) logoMark.textContent = mark;
  if (docTitle) docTitle.textContent = tag ? (name + " | " + tag) : name;
  document.title = tag ? (name + " | " + tag) : name;
  // favicon
  let link = document.getElementById("siteFavicon");
  if (!link) {
    link = document.querySelector('link[rel="icon"]');
  }
  if (link && fav) {
    link.href = fav + (fav.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();
    if (fav.endsWith(".svg")) link.type = "image/svg+xml";
    else if (fav.endsWith(".png")) link.type = "image/png";
    else if (fav.endsWith(".ico")) link.type = "image/x-icon";
    else link.removeAttribute("type");
  }
  // footer logo text if any
  document.querySelectorAll(".footer-logo .logo-text, .footer-logo #logoName").forEach(el => {
    if (el.id === "logoName" || el.classList.contains("logo-text")) {
      // skip if same as header id already updated
    }
  });
}

async function loadHeroConfig() {
  try {
    const r = await fetch("/site-config.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const c = await r.json();
    window.siteConfig = c;
    applyBrandConfig(c);
    applyGeneralConfig(c);
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el && val != null && String(val).trim() !== "") el.textContent = val; };
    const setImg = (id, val) => {
      const el = document.getElementById(id);
      if (!el || !val) return;
      const url = String(val);
      const bust = url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
      el.setAttribute("src", bust);
      el.loading = "eager";
      el.style.opacity = "1";
      el.onerror = function () {
        // fallback without bust
        if (el.src !== url) el.src = url;
      };
    };
    setTxt("heroBadgeText", c.heroBadge);
    if (c.heroTitle) {
      const h = document.getElementById("heroTitleLine");
      if (h) {
        const hi = c.heroHighlight || "";
        h.innerHTML = c.heroTitle + (hi ? "<br><span class=\"grad\" id=\"heroHighlightText\">" + hi + "</span>" : "");
      }
    }
    setTxt("heroDescText", c.heroDesc);
    setTxt("heroChipTitle", c.heroChipTitle);
    setTxt("heroChipSub", c.heroChipSub);
    if (c.heroBtn) {
      const b = document.getElementById("heroBtnText");
      if (b) b.innerHTML = c.heroBtn + ' <span class="arrow">←</span>';
    }
    setImg("heroImg1", c.heroImage1);
    setImg("heroImg2", c.heroImage2);
    updatePayInstructions();
  } catch (e) { console.warn("hero config", e); }
}


// One-time: clear ONLY legacy accounts, then never again (new accounts stay)
(function () {
  try {
    if (localStorage.getItem("nx_auth_clean_v2") === "1") return;
    localStorage.removeItem("nx_user");
    localStorage.removeItem("nx_users");
    localStorage.removeItem("noirtech_user");
    localStorage.removeItem("noirtech_users");
    localStorage.setItem("nx_auth_clean_v2", "1");
  } catch (e) {}
})();


/* NEXORA — frontend demo store (localStorage only) */
const DEMO = false;

let CATEGORIES = [];
let BRANDS = [];
let activeCategory = "";
let activeSubcategory = "";
let activeBrand = "";
let activeSort = "newest";


/** Products loaded from products.json (bot-managed) */
let PRODUCTS = [];

let cart = JSON.parse(localStorage.getItem("nx_cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("nx_user") || "null");
let usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
let regAvatar = null;
let pendingAvatar = null;

const $ = (s, r = document) => r.querySelector(s);
function normalizePhone(v) {
  const map = {"٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"};
  return String(v || "").replace(/[٠-٩]/g, d => map[d] || d).replace(/[^0-9+]/g, "");
}
function cartLinePrice(i) {
  if (i.price != null) return Number(i.price);
  const p = PRODUCTS.find(x => Number(x.id) === Number(i.id));
  return p ? Number(p.price) : 0;
}

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
    const payload = { type: type || "info", message: message || "" };
    if (extra && typeof extra === "object" && extra.order) payload.order = extra.order;
    const r = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return r.ok;
  } catch (e) {
    console.warn("notify failed", e);
    return false;
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
    <a class="product-media" href="/product.html?id=${p.id}" data-open="${p.id}">
      <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&q=70'" />
      ${off ? `<span class="badge-off">-${off}%</span>` : ""}
    </a>
    <div class="product-body">
      <h3 class="product-name"><a class="product-link" href="/product.html?id=${p.id}" data-open="${p.id}">${p.name}</a></h3>
      <div class="rating" title="تقييم">${stars(p.rating)} <span>(${p.reviews} تقييم)</span></div>
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
  const catsGrid = $("#catsGrid");
  if (catsGrid) {
    catsGrid.innerHTML = CATEGORIES.map(c =>
      `<button type="button" class="cat-card" data-cat="${c.id}">
        <div class="ico">${c.icon || "📦"}</div>
        <h3>${c.name_ar}</h3>
        <small>${(c.subs || []).length} قسم فرعي</small>
      </button>`
    ).join("");
  }
  renderMegaMenu();
  renderCatNav();
  renderCatsDirectory();
  renderGrid($("#bestGrid"), PRODUCTS.filter(p => p.best).slice(0, 8));
  renderGrid($("#newGrid"), PRODUCTS.filter(p => p.newest).slice(0, 8));
  renderShop();
  // default storefront to fashion
  if (typeof setShopFilter === "function" && CATEGORIES.some(c => c.id === "fashion")) {
    try { setShopFilter("fashion", ""); } catch (e) {}
  }
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
    const p = PRODUCTS.find(x => Number(x.id) === Number(i.id));
    const name = (i.name || (p && p.name) || ("منتج #" + i.id));
    const price = (i.price != null ? i.price : (p ? p.price : 0));
    const image = (i.image || (p && p.image) || "");
    if (!name && !p) return "";
    return `<div class="cart-line">
      <img src="${image}" alt="" />
      <div>
        <h4>${name}</h4>
        <div class="price">${money(price)}</div>
        <div class="qty-controls">
          <button type="button" data-dec="${i.id}">−</button>
          <span>${i.qty}</span>
          <button type="button" data-inc="${i.id}">+</button>
        </div>
      </div>
      <button type="button" class="icon-close" data-remove="${i.id}" style="width:30px;height:30px;font-size:1rem">×</button>
    </div>`;
  }).join("");
  const total = cart.reduce((s, i) => s + cartLinePrice(i) * (Number(i.qty) || 1), 0);
  $("#cartTotal").textContent = money(total);
}

function addToCart(id) {
  id = Number(id);
  const p = PRODUCTS.find(x => Number(x.id) === id);
  const item = cart.find(x => Number(x.id) === id);
  if (item) {
    item.qty += 1;
    if (p) {
      item.name = p.name;
      item.price = p.price;
      item.image = p.image;
      item.category = p.category;
      item.description = p.description || p.desc || "";
    }
  } else {
    cart.push({
      id: id,
      qty: 1,
      name: p ? p.name : ("منتج #" + id),
      price: p ? p.price : 0,
      image: p ? p.image : "",
      category: p ? p.category : "",
      description: p ? (p.description || p.desc || "") : ""
    });
  }
  saveCart();
  toast(p ? ("تمت إضافة " + p.name) : "تمت الإضافة");
}

function openCart() {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  if (overlay) overlay.classList.add("open");
  if (drawer) drawer.classList.add("open");
  document.body.style.overflow = "hidden";
  updateCartUI();
}
function closeCart() {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  if (overlay) overlay.classList.remove("open");
  if (drawer) drawer.classList.remove("open");
  document.body.style.overflow = "";
}

function openProduct(id) {
  // dedicated page with colors & stock
  window.location.href = "/product.html?id=" + encodeURIComponent(id);
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
  if (!currentUser) {
    openAuth("login");
    return;
  }
  // صفحة بروفايل كاملة
  window.location.href = "/profile.html";
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
  if (open) {
    e.preventDefault();
    const pid = Number(open.getAttribute("data-open"));
    if (pid) {
      window.location.href = "/product.html?id=" + pid;
      return;
    }
  }
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

const cartBtnEl = document.getElementById("cartBtn");
if (cartBtnEl) {
  cartBtnEl.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openCart();
  });
}
document.getElementById("closeCart")?.addEventListener("click", closeCart);
document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
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
  const found = PRODUCTS.filter(p => {
      const blob = (p.name + " " + (p.brand||"") + " " + (p.category||"") + " " + (p.subcategory||"") + " " + (p.description||"")).toLowerCase();
      return blob.includes(q);
    });
    if (found.length) {
      activeCategory = "";
      activeSubcategory = "";
      activeBrand = "";
      const grid = document.getElementById("shopGrid");
      if (grid) renderGrid(grid, found.slice(0, 48));
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
      const title = document.getElementById("shopTitle");
      if (title) title.textContent = "نتائج البحث";
      return;
    }
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

$("#registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = ($("#regName")?.value || "").trim();
  const phone = ($("#regPhone")?.value || "").trim();
  const email = ($("#regEmail")?.value || "").trim().toLowerCase();
  const password = $("#regPassword")?.value || "";
  if (!name) return toast("اكتب الاسم");
  if (!phone || phone.length < 10) return toast("اكتب رقم هاتف صحيح");
  if (!email || !email.includes("@")) return toast("اكتب بريد إلكتروني صحيح");
  if (!password || password.length < 4) return toast("كلمة المرور ٤ أحرف على الأقل");
  usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
  if (usersDB.some(u => (u.email || "").toLowerCase() === email)) return toast("هذا البريد مسجّل بالفعل");
  const avatar = regAvatar || null;
  const user = { name: name, phone: phone, email: email, password: password, address: "", avatar: avatar, createdAt: new Date().toISOString() };
  usersDB.push(user);
  localStorage.setItem("nx_users", JSON.stringify(usersDB));
  currentUser = { name: name, phone: phone, email: email, address: "", avatar: avatar };
  localStorage.setItem("nx_user", JSON.stringify(currentUser));
  regAvatar = null;
  updateUserUI();
  closeAuth();
  toast("تم إنشاء الحساب بنجاح");
  const nl = String.fromCharCode(10);
  const msg = "حساب جديد على NEXORA" + nl + nl + "الاسم: " + name + nl + "الهاتف: " + phone + nl + "البريد: " + email + nl + "صورة: " + (avatar ? "نعم" : "لا") + nl + "الوقت: " + new Date().toLocaleString("ar-EG") + nl + "تم إنشاء الحساب";
  try { await notifyAdmin("register", msg); } catch (_) {}
  setTimeout(function(){ openProfile(); }, 150);
});




$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = ($("#loginEmail")?.value || "").trim().toLowerCase();
  const password = $("#loginPassword")?.value || "";
  if (!email) return toast("اكتب البريد الإلكتروني");
  if (!password) return toast("اكتب كلمة المرور");
  usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
  const user = usersDB.find(u => (u.email || "").toLowerCase() === email && String(u.password) === String(password));
  if (!user) {
    const exists = usersDB.some(u => (u.email || "").toLowerCase() === email);
    return toast(exists ? "كلمة المرور غير صحيحة" : "لا يوجد حساب بهذا البريد — أنشئ حسابًا جديدًا");
  }
  currentUser = { name: user.name, phone: user.phone || "", email: user.email, address: user.address || "", avatar: user.avatar || null };
  localStorage.setItem("nx_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuth();
  toast("مرحبًا " + (user.name || ""));
  const nl = String.fromCharCode(10);
  const msg = "تسجيل دخول NEXORA" + nl + nl + "الاسم: " + (user.name || "-") + nl + "الهاتف: " + (user.phone || "-") + nl + "البريد: " + (user.email || "-") + nl + "الوقت: " + new Date().toLocaleString("ar-EG");
  try { await notifyAdmin("login", msg); } catch (_) {}
});




$("#profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return toast("سجّل الدخول أولاً");
  const name = ($("#profName")?.value || "").trim();
  const phone = ($("#profPhone")?.value || "").trim();
  const email = ($("#profEmail")?.value || "").trim().toLowerCase();
  const address = ($("#profAddress")?.value || "").trim();
  if (!name) return toast("اكتب الاسم");
  if (!phone) return toast("اكتب رقم الهاتف");
  if (!email) return toast("اكتب البريد");
  const oldEmail = currentUser.email;
  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.email = email;
  currentUser.address = address;
  if (pendingAvatar) { currentUser.avatar = pendingAvatar; pendingAvatar = null; }
  localStorage.setItem("nx_user", JSON.stringify(currentUser));
  usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
  let i = usersDB.findIndex(u => (u.email || "").toLowerCase() === (oldEmail || "").toLowerCase());
  if (i < 0) i = usersDB.findIndex(u => (u.email || "").toLowerCase() === email);
  if (i >= 0) {
    usersDB[i] = Object.assign({}, usersDB[i], { name: name, phone: phone, email: email, address: address, avatar: currentUser.avatar || usersDB[i].avatar || null });
  } else {
    usersDB.push({ name: name, phone: phone, email: email, password: "", address: address, avatar: currentUser.avatar || null });
  }
  localStorage.setItem("nx_users", JSON.stringify(usersDB));
  updateUserUI();
  closeProfile();
  toast("تم حفظ الملف الشخصي");
  const nl = String.fromCharCode(10);
  const msg = "تحديث بروفايل NEXORA" + nl + nl + "الاسم: " + name + nl + "الهاتف: " + phone + nl + "البريد: " + email + nl + "العنوان: " + (address || "-");
  try { await notifyAdmin("profile", msg); } catch (_) {}
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
  try {
    if (!cart.length) return toast("السلة فارغة");
    const name = ($("#orderName")?.value || "").trim();
    const phone = normalizePhone($("#orderPhone")?.value || "");
    const address = ($("#orderAddress")?.value || "").trim();
    const note = ($("#orderNote")?.value || "").trim();
    const payMethod = (document.querySelector('input[name="payMethod"]:checked')?.value || "cod");
    if (!phone || phone.replace(/[^0-9]/g, "").length < 10) return toast("اكتب رقم هاتف صحيح");
    if (!address) return toast("اكتب عنوان التوصيل");
    const btn = $("#checkoutBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري إرسال الطلب..."; }
    const orderId = "NX-" + Date.now().toString().slice(-8);
    const richItems = cart.map(i => {
      const p = PRODUCTS.find(x => Number(x.id) === Number(i.id));
      return {
        id: Number(i.id),
        name: i.name || (p && p.name) || ("منتج #" + i.id),
        price: Number(i.price != null ? i.price : (p ? p.price : 0)),
        qty: Number(i.qty) || 1,
        image: i.image || (p && p.image) || "",
        category: i.category || (p && p.category) || "",
        description: i.description || (p && (p.description || p.desc)) || "",
        specs: (p && p.specs) || {}
      };
    });
    const total = richItems.reduce((s, it) => s + it.price * it.qty, 0);
    const lines = richItems.map(it => "• " + it.name + " × " + it.qty + " = " + Number(it.price * it.qty).toLocaleString("ar-EG") + " ج.م");
    const orderRecord = {
      id: orderId,
      at: new Date().toISOString(),
      customer: { name: name || "عميل", phone, email: (currentUser && currentUser.email) || "", address, note },
      items: richItems,
      total,
      status: "new",
      paymentMethod: payMethod
    };
    try {
      const orders = JSON.parse(localStorage.getItem("nx_orders") || "[]");
      orders.unshift(orderRecord);
      localStorage.setItem("nx_orders", JSON.stringify(orders.slice(0, 50)));
    } catch (e) {}
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "nexora2026", action: "save_order", order: orderRecord })
      });
    } catch (e) {}
    if (payMethod === "card") {
      try {
        const payRes = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "card", order: orderRecord }) });
        const payData = await payRes.json();
        if (payData.ok && payData.url) { toast("جاري التحويل لصفحة الدفع..."); window.location.href = payData.url; return; }
        toast(payData.error || "الدفع بالبطاقة غير متاح — جرّب عند الاستلام");
      } catch (e) { toast("تعذر فتح الدفع بالبطاقة"); }
    }
    let orderMsg = "🆔 " + orderId + "\\n👤 " + (name || "عميل") + "\\n📞 " + phone + "\\n📍 " + address + "\\n";
    if (note) orderMsg += "📝 " + note + "\\n";
    orderMsg += "\\n📦 المنتجات:\\n" + lines.join("\\n") + "\\n\\n💰 الإجمالي: " + Number(total).toLocaleString("ar-EG") + " ج.م";
    try { await notifyAdmin("order", orderMsg, { order: orderRecord }); } catch (e) {}
    cart = []; saveCart(); closeCart();
    if ($("#orderNote")) $("#orderNote").value = "";
    showOrderSuccess(orderId);
    toast("تم تأكيد طلبك — رقم " + orderId);
    if (btn) { btn.disabled = false; btn.textContent = "إتمام الطلب الآن"; }
  } catch (err) {
    console.error(err);
    toast("حصل خطأ أثناء إتمام الطلب");
    const btn = $("#checkoutBtn");
    if (btn) { btn.disabled = false; btn.textContent = "إتمام الطلب الآن"; }
  }
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

async function loadCatalog() {
  const urls = [
    "https://raw.githubusercontent.com/ahmedgabr1560-coder/noirtech-store/main/categories.json?t=" + Date.now(),
    "/categories.json?t=" + Date.now()
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const data = await r.json();
      const allCats = Array.isArray(data.categories) ? data.categories : (Array.isArray(data) ? data : []);
      CATEGORIES = allCats.filter(c => c && c.visible !== false);
      BRANDS = Array.isArray(data.brands) ? data.brands : [];
      if (CATEGORIES.length) break;
    } catch (e) {}
  }
}

function getCat(id) {
  return CATEGORIES.find(c => c.id === id) || null;
}
function getSub(catId, subId) {
  const c = getCat(catId);
  return c ? (c.subs || []).find(s => s.id === subId) : null;
}
function productMatches(p) {
  if (activeCategory && p.category !== activeCategory) return false;
  if (activeSubcategory && p.subcategory !== activeSubcategory) {
    // phone accessories also under mobiles
    if (!(activeSubcategory === "mobiles" && (p.tags || []).includes("phone-accessory"))) return false;
  }
  if (activeBrand && (p.brand || "") !== activeBrand) return false;
  return true;
}
function sortedProducts(list) {
  const arr = list.slice();
  if (activeSort === "price-asc") arr.sort((a,b) => a.price - b.price);
  else if (activeSort === "price-desc") arr.sort((a,b) => b.price - a.price);
  else if (activeSort === "rating") arr.sort((a,b) => (b.rating||0) - (a.rating||0));
  else arr.sort((a,b) => Number(b.id) - Number(a.id));
  return arr;
}
function setShopFilter(cat, sub) {
  activeCategory = cat || "";
  activeSubcategory = sub || "";
  const c = getCat(activeCategory);
  const s = getSub(activeCategory, activeSubcategory);
  const title = document.getElementById("shopTitle");
  const subEl = document.getElementById("shopSubtitle");
  if (title) title.textContent = s ? s.name_ar : (c ? c.name_ar : "تسوق");
  if (subEl) subEl.textContent = s ? ((c ? c.name_ar + " / " : "") + s.name_ar) : (c ? c.name_ar : "كل المنتجات");
  renderSubcatsBar();
  renderShop();
  const shop = document.getElementById("shop");
  if (shop) shop.scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderMegaMenu() {
  const menu = document.getElementById("megaMenu");
  if (!menu) return;
  const cats = (CATEGORIES || []).filter(c => c && c.visible !== false);
  if (!cats.length) {
    menu.innerHTML = `<div class="mega-empty">لا توجد أقسام ظاهرة</div>`;
    return;
  }
  // لو قسم واحد (موضة): قائمة فروع أنيقة
  if (cats.length === 1) {
    const c = cats[0];
    const subs = (c.subs || []).filter(s => s && s.visible !== false);
    menu.innerHTML = `<div class="mega-simple">
      <button type="button" class="mega-link mega-link-all" data-cat="${c.id}" data-sub="">كل ${c.name_ar}</button>
      ${subs.map(s => `<button type="button" class="mega-link" data-cat="${c.id}" data-sub="${s.id}">${s.name_ar}</button>`).join("")}
    </div>`;
    return;
  }
  menu.innerHTML = `<div class="mega-grid">${cats.map(c => {
    const subs = (c.subs || []).filter(s => s && s.visible !== false).slice(0, 8);
    return `<div class="mega-col">
      <button type="button" class="mega-main" data-cat="${c.id}">${c.icon || ""} ${c.name_ar}</button>
      <div class="mega-subs">${subs.map(s =>
        `<button type="button" class="mega-sub" data-cat="${c.id}" data-sub="${s.id}">${s.name_ar}</button>`
      ).join("")}</div>
    </div>`;
  }).join("")}</div>`;
}
function renderCatNav() {
  const el = document.getElementById("catNavInner");
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c =>
    `<button type="button" class="cat-pill" data-cat="${c.id}">${c.icon || ""} ${c.name_ar}</button>`
  ).join("") + `<button type="button" class="cat-pill" data-cat="">الكل</button>`;
}
function renderCatsDirectory() {
  const el = document.getElementById("catsDirectory");
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => {
    const subs = (c.subs || []).filter(s => s && s.visible !== false).slice(0, 8).map(s =>
      `<button type="button" class="dir-sub" data-cat="${c.id}" data-sub="${s.id}">${s.name_ar}</button>`
    ).join("");
    return `<article class="dir-card">
      <button type="button" class="dir-main" data-cat="${c.id}">
        <img src="${c.image || ""}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <div><span class="dir-ico">${c.icon || ""}</span><h3>${c.name_ar}</h3><small>${c.name_en || ""}</small></div>
      </button>
      <div class="dir-subs">${subs}</div>
    </article>`;
  }).join("");
}
function renderSubcatsBar() {
  const bar = document.getElementById("subcatsBar");
  if (!bar) return;
  if (!activeCategory) {
    bar.innerHTML = "";
    return;
  }
  const c = getCat(activeCategory);
  if (!c) { bar.innerHTML = ""; return; }
  const allBtn = `<button type="button" class="sub-chip ${!activeSubcategory ? "active" : ""}" data-cat="${c.id}" data-sub="">الكل</button>`;
  const chips = (c.subs || []).filter(s => s && s.visible !== false).map(s =>
    `<button type="button" class="sub-chip ${activeSubcategory === s.id ? "active" : ""}" data-cat="${c.id}" data-sub="${s.id}">${s.name_ar}</button>`
  ).join("");
  bar.innerHTML = allBtn + chips;
}
function renderShop() {
  let list = PRODUCTS.filter(productMatches);
  list = sortedProducts(list);
  const grid = document.getElementById("shopGrid");
  const empty = document.getElementById("shopEmpty");
  if (grid) {
    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      renderGrid(grid, list);
    }
  }
  // brands dropdown from visible catalog
  const brandSel = document.getElementById("filterBrand");
  if (brandSel) {
    const cur = activeBrand;
    const brands = [...new Set(PRODUCTS.map(p => p.brand).filter(Boolean))].sort();
    brandSel.innerHTML = `<option value="">كل الماركات</option>` + brands.map(b =>
      `<option value="${b}" ${b === cur ? "selected" : ""}>${b}</option>`
    ).join("");
  }
}

function bindCategoryUI() {
  document.getElementById("catsMenuBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = document.getElementById("megaMenu");
    const btn = document.getElementById("catsMenuBtn");
    if (!menu) return;
    const open = menu.hidden;
    menu.hidden = !open;
    btn?.classList.toggle("open", open);
    btn?.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    const menu = document.getElementById("megaMenu");
    if (menu && !e.target.closest(".nav-drop")) {
      menu.hidden = true;
      document.getElementById("catsMenuBtn")?.classList.remove("open");
      document.getElementById("catsMenuBtn")?.setAttribute("aria-expanded", "false");
    }
    const catBtn = e.target.closest("[data-cat]");
    if (catBtn && !catBtn.closest(".pay-methods")) {
      const cat = catBtn.getAttribute("data-cat") || "";
      const sub = catBtn.getAttribute("data-sub") || "";
      if (catBtn.classList.contains("mega-link") || catBtn.classList.contains("mega-main") || catBtn.classList.contains("mega-sub") || catBtn.classList.contains("dir-sub") || catBtn.classList.contains("dir-main") || catBtn.classList.contains("cat-card") || catBtn.classList.contains("cat-pill") || catBtn.classList.contains("sub-chip")) {
        setShopFilter(cat, sub);
        if (menu) menu.hidden = true;
        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
      }
    }
  });

  document.getElementById("filterBrand")?.addEventListener("change", (e) => {
    activeBrand = e.target.value || "";
    renderShop();
  });
  document.getElementById("filterSort")?.addEventListener("change", (e) => {
    activeSort = e.target.value || "newest";
    renderShop();
  });
}


/* ===== AI Chat (WhatsApp-style) ===== */
let aiBusy = false;
const aiHistory = [];

function openAiChat() {
  const overlay = document.getElementById("aiOverlay");
  const panel = document.getElementById("aiPanel");
  if (overlay) overlay.classList.add("open");
  if (panel) panel.classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("aiInput")?.focus(), 200);
}
function closeAiChat() {
  document.getElementById("aiOverlay")?.classList.remove("open");
  document.getElementById("aiPanel")?.classList.remove("open");
  document.body.style.overflow = "";
}
function appendAiMsg(role, text) {
  const box = document.getElementById("aiMessages");
  if (!box) return;
  const div = document.createElement("div");
  div.className = "ai-msg " + (role === "user" ? "user" : "bot");
  const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const safe = String(text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  div.innerHTML = `<div class="ai-bubble">${safe}<span class="ai-time">${time}</span></div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
function appendAiTyping() {
  const box = document.getElementById("aiMessages");
  if (!box) return null;
  const div = document.createElement("div");
  div.className = "ai-msg bot";
  div.id = "aiTyping";
  div.innerHTML = `<div class="ai-bubble">جاري الكتابة<span class="ai-dots">...</span></div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}
function removeAiTyping() {
  document.getElementById("aiTyping")?.remove();
}
async function handleAiSend() {
  if (aiBusy) return;
  const input = document.getElementById("aiInput");
  const text = (input?.value || "").trim();
  if (!text) return;
  if (input) input.value = "";
  appendAiMsg("user", text);
  aiHistory.push({ role: "user", content: text });
  aiBusy = true;
  appendAiTyping();
  try {
    const catalog = (PRODUCTS || []).slice(0, 40).map(p => ({
      id: p.id, name: p.name, price: p.price, category: p.category, subcategory: p.subcategory
    }));
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: aiHistory.slice(-12), catalog })
    });
    const data = await res.json().catch(() => ({}));
    removeAiTyping();
    const reply = data.reply || "معلش حصل تأخير بسيط 😅 قولي تاني وأنا معاكِ.";
    appendAiMsg("bot", reply);
    aiHistory.push({ role: "assistant", content: reply });
  } catch (e) {
    removeAiTyping();
    appendAiMsg("bot", "الاتصال اتقطع لحظة 😅 جرّبي تاني أو واتساب من الزر الأخضر.");
  } finally {
    aiBusy = false;
  }
}
document.getElementById("aiChatBtn")?.addEventListener("click", openAiChat);
document.getElementById("aiClose")?.addEventListener("click", closeAiChat);
document.getElementById("aiOverlay")?.addEventListener("click", closeAiChat);
document.getElementById("aiSend")?.addEventListener("click", handleAiSend);
document.getElementById("aiInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleAiSend();
  }
});

document.getElementById("aiSuggestions")?.addEventListener("click", function (e) {
  const chip = e.target.closest(".ai-chip");
  if (!chip) return;
  const q = chip.getAttribute("data-q") || chip.textContent || "";
  const input = document.getElementById("aiInput");
  if (input && q) { input.value = q; handleAiSend(); }
});

// Payment return from Stripe
(function () {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("paid") === "1") {
      const oid = q.get("order") || "";
      toast("تم الدفع بنجاح" + (oid ? " — طلب " + oid : ""));
      history.replaceState({}, "", location.pathname);
    } else if (q.get("paid") === "0") {
      toast("تم إلغاء الدفع");
      history.replaceState({}, "", location.pathname);
    }
  } catch (e) {}
})();

// Hide card option if Stripe not configured
fetch("/api/checkout").then(function (r) { return r.json(); }).then(function (d) {
  if (!d || !d.stripeEnabled) {
    const el = document.getElementById("payCardOption");
    if (el) el.style.display = "none";
    document.querySelectorAll('input[name="payMethod"][value="card"]').forEach(function (n) {
      const lab = n.closest("label");
      if (lab) lab.style.display = "none";
    });
  }
}).catch(function () {});


async function loadProducts() {
  const urls = [
    "https://raw.githubusercontent.com/ahmedgabr1560-coder/noirtech-store/main/products.json?t=" + Date.now(),
    "/products.json?t=" + Date.now()
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const data = await r.json();
      PRODUCTS = Array.isArray(data) ? data : (data.products || []);
      PRODUCTS = PRODUCTS.filter(p => p && !p.hidden);
      break;
    } catch (e) {}
  }
}


function ensureHomeOnStart() {
  try {
    // close overlays
    ["authOverlay","authModal","profileOverlay","profileModal","cartOverlay","cartDrawer","aiOverlay","aiPanel","productOverlay","productModal"].forEach(id => {
      document.getElementById(id)?.classList.remove("open");
    });
    document.body.style.overflow = "";
    // if deep link to product keep it; else go home
    const path = location.pathname || "/";
    const isHome = path === "/" || path.endsWith("/index.html") || path.endsWith("index.html") || path === "";
    if (isHome) {
      if (location.hash && location.hash !== "#home" && location.hash !== "#") {
        // allow section anchors
      } else {
        history.replaceState({}, "", "/");
        window.scrollTo(0, 0);
        document.getElementById("home")?.scrollIntoView({ block: "start" });
      }
    }
  } catch (e) {}
}

async function bootStore() {
  try { ensureHomeOnStart(); } catch (e) {}
  try { await loadHeroConfig(); } catch (e) { console.warn(e); }
  try { await loadCatalog(); } catch (e) { console.warn(e); }
  try { await loadProducts(); } catch (e) { console.warn(e); }
  try { renderAll(); } catch (e) { console.warn(e); }
  try { bindCategoryUI(); } catch (e) { console.warn(e); }
  try { updateCartUI(); } catch (e) {}
  try { updateUserUI(); } catch (e) {}
  try {
    if (typeof setShopFilter === "function" && CATEGORIES.some(c => c.id === "fashion")) {
      setShopFilter("fashion", "");
    }
  } catch (e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootStore);
} else {
  bootStore();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    loadHeroConfig();
  }
});
setInterval(() => { loadHeroConfig(); }, 30000);
