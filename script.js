let products = [];
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
const profileOverlay = document.getElementById("profileOverlay");
const profileModal = document.getElementById("profileModal");
const profileClose = document.getElementById("profileClose");
const profileForm = document.getElementById("profileForm");
const avatarInput = document.getElementById("avatarInput");
const aiChatBtn = document.getElementById("aiChatBtn");
const aiPanel = document.getElementById("aiPanel");
const aiOverlay = document.getElementById("aiOverlay");
const aiClose = document.getElementById("aiClose");
const aiMessages = document.getElementById("aiMessages");
const aiInput = document.getElementById("aiInput");
const aiSend = document.getElementById("aiSend");
function formatPrice(p) { return p.toLocaleString("ar-EG") + " ج.م"; }
function getInitials(n) { return n ? n.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase() : "؟"; }
function createProductCard(p) {
  return `<div class="product-card"><div class="product-img"><img src="${p.image}" alt="${p.name}" loading="lazy"/>${p.badge?`<span class="product-badge">${p.badge}</span>`:""}</div><div class="product-info"><h3 class="product-name">${p.name}</h3><div class="product-price"><div><span class="price">${formatPrice(p.price)}</span>${p.oldPrice?`<span class="old-price">${formatPrice(p.oldPrice)}</span>`:""}</div><button class="add-btn" onclick="addToCart(${p.id})">+</button></div></div></div>`;
}
function renderAllProducts() {
  ["phones","laptops","audio","wearables"].forEach(cat => {
    const g = document.getElementById(cat+"Grid");
    if (g) g.innerHTML = products.filter(p=>p.category===cat).map(createProductCard).join("");
  });
}
function saveCart() { localStorage.setItem("noirtech_cart", JSON.stringify(cart)); updateCartUI(); }
function addToCart(id) {
  const p = products.find(x=>x.id===id); if (!p) return;
  const e = cart.find(i=>i.id===id); if (e) e.qty++; else cart.push({...p, qty:1});
  saveCart(); showToast(`تم إضافة ${p.name} للسلة`);
}
function removeFromCart(id) { cart = cart.filter(i=>i.id!==id); saveCart(); }
function updateQty(id, d) { const i = cart.find(x=>x.id===id); if (!i) return; i.qty += d; if (i.qty<=0) removeFromCart(id); else saveCart(); }
function updateCartUI() {
  cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0);
  cartTotal.textContent = formatPrice(cart.reduce((s,i)=>s+i.price*i.qty,0));
  if (!cart.length) { cartItems.innerHTML = `<div class="cart-empty">السلة فارغة 🛒</div>`; return; }
  cartItems.innerHTML = cart.map(i=>`<div class="cart-item"><img src="${i.image}" alt="${i.name}"/><div class="cart-item-info"><h4>${i.name}</h4><p class="item-price">${formatPrice(i.price)}</p><div class="cart-item-qty"><button class="qty-btn" onclick="updateQty(${i.id},-1)">−</button><span>${i.qty}</span><button class="qty-btn" onclick="updateQty(${i.id},1)">+</button></div><button class="remove-item" onclick="removeFromCart(${i.id})">حذف</button></div></div>`).join("");
}
function showToast(m) { toast.textContent=m; toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),2500); }
cartBtn.addEventListener("click",()=>{ cartSidebar.classList.add("open"); cartOverlay.classList.add("open"); });
closeCart.addEventListener("click",closeCartSidebar);
cartOverlay.addEventListener("click",closeCartSidebar);
function closeCartSidebar(){ cartSidebar.classList.remove("open"); cartOverlay.classList.remove("open"); }
function updateUserUI() {
  if (currentUser && currentUser.email) {
    const displayName = (currentUser.name || currentUser.email || "مستخدم").toString();
    if (userNameDisplay) userNameDisplay.textContent = displayName.split(" ")[0];
    if (userBtn) userBtn.title = displayName;
    let navAv = userBtn.querySelector(".nav-avatar");
    const svg = userBtn.querySelector("svg");
    if (currentUser.avatar) {
      if (!navAv) { navAv = document.createElement("img"); navAv.className="nav-avatar"; userBtn.insertBefore(navAv, userBtn.firstChild); }
      navAv.src = currentUser.avatar; navAv.style.display="block";
      if (svg) svg.style.display="none"; userBtn.classList.add("has-avatar");
    } else {
      if (navAv) navAv.style.display="none"; if (svg) svg.style.display="block"; userBtn.classList.remove("has-avatar");
    }
  } else {
    userNameDisplay.textContent=""; userBtn.title="تسجيل الدخول";
    const navAv = userBtn.querySelector(".nav-avatar"); if (navAv) navAv.style.display="none";
    const svg = userBtn.querySelector("svg"); if (svg) svg.style.display="block";
    userBtn.classList.remove("has-avatar");
  }
}
function openAuthModal(tab="login") { authOverlay.classList.add("open"); authModal.classList.add("open"); switchAuthTab(tab); }
function closeAuthModal() { authOverlay.classList.remove("open"); authModal.classList.remove("open"); }
function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach(t=>t.classList.remove("active"));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add("active");
  loginForm.style.display = tab==="login"?"block":"none";
  registerForm.style.display = tab==="register"?"block":"none";
}
document.querySelectorAll(".auth-tab").forEach(t=>t.addEventListener("click",()=>switchAuthTab(t.dataset.tab)));
document.getElementById("switchToRegister")?.addEventListener("click",e=>{e.preventDefault();switchAuthTab("register");});
document.getElementById("switchToLogin")?.addEventListener("click",e=>{e.preventDefault();switchAuthTab("login");});
authClose?.addEventListener("click",closeAuthModal);
authOverlay?.addEventListener("click",closeAuthModal);
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById("profName").value = currentUser.name||"";
  document.getElementById("profPhone").value = currentUser.phone||"";
  document.getElementById("profEmail").value = currentUser.email||"";
  document.getElementById("profAddress").value = currentUser.address||"";
  document.getElementById("profBio").value = currentUser.bio||"";
  document.getElementById("profileDisplayName").textContent = currentUser.name||"الملف الشخصي";
  document.getElementById("profileDisplayEmail").textContent = currentUser.email||"";
  const so=document.getElementById("profStatOrders"); if(so) so.textContent=String(currentUser.orders||0);
  const sj=document.getElementById("profStatJoined"); if(sj) sj.textContent=currentUser.joined||"—";
  const img = document.getElementById("profileAvatarImg");
  const ph = document.getElementById("profileAvatarPlaceholder");
  if (currentUser.avatar) { img.src=currentUser.avatar; img.style.display="block"; ph.style.display="none"; }
  else { img.style.display="none"; ph.style.display="flex"; ph.textContent=getInitials(currentUser.name); }
  profileOverlay.classList.add("open"); profileModal.classList.add("open");
}
function closeProfileModal() { profileOverlay.classList.remove("open"); profileModal.classList.remove("open"); }
profileClose?.addEventListener("click",closeProfileModal);
profileOverlay?.addEventListener("click",closeProfileModal);
userBtn?.addEventListener("click",()=>{ if (currentUser) openProfileModal(); else openAuthModal("login"); });
function startSocialLogin(provider) { window.location.href = `/api/auth/${provider}`; }
document.getElementById("googleLoginBtn")?.addEventListener("click",()=>startSocialLogin("google"));
document.getElementById("facebookLoginBtn")?.addEventListener("click",()=>startSocialLogin("facebook"));
document.getElementById("googleRegisterBtn")?.addEventListener("click",()=>startSocialLogin("google"));
document.getElementById("facebookRegisterBtn")?.addEventListener("click",()=>startSocialLogin("facebook"));
async function hydrateSocialSession() {
  try {
    const r = await fetch("/api/auth/session", { credentials: "include" });
    const data = await r.json();
    if (data.authenticated && data.user) { currentUser = data.user; localStorage.setItem("noirtech_user", JSON.stringify(currentUser)); updateUserUI(); }
    if (new URLSearchParams(location.search).get("social_login") === "success") { history.replaceState({}, "", location.pathname); showToast("تم تسجيل الدخول بنجاح ✅"); }
  } catch (_) {}
}
hydrateSocialSession();
avatarInput?.addEventListener("change",e=>{
  const f=e.target.files[0]; if (!f) return;
  if (f.size>2*1024*1024) { showToast("الصورة كبيرة جداً"); return; }
  const r=new FileReader();
  r.onload=()=>{ const img=document.getElementById("profileAvatarImg"); const ph=document.getElementById("profileAvatarPlaceholder"); img.src=r.result; img.style.display="block"; ph.style.display="none"; window._pendingAvatar=r.result; };
  r.readAsDataURL(f);
});
profileForm?.addEventListener("submit",e=>{
  e.preventDefault(); if (!currentUser) return;
  currentUser.name=document.getElementById("profName").value.trim();
  currentUser.phone=document.getElementById("profPhone").value.trim();
  currentUser.email=document.getElementById("profEmail").value.trim().toLowerCase();
  currentUser.address=document.getElementById("profAddress").value.trim();
  currentUser.bio=document.getElementById("profBio").value.trim();
  if (window._pendingAvatar) { currentUser.avatar=window._pendingAvatar; window._pendingAvatar=null; }
  localStorage.setItem("noirtech_user",JSON.stringify(currentUser));
  const idx=usersDB.findIndex(u=>u.email===currentUser.email);
  if (idx>=0) { usersDB[idx]={...usersDB[idx],...currentUser}; localStorage.setItem("noirtech_users",JSON.stringify(usersDB)); }
  updateUserUI(); closeProfileModal(); showToast("تم حفظ البروفايل ✅");
  sendTelegram(`👤 تحديث بروفايل\n\n👤 ${currentUser.name}\n📞 ${currentUser.phone}\n📧 ${currentUser.email}`);
});
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
  try { await fetch("/api/auth/session", { method: "DELETE", credentials: "include" }); } catch (_) {}
  currentUser=null; localStorage.removeItem("noirtech_user"); updateUserUI(); closeProfileModal(); showToast("تم تسجيل الخروج");
});
function sendTelegram(msg) {
  // لا تُرسل أسرار البوت إلى المتصفح.
  return Promise.resolve(false);
}
document.getElementById("regAvatarInput")?.addEventListener("change", e => {
  const f = e.target.files?.[0]; if (!f) return;
  if (f.size > 2*1024*1024) { showToast("الصورة كبيرة (حد أقصى 2 ميجا)"); return; }
  const r = new FileReader();
  r.onload = () => {
    window._regAvatar = r.result;
    const img = document.getElementById("regAvatarImg");
    const ph = document.getElementById("regAvatarPlaceholder");
    if (img) { img.src = r.result; img.style.display = "block"; }
    if (ph) ph.style.display = "none";
  };
  r.readAsDataURL(f);
});
registerForm?.addEventListener("submit",e=>{
  e.preventDefault();
  const name=document.getElementById("regName").value.trim();
  const phone=document.getElementById("regPhone").value.trim();
  const email=document.getElementById("regEmail").value.trim().toLowerCase();
  const password=document.getElementById("regPassword").value;
  if (!name || !phone || !email || !password) { showToast("املأ كل الحقول"); return; }
  if (password.length < 4) { showToast("كلمة المرور قصيرة"); return; }
  const latestDB = JSON.parse(localStorage.getItem("noirtech_users") || "[]");
  usersDB.length = 0; latestDB.forEach(u => usersDB.push(u));
  if (usersDB.find(u => (u.email || "").toLowerCase() === email)) { showToast("هذا البريد مسجل بالفعل!"); return; }
  const avatar = window._regAvatar || null;
  const joined = new Date().toLocaleDateString("ar-EG");
  const user = {name,phone,email,password,address:"",bio:"",avatar,joined,orders:0};
  usersDB.push(user);
  localStorage.setItem("noirtech_users",JSON.stringify(usersDB));
  currentUser={name,phone,email,address:"",bio:"",avatar,joined,orders:0};
  localStorage.setItem("noirtech_user",JSON.stringify(currentUser));
  window._regAvatar = null;
  updateUserUI(); closeAuthModal(); showToast(`مرحباً ${name}! تم إنشاء حسابك ✅`);
  setTimeout(()=>openProfileModal(), 350);
  sendTelegram(`🆕 حساب جديد — تم القبول تلقائياً ✅\n\n👤 ${name}\n📞 ${phone}\n📧 ${email}\n🖼 صورة: ${avatar?"نعم":"لا"}\n📌 مقبول`);
  if (window._pendingCheckout) { window._pendingCheckout=false; processCheckout(); }
});
loginForm?.addEventListener("submit",e=>{
  e.preventDefault();
  try {
    const emailEl = document.getElementById("loginEmail");
    const passEl = document.getElementById("loginPassword");
    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passEl?.value || "";
    if (!email || !password) { showToast("اكتب الإيميل وكلمة المرور"); return; }
    const db = JSON.parse(localStorage.getItem("noirtech_users") || "[]");
    // sync memory
    usersDB.length = 0; db.forEach(u => usersDB.push(u));
    const user = usersDB.find(u => (u.email || "").toLowerCase() === email && String(u.password) === String(password));
    if (!user) {
      const exists = usersDB.some(u => (u.email || "").toLowerCase() === email);
      showToast(exists ? "كلمة المرور غير صحيحة" : "لا يوجد حساب بهذا الإيميل — أنشئ حسابًا");
      return;
    }
    currentUser = {
      name: user.name || "",
      phone: user.phone || "",
      email: user.email,
      address: user.address || "",
      bio: user.bio || "",
      avatar: user.avatar || null,
      joined: user.joined || "—",
      orders: user.orders || 0
    };
    localStorage.setItem("noirtech_user", JSON.stringify(currentUser));
    updateUserUI();
    closeAuthModal();
    showToast(`مرحباً بعودتك ${currentUser.name || ""}! ✅`);
    sendTelegram(`🔐 تسجيل دخول

👤 ${currentUser.name}
📞 ${currentUser.phone}
📧 ${currentUser.email}`);
    if (window._pendingCheckout) { window._pendingCheckout = false; processCheckout(); }
  } catch (err) {
    console.error(err);
    showToast("حصل خطأ في تسجيل الدخول، حاول تاني");
  }
});

