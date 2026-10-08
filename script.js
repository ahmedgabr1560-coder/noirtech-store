const products = [
  { id: 1, name: "iPhone 16 Pro Max", category: "phones", price: 62999, oldPrice: 67999, image: "https://images.unsplash.com/photo-1695048133142-1a204bbd4bc0?w=600&h=600&fit=crop", badge: "جديد" },
  { id: 2, name: "Samsung Galaxy S25 Ultra", category: "phones", price: 54999, oldPrice: 58999, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop", badge: "جديد" },
  { id: 3, name: "Google Pixel 9 Pro", category: "phones", price: 42999, oldPrice: null, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff32?w=600&h=600&fit=crop", badge: null },
  { id: 4, name: "Xiaomi 15 Ultra", category: "phones", price: 38999, oldPrice: 41999, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 5, name: "OnePlus 13", category: "phones", price: 34999, oldPrice: 37999, image: "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=600&h=600&fit=crop", badge: null },
  { id: 6, name: "iPhone 15", category: "phones", price: 39999, oldPrice: 44999, image: "https://images.unsplash.com/photo-1678685888229-5fe1ec6f34b7?w=600&h=600&fit=crop", badge: "عرض" },
  { id: 7, name: "Samsung Galaxy Z Fold 6", category: "phones", price: 72999, oldPrice: null, image: "https://images.unsplash.com/photo-1617040619263-41af7a7a0f0b?w=600&h=600&fit=crop", badge: "قابل للطي" },
  { id: 8, name: "Nothing Phone (2a)", category: "phones", price: 18999, oldPrice: 21999, image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=600&fit=crop", badge: null },
  { id: 9, name: "MacBook Pro 16 M3 Max", category: "laptops", price: 89999, oldPrice: 94999, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop", badge: "الأكثر مبيعاً" },
  { id: 10, name: "Dell XPS 15 OLED", category: "laptops", price: 67999, oldPrice: null, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=600&fit=crop", badge: null },
  { id: 11, name: "ASUS ROG Strix G16", category: "laptops", price: 72999, oldPrice: 78999, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop", badge: "للألعاب" },
  { id: 12, name: "Lenovo ThinkPad X1 Carbon", category: "laptops", price: 59999, oldPrice: null, image: "https://images.unsplash.com/photo-1588872657578-7b1fe1f3f5b6?w=600&h=600&fit=crop", badge: null },
  { id: 13, name: "MacBook Air 15 M3", category: "laptops", price: 54999, oldPrice: 58999, image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=600&fit=crop", badge: "خفيف" },
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
  if (currentUser) {
    userNameDisplay.textContent = currentUser.name.split(" ")[0];
    userBtn.title = currentUser.name;
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
document.getElementById("logoutBtn")?.addEventListener("click",()=>{
  currentUser=null; localStorage.removeItem("noirtech_user"); updateUserUI(); closeProfileModal(); showToast("تم تسجيل الخروج");
});
function sendTelegram(msg) {
  fetch("https://api.telegram.org/bot8737261045:AAGXsJDLKJAf0xsJzegLjWcBX3PUHZlzqow/sendMessage",{
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({chat_id:"6746972381", text:msg})
  }).catch(()=>{});
}
registerForm?.addEventListener("submit",e=>{
  e.preventDefault();
  const name=document.getElementById("regName").value.trim();
  const phone=document.getElementById("regPhone").value.trim();
  const email=document.getElementById("regEmail").value.trim().toLowerCase();
  const password=document.getElementById("regPassword").value;
  if (usersDB.find(u=>u.email===email)) { showToast("هذا البريد مسجل بالفعل!"); return; }
  usersDB.push({name,phone,email,password,address:"",bio:"",avatar:null});
  localStorage.setItem("noirtech_users",JSON.stringify(usersDB));
  currentUser={name,phone,email,address:"",bio:"",avatar:null};
  localStorage.setItem("noirtech_user",JSON.stringify(currentUser));
  updateUserUI(); closeAuthModal(); showToast(`مرحباً ${name}!`);
  sendTelegram(`🆕 حساب جديد — تم القبول تلقائياً ✅\n\n👤 ${name}\n📞 ${phone}\n📧 ${email}\n📌 مقبول`);
  if (window._pendingCheckout) { window._pendingCheckout=false; processCheckout(); }
});
loginForm?.addEventListener("submit",e=>{
  e.preventDefault();
  const email=document.getElementById("loginEmail").value.trim().toLowerCase();
  const password=document.getElementById("loginPassword").value;
  const user=usersDB.find(u=>u.email===email&&u.password===password);
  if (!user) { showToast("بيانات الدخول غير صحيحة!"); return; }
  currentUser={name:user.name,phone:user.phone,email:user.email,address:user.address||"",bio:user.bio||"",avatar:user.avatar||null};
  localStorage.setItem("noirtech_user",JSON.stringify(currentUser));
  updateUserUI(); closeAuthModal(); showToast(`مرحباً بعودتك ${user.name}!`);
  sendTelegram(`🔐 تسجيل دخول\n\n👤 ${user.name}\n📞 ${user.phone}\n📧 ${user.email}`);
  if (window._pendingCheckout) { window._pendingCheckout=false; processCheckout(); }
});
function processCheckout() {
  if (!cart.length) { showToast("السلة فارغة!"); return; }
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const items=cart.map(i=>`• ${i.name} × ${i.qty} = ${(i.price*i.qty).toLocaleString("ar-EG")} ج.م`).join("\n");
  const msg=`🛒 طلب جديد — تم القبول تلقائياً ✅\n\n👤 ${currentUser.name}\n📞 ${currentUser.phone}\n📧 ${currentUser.email}\n\n📦\n${items}\n\n💰 ${total.toLocaleString("ar-EG")} ج.م\n📌 مقبول — جاري التجهيز`;
  sendTelegram(msg);
  showToast("تم قبول طلبك تلقائياً ✅");
  window.open(`https://wa.me/201064519541?text=${encodeURIComponent(msg)}`,"_blank");
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
window._aiHistory = window._aiHistory || [];
async function handleAiSend() {
  const text = (aiInput?.value || "").trim();
  if (!text) return;
  appendAiMsg(text.replace(/</g,"&lt;").replace(/\n/g,"<br>"), "user");
  aiInput.value = "";
  if (aiSend) aiSend.disabled = true;
  const typing = document.createElement("div");
  typing.className = "ai-msg bot";
  typing.id = "aiTyping";
  typing.innerHTML = `<div class="ai-bubble">يكتب...</div>`;
  aiMessages.appendChild(typing);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: window._aiHistory })
    });
    const data = await res.json();
    document.getElementById("aiTyping")?.remove();
    if (data.reply) {
      const safe = data.reply.replace(/</g,"&lt;").replace(/\n/g,"<br>");
      appendAiMsg(safe, "bot");
      window._aiHistory.push({ role: "user", content: text });
      window._aiHistory.push({ role: "assistant", content: data.reply });
      if (window._aiHistory.length > 20) window._aiHistory = window._aiHistory.slice(-20);
    } else {
      appendAiMsg(getSmartReply(text), "bot");
    }
  } catch (err) {
    document.getElementById("aiTyping")?.remove();
    appendAiMsg(getSmartReply(text), "bot");
  }
  if (aiSend) aiSend.disabled = false;
}
aiSend?.addEventListener("click", handleAiSend);
aiInput?.addEventListener("keydown", e => { if (e.key === "Enter") handleAiSend(); });
renderAllProducts(); updateCartUI(); updateUserUI();
