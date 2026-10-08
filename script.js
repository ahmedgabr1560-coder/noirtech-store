// ===== Products Data =====
const products = [
  { id: 1, name: "iPhone 16 Pro Max", category: "phones", price: 62999, oldPrice: 67999, image: "https://images.unsplash.com/photo-1695048133142-1a204bbd4bc0?w=600&h=600&fit=crop", badge: "جديد" },
  { id: 2, name: "Samsung Galaxy S25 Ultra", category: "phones", price: 54999, oldPrice: 58999, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop", badge: "جديد" },
  { id: 3, name: "Google Pixel 9 Pro", category: "phones", price: 42999, oldPrice: null, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff32?w=600&h=600&fit=crop", badge: null },
  { id: 4, name: "Xiaomi 15 Ultra", category: "phones", price: 38999, oldPrice: 41999, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 5, name: "OnePlus 13", category: "phones", price: 34999, oldPrice: 37999, image: "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=600&h=600&fit=crop", badge: null },
  { id: 6, name: "iPhone 15", category: "phones", price: 39999, oldPrice: 44999, image: "https://images.unsplash.com/photo-1678685888229-5fe1ec6f34b7?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 7, name: "Samsung Galaxy Z Fold 6", category: "phones", price: 72999, oldPrice: null, image: "https://images.unsplash.com/photo-1617040619263-41af7a7a0f0b?w=600&h=600&fit=crop", badge: "قابل للطي" },
  { id: 8, name: "Nothing Phone (2a)", category: "phones", price: 18999, oldPrice: 21999, image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=600&fit=crop", badge: null },
  { id: 9, name: "MacBook Pro 16\" M3 Max", category: "laptops", price: 89999, oldPrice: 94999, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop", badge: "الأكثر مبيعاً" },
  { id: 10, name: "Dell XPS 15 OLED", category: "laptops", price: 67999, oldPrice: null, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=600&fit=crop", badge: null },
  { id: 11, name: "ASUS ROG Strix G16", category: "laptops", price: 72999, oldPrice: 78999, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop", badge: "للألعاب" },
  { id: 12, name: "Lenovo ThinkPad X1 Carbon", category: "laptops", price: 59999, oldPrice: null, image: "https://images.unsplash.com/photo-1588872657578-7b1fe1f3f5b6?w=600&h=600&fit=crop", badge: null },
  { id: 13, name: "MacBook Air 15\" M3", category: "laptops", price: 54999, oldPrice: 58999, image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=600&fit=crop", badge: "خفيف" },
  { id: 14, name: "HP Spectre x360", category: "laptops", price: 51999, oldPrice: 55999, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop", badge: null },
  { id: 15, name: "MSI Stealth 16", category: "laptops", price: 79999, oldPrice: 84999, image: "https://images.unsplash.com/photo-1525547717933-aa4bba7bf5e5?w=600&h=600&fit=crop", badge: "للألعاب" },
  { id: 16, name: "Microsoft Surface Laptop 6", category: "laptops", price: 48999, oldPrice: null, image: "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=600&h=600&fit=crop", badge: null },
  { id: 17, name: "AirPods Pro 2", category: "audio", price: 9999, oldPrice: null, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop", badge: null },
  { id: 18, name: "Sony WH-1000XM5", category: "audio", price: 12999, oldPrice: 14999, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 19, name: "Bose QuietComfort Ultra", category: "audio", price: 14999, oldPrice: null, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&h=600&fit=crop", badge: null },
  { id: 20, name: "JBL Charge 5", category: "audio", price: 4999, oldPrice: 5999, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 21, name: "AirPods Max", category: "audio", price: 22999, oldPrice: 24999, image: "https://images.unsplash.com/photo-1625883214690-c10a0b5f4f0b?w=600&h=600&fit=crop", badge: null },
  { id: 22, name: "Sony WF-1000XM5", category: "audio", price: 8999, oldPrice: 9999, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 23, name: "Marshall Emberton II", category: "audio", price: 6499, oldPrice: null, image: "https://images.unsplash.com/photo-1545454675-9c7b5f6b5e3e?w=600&h=600&fit=crop", badge: null },
  { id: 24, name: "Sennheiser Momentum 4", category: "audio", price: 11999, oldPrice: 13999, image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop", badge: null },
  { id: 25, name: "Apple Watch Ultra 2", category: "wearables", price: 32999, oldPrice: 35999, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&h=600&fit=crop", badge: "جديد" },
  { id: 26, name: "Samsung Galaxy Watch 7", category: "wearables", price: 11999, oldPrice: 13999, image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 27, name: "Garmin Fenix 8", category: "wearables", price: 27999, oldPrice: null, image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop", badge: null },
  { id: 28, name: "Huawei Watch GT 5", category: "wearables", price: 8999, oldPrice: 9999, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop", badge: null },
  { id: 29, name: "Apple Watch Series 10", category: "wearables", price: 18999, oldPrice: 20999, image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&h=600&fit=crop", badge: "جديد" },
  { id: 30, name: "Fitbit Sense 2", category: "wearables", price: 7499, oldPrice: 8499, image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 31, name: "Garmin Venu 3", category: "wearables", price: 15999, oldPrice: null, image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop", badge: null },
  { id: 32, name: "Samsung Galaxy Ring", category: "wearables", price: 12999, oldPrice: null, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop", badge: "جديد" }
];

let cart = JSON.parse(localStorage.getItem("noirtech_cart")) || [];
let currentUser = JSON.parse(localStorage.getItem("noirtech_user")) || null;
const usersDB = JSON.parse(localStorage.getItem("noirtech_users")) || [];

const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const toast = document.getElementById("toast");
const authOverlay = document.getElementById("authOverlay");
const authModal = document.getElementById("authModal");
const authClose = document.getElementById("authClose");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const userBtn = document.getElementById("userBtn");
const userNameDisplay = document.getElementById("userNameDisplay");

function formatPrice(price) { return price.toLocaleString("ar-EG") + " ج.م"; }

function createProductCard(product) {
  return `<div class="product-card"><div class="product-img"><img src="${product.image}" alt="${product.name}" loading="lazy" />${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}</div><div class="product-info"><h3 class="product-name">${product.name}</h3><div class="product-price"><div><span class="price">${formatPrice(product.price)}</span>${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ""}</div><button class="add-btn" onclick="addToCart(${product.id})" title="أضف للسلة">+</button></div></div></div>`;
}

function renderAllProducts() {
  ["phones", "laptops", "audio", "wearables"].forEach(cat => {
    const grid = document.getElementById(cat + "Grid");
    if (!grid) return;
    grid.innerHTML = products.filter(p => p.category === cat).map(createProductCard).join("");
  });
}

function saveCart() { localStorage.setItem("noirtech_cart", JSON.stringify(cart)); updateCartUI(); }

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  showToast(`تم إضافة ${product.name} للسلة`);
}

function removeFromCart(id) { cart = cart.filter(item => item.id !== id); saveCart(); }

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else saveCart();
}

function updateCartUI() {
  cartCount.textContent = cart.reduce((s, i) => s + i.qty, 0);
  cartTotal.textContent = formatPrice(cart.reduce((s, i) => s + i.price * i.qty, 0));
  if (cart.length === 0) { cartItems.innerHTML = `<div class="cart-empty">السلة فارغة 🛒</div>`; return; }
  cartItems.innerHTML = cart.map(item => `<div class="cart-item"><img src="${item.image}" alt="${item.name}" /><div class="cart-item-info"><h4>${item.name}</h4><p class="item-price">${formatPrice(item.price)}</p><div class="cart-item-qty"><button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button><span>${item.qty}</span><button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button></div><button class="remove-item" onclick="removeFromCart(${item.id})">حذف</button></div></div>`).join("");
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

cartBtn.addEventListener("click", () => { cartSidebar.classList.add("open"); cartOverlay.classList.add("open"); });
closeCart.addEventListener("click", closeCartSidebar);
cartOverlay.addEventListener("click", closeCartSidebar);
function closeCartSidebar() { cartSidebar.classList.remove("open"); cartOverlay.classList.remove("open"); }

function updateUserUI() {
  if (currentUser) { userNameDisplay.textContent = currentUser.name.split(" ")[0]; userBtn.title = currentUser.name; }
  else { userNameDisplay.textContent = ""; userBtn.title = "تسجيل الدخول"; }
}

function openAuthModal(tab = "login") {
  authOverlay.classList.add("open"); authModal.classList.add("open"); switchAuthTab(tab);
}
function closeAuthModal() { authOverlay.classList.remove("open"); authModal.classList.remove("open"); }

function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add("active");
  loginForm.style.display = tab === "login" ? "block" : "none";
  registerForm.style.display = tab === "register" ? "block" : "none";
}

document.querySelectorAll(".auth-tab").forEach(tab => tab.addEventListener("click", () => switchAuthTab(tab.dataset.tab)));
document.getElementById("switchToRegister")?.addEventListener("click", e => { e.preventDefault(); switchAuthTab("register"); });
document.getElementById("switchToLogin")?.addEventListener("click", e => { e.preventDefault(); switchAuthTab("login"); });
authClose?.addEventListener("click", closeAuthModal);
authOverlay?.addEventListener("click", closeAuthModal);

userBtn?.addEventListener("click", () => {
  if (currentUser) {
    if (confirm(`مرحباً ${currentUser.name}\nهل تريد تسجيل الخروج؟`)) {
      currentUser = null; localStorage.removeItem("noirtech_user"); updateUserUI(); showToast("تم تسجيل الخروج");
    }
  } else openAuthModal("login");
});

registerForm?.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  if (usersDB.find(u => u.email === email)) { showToast("هذا البريد مسجل بالفعل!"); return; }
  usersDB.push({ name, phone, email, password });
  localStorage.setItem("noirtech_users", JSON.stringify(usersDB));
  currentUser = { name, phone, email };
  localStorage.setItem("noirtech_user", JSON.stringify(currentUser));
  updateUserUI(); closeAuthModal(); showToast(`مرحباً ${name}! تم إنشاء حسابك بنجاح`);
  if (window._pendingCheckout) { window._pendingCheckout = false; processCheckout(); }
});

loginForm?.addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const user = usersDB.find(u => u.email === email && u.password === password);
  if (!user) { showToast("بيانات الدخول غير صحيحة!"); return; }
  currentUser = { name: user.name, phone: user.phone, email: user.email };
  localStorage.setItem("noirtech_user", JSON.stringify(currentUser));
  updateUserUI(); closeAuthModal(); showToast(`مرحباً بعودتك ${user.name}!`);
  if (window._pendingCheckout) { window._pendingCheckout = false; processCheckout(); }
});

function processCheckout() {
  if (cart.length === 0) { showToast("السلة فارغة!"); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const orderItems = cart.map(i => `• ${i.name} × ${i.qty} = ${(i.price * i.qty).toLocaleString("ar-EG")} ج.م`).join("\n");
  const orderMsg = `طلب جديد من ${currentUser.name}\nالهاتف: ${currentUser.phone}\nالإيميل: ${currentUser.email}\n\nالمنتجات:\n${orderItems}\n\nالإجمالي: ${total.toLocaleString("ar-EG")} ج.م`;
  showToast("تم استلام طلبك بنجاح! سنتواصل معك قريباً ✨");
  window.open(`https://wa.me/201064519541?text=${encodeURIComponent(orderMsg)}`, "_blank");
  cart = []; saveCart(); closeCartSidebar();
}

checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) { showToast("السلة فارغة!"); return; }
  if (!currentUser) {
    window._pendingCheckout = true;
    closeCartSidebar();
    openAuthModal("login");
    showToast("يجب تسجيل الدخول أولاً لإتمام الطلب");
    return;
  }
  processCheckout();
});

const sections = document.querySelectorAll("section[id]");
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY + 120;
  sections.forEach(section => {
    const top = section.offsetTop, height = section.offsetHeight, id = section.getAttribute("id");
    if (scrollY >= top && scrollY < top + height) {
      document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("active"));
      const link = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (link) link.classList.add("active");
    }
  });
});

renderAllProducts();
updateCartUI();
updateUserUI();