function processCheckout() {
  if (!cart.length) { showToast("السلة فارغة!"); return; }
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const items=cart.map(i=>`• ${i.name} × ${i.qty} = ${(i.price*i.qty).toLocaleString("ar-EG")} ج.م`).join("\n");
  const msg=`🛒 طلب جديد — تم القبول تلقائياً ✅\n\n👤 ${currentUser.name}\n📞 ${currentUser.phone}\n📧 ${currentUser.email}\n\n📦\n${items}\n\n💰 ${total.toLocaleString("ar-EG")} ج.م\n📌 مقبول — جاري التجهيز`;
  sendTelegram(msg);
  showToast("تم قبول طلبك تلقائياً ✅");
  window.open(`https://wa.me/${window.siteConfig?.whatsapp || "201064519541"}?text=${encodeURIComponent(msg)}`,"_blank");
  cart=[]; saveCart(); closeCartSidebar();
}
checkoutBtn.addEventListener("click",()=>{
  if (!cart.length) { showToast("السلة فارغة!"); return; }
  if (!currentUser) { window._pendingCheckout=true; closeCartSidebar(); openAuthModal("login"); showToast("يجب تسجيل الدخول أولاً"); return; }
  processCheckout();
});
function openAiChat() { aiPanel.classList.add("open"); aiOverlay.classList.add("open"); aiInput?.focus(); }
function closeAiChat() { aiPanel.classList.remove("open"); aiOverlay.classList.remove("open"); }
aiChatBtn?.addEventListener("click", openAiChat);
aiClose?.addEventListener("click", closeAiChat);
aiOverlay?.addEventListener("click", closeAiChat);
function appendAiMsg(text, who) {
  const div = document.createElement("div");
  div.className = "ai-msg " + who;
  div.innerHTML = `<div class="ai-bubble">${text}</div>`;
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}
function getSmartReply(msg) {
  const m = msg.trim().toLowerCase();
  if (/سلام|مرحبا|اهلا|hi|hello|السلام/.test(m)) return "وعليكم السلام! 👋 كيف أقدر أساعدك؟";
  if (/سعر|كام|تمن|price/.test(m)) return "الأسعار تحت كل منتج 💰 هواتف من 18,999 — لابتوبات من 48,999";
  if (/هاتف|موبايل|آيفون|phone|iphone/.test(m)) return "أحدث الهواتف 📱 iPhone 16 Pro Max, Galaxy S25 Ultra, Pixel 9 Pro";
  if (/لابتوب|ماك|laptop/.test(m)) return "اللابتوبات 💻 MacBook Pro, Dell XPS, ASUS ROG";
  if (/سماعة|airpods|صوت/.test(m)) return "الصوتيات 🎧 AirPods, Sony XM5, Bose";
  if (/ساعة|watch/.test(m)) return "الساعات ⌚ Apple Watch Ultra 2, Galaxy Watch 7";
  if (/طلب|شحن|توصيل/.test(m)) return "الشحن سريع داخل مصر 🚚";
  if (/تواصل|رقم|واتس/.test(m)) return "📞 01064519541 | 📧 ahmedgabr1560@gmail.com";
  return "أقدر أساعدك في المنتجات والأسعار والشحن. اكتب سؤالك!";
}
window._aiHistory = JSON.parse(localStorage.getItem("noirtech_ai_history") || "[]");
function escapeAiText(text) { return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>"); }
function formatAiReply(text) { return escapeAiText(text).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/`([^`]+)`/g,"<code>$1</code>"); }
function addAiTyping() {
  const typing = document.createElement("div"); typing.className = "ai-msg bot"; typing.id = "aiTyping";
  typing.innerHTML = `<div class="ai-bubble ai-typing"><i></i><i></i><i></i></div>`;
  aiMessages.appendChild(typing); aiMessages.scrollTop = aiMessages.scrollHeight;
}
async function handleAiSend() {
  if (window._aiBusy) return;
  const text = (aiInput?.value || "").trim();
  if (!text) return;
  window._aiBusy = true; appendAiMsg(escapeAiText(text), "user"); aiInput.value = "";
  if (aiSend) { aiSend.disabled = true; aiSend.textContent = "…"; }
  addAiTyping();
  try {
    const catalog = products.slice(0, 40).map(p => ({ id:p.id, name:p.name, category:p.category, price:p.price, oldPrice:p.oldPrice || null, badge:p.badge || "" }));
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: window._aiHistory.slice(-12), catalog }) });
    const data = await res.json(); document.getElementById("aiTyping")?.remove();
    if (!res.ok || !data.reply) throw new Error(data.error || "تعذر الاتصال");
    appendAiMsg(formatAiReply(data.reply), "bot");
    window._aiHistory.push({ role: "user", content: text }, { role: "assistant", content: data.reply });
    window._aiHistory = window._aiHistory.slice(-20); localStorage.setItem("noirtech_ai_history", JSON.stringify(window._aiHistory));
  } catch (err) {
    document.getElementById("aiTyping")?.remove();
    appendAiMsg("حصل عطل بسيط في الاتصال بالمساعد 🤍 جرّب تبعت رسالتك تاني بعد ثواني.", "bot");
  } finally { window._aiBusy = false; if (aiSend) { aiSend.disabled = false; aiSend.textContent = "➤"; } aiInput?.focus(); }
}
aiSend?.addEventListener("click", handleAiSend);
aiInput?.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); } });
async function loadProducts() {
  try {
    const r = await fetch("/products.json?t=" + Date.now());
    if (!r.ok) throw new Error("products unavailable");
    products = (await r.json()).filter(p => !p.hidden);
  } catch (e) {
    products = [];
  }
  renderAllProducts();
  updateCartUI();
}
loadProducts();
updateUserUI();
