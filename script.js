/* TECHZONE — frontend demo store (localStorage only) */
const DEMO = true;

const CATEGORIES = [
  { id: "phones", name: "الموبايلات", icon: "📱", href: "#phones" },
  { id: "laptops", name: "اللابتوبات", icon: "💻", href: "#laptops" },
  { id: "monitors", name: "الشاشات", icon: "🖥️", href: "#monitors" },
  { id: "home", name: "منزلية", icon: "🏠", href: "#home-app" },
  { id: "accessories", name: "إكسسوارات", icon: "🎧", href: "#accessories" }
];

/** Demo catalog — not real commercial claims */
const PRODUCTS = [
  { id: 1, name: "هاتف ذكي Demo X1", category: "phones", price: 12499, oldPrice: 14999, rating: 4.5, reviews: 128, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop", badge: "عرض", best: true, newest: true, desc: "هاتف تجريبي للعرض في الواجهة مع شاشة وسعة تخزين وهمية." },
  { id: 2, name: "هاتف Demo Nova 12", category: "phones", price: 8999, oldPrice: null, rating: 4.2, reviews: 86, image: "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=600&h=600&fit=crop", badge: null, best: true, newest: false, desc: "بيانات تجريبية — مواصفات غير حقيقية." },
  { id: 3, name: "هاتف Demo Pixel Lite", category: "phones", price: 10999, oldPrice: 11999, rating: 4.6, reviews: 54, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff32?w=600&h=600&fit=crop", badge: "جديد", best: false, newest: true, desc: "منتج تجريبي لتجربة صفحة التفاصيل والسلة." },
  { id: 4, name: "لابتوب Demo Book 15", category: "laptops", price: 18999, oldPrice: 20999, rating: 4.4, reviews: 73, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop", badge: "عرض", best: true, newest: false, desc: "لابتوب تجريبي للواجهة فقط." },
  { id: 5, name: "لابتوب Demo Pro 14", category: "laptops", price: 24999, oldPrice: null, rating: 4.7, reviews: 41, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop", badge: "جديد", best: true, newest: true, desc: "مواصفات وأسعار تجريبية." },
  { id: 6, name: "لابتوب Demo Gaming 16", category: "laptops", price: 27999, oldPrice: 29999, rating: 4.3, reviews: 39, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop", badge: null, best: false, newest: true, desc: "للعرض في قسم الألعاب التجريبي." },
  { id: 7, name: "شاشة Demo 27\" FHD", category: "monitors", price: 4599, oldPrice: 5299, rating: 4.1, reviews: 22, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop", badge: "عرض", best: true, newest: false, desc: "شاشة تجريبية." },
  { id: 8, name: "شاشة Demo 32\" QHD", category: "monitors", price: 7999, oldPrice: null, rating: 4.5, reviews: 18, image: "https://images.unsplash.com/photo-1585790050230-4dd237bdfed0?w=600&h=600&fit=crop", badge: "جديد", best: false, newest: true, desc: "بيانات تجريبية." },
  { id: 9, name: "مكنسة روبوت Demo Clean", category: "home", price: 6999, oldPrice: 8499, rating: 4.0, reviews: 31, image: "https://images.unsplash.com/photo-1558317374-d189689ff5f2?w=600&h=600&fit=crop", badge: "عرض", best: true, newest: false, desc: "جهاز منزلي تجريبي." },
  { id: 10, name: "خلاط Demo Mix Pro", category: "home", price: 1299, oldPrice: null, rating: 3.9, reviews: 14, image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=600&fit=crop", badge: null, best: false, newest: true, desc: "منتج تجريبي." },
  { id: 11, name: "سماعة Demo Buds Air", category: "accessories", price: 899, oldPrice: 1199, rating: 4.3, reviews: 210, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop", badge: "عرض", best: true, newest: true, desc: "إكسسوار تجريبي." },
  { id: 12, name: "ساعة Demo Fit 3", category: "accessories", price: 1499, oldPrice: 1799, rating: 4.2, reviews: 67, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop", badge: "جديد", best: true, newest: true, desc: "بيانات تقييم تجريبية." },
  { id: 13, name: "شاحن سريع Demo 65W", category: "accessories", price: 349, oldPrice: 449, rating: 4.0, reviews: 95, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop", badge: "عرض", best: false, newest: false, desc: "إكسسوار تجريبي." },
  { id: 14, name: "كيبورد Demo Mech", category: "accessories", price: 999, oldPrice: null, rating: 4.4, reviews: 28, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop", badge: null, best: false, newest: true, desc: "للعرض فقط." },
  { id: 15, name: "هاتف Demo Ultra S", category: "phones", price: 16499, oldPrice: 17999, rating: 4.8, reviews: 33, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop", badge: "الأكثر مبيعًا", best: true, newest: false, desc: "هاتف تجريبي فاخر للواجهة." },
  { id: 16, name: "شاشة Demo Curved 34", category: "monitors", price: 11999, oldPrice: 12999, rating: 4.6, reviews: 12, image: "https://images.unsplash.com/photo-1616763355548-1b606f383a9a?w=600&h=600&fit=crop", badge: "عرض", best: true, newest: true, desc: "شاشة عريضة تجريبية." }
];

let cart = JSON.parse(localStorage.getItem("tz_cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("tz_user") || "null");
let usersDB = JSON.parse(localStorage.getItem("tz_users") || "[]");
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
function saveCart() {
  localStorage.setItem("tz_cart", JSON.stringify(cart));
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
  if (!cart.length) {
    box.innerHTML = `<div class="empty-cart">السلة فارغة<br><small>أضف منتجات تجريبية للتجربة</small></div>`;
    $("#cartTotal").textContent = money(0);
    return;
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
function switchAuth(tab) {
  $$(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  $("#loginForm").hidden = tab !== "login";
  $("#registerForm").hidden = tab !== "register";
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
  const img = $("#profileAvatar");
  const fb = $("#profileFallback");
  if (currentUser.avatar) {
    img.src = currentUser.avatar; img.hidden = false; fb.style.display = "none";
  } else {
    img.hidden = true; fb.style.display = "grid";
    fb.textContent = (currentUser.name || "?").trim().charAt(0).toUpperCase();
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

$$(".auth-tab").forEach(t => t.addEventListener("click", () => switchAuth(t.dataset.tab)));

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
    const img = $("#regAvatarPreview");
    img.src = regAvatar; img.hidden = false;
    $("#regAvatarPlaceholder").style.display = "none";
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
    const img = $("#profileAvatar");
    img.src = pendingAvatar; img.hidden = false;
    $("#profileFallback").style.display = "none";
  };
  r.readAsDataURL(f);
});

$("#registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#regName").value.trim();
  const phone = $("#regPhone").value.trim();
  const email = $("#regEmail").value.trim().toLowerCase();
  const password = $("#regPassword").value;
  usersDB = JSON.parse(localStorage.getItem("tz_users") || "[]");
  if (usersDB.some(u => u.email === email)) return toast("هذا البريد مسجّل بالفعل");
  const user = { name, phone, email, password, address: "", avatar: regAvatar };
  usersDB.push(user);
  localStorage.setItem("tz_users", JSON.stringify(usersDB));
  currentUser = { name, phone, email, address: "", avatar: regAvatar };
  localStorage.setItem("tz_user", JSON.stringify(currentUser));
  regAvatar = null;
  updateUserUI();
  closeAuth();
  toast("تم إنشاء الحساب بنجاح");
  openProfile();
});

$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  usersDB = JSON.parse(localStorage.getItem("tz_users") || "[]");
  const user = usersDB.find(u => u.email === email && String(u.password) === String(password));
  if (!user) {
    const exists = usersDB.some(u => u.email === email);
    return toast(exists ? "كلمة المرور غير صحيحة" : "لا يوجد حساب بهذا البريد");
  }
  currentUser = { name: user.name, phone: user.phone, email: user.email, address: user.address || "", avatar: user.avatar || null };
  localStorage.setItem("tz_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuth();
  toast(`مرحبًا ${user.name}`);
});

$("#profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return;
  currentUser.name = $("#profName").value.trim();
  currentUser.phone = $("#profPhone").value.trim();
  currentUser.email = $("#profEmail").value.trim().toLowerCase();
  currentUser.address = $("#profAddress").value.trim();
  if (pendingAvatar) { currentUser.avatar = pendingAvatar; pendingAvatar = null; }
  localStorage.setItem("tz_user", JSON.stringify(currentUser));
  usersDB = JSON.parse(localStorage.getItem("tz_users") || "[]");
  const i = usersDB.findIndex(u => u.email === currentUser.email);
  if (i >= 0) {
    usersDB[i] = { ...usersDB[i], ...currentUser };
    localStorage.setItem("tz_users", JSON.stringify(usersDB));
  }
  updateUserUI();
  closeProfile();
  toast("تم حفظ الملف الشخصي");
});

$("#logoutBtn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("tz_user");
  updateUserUI();
  closeProfile();
  toast("تم تسجيل الخروج");
});

$("#checkoutBtn").addEventListener("click", () => {
  if (!cart.length) return toast("السلة فارغة");
  if (!currentUser) {
    closeCart();
    openAuth("login");
    return toast("سجّل الدخول لإتمام الطلب");
  }
  toast("طلب تجريبي تم تسجيله محليًا — لا يوجد دفع حقيقي");
  cart = [];
  saveCart();
  closeCart();
});

$("#contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("تم إرسال رسالتك (تجريبي)");
  e.target.reset();
});

// Init
renderAll();
updateCartUI();
updateUserUI();
