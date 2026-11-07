/* ATHAR core globals — must be first to avoid TDZ */
var PRODUCTS = [];
var __heroRotateTimer = null;
var __heroRotateIdx = 0;
function $(s, r) { return (r || document).querySelector(s); }
var activeBundleCat = "all";
var CATEGORIES = [];
var BRANDS = [];
var cart = [];
try { cart = JSON.parse(localStorage.getItem("nx_cart") || "[]"); if (!Array.isArray(cart)) cart = []; } catch (e) { cart = []; }
var activeCategory = "";
var activeSubcategory = "";
var activeBrand = "";
var activeSort = "newest";
var DEMO = false;


window.addEventListener("athar-homepage-applied", function() {
  try {
    if (typeof renderShop === "function") renderShop();
    if (typeof renderBundleSection === "function") renderBundleSection(); else if (typeof renderBundles === "function") renderBundles();
  } catch (e) {}
});
function atharSectionLimit(sectionId) {
  try {
    const el = document.getElementById(sectionId);
    if (!el) return null;
    const v = el.getAttribute("data-hp-limit");
    if (v === "" || v == null) return null;
    const n = Number(v);
    // 0 أو سالب = كل المنتجات
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (e) { return null; }
}


(function atharSyncChannel(){
  try {
    if (!("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel("ATHAR_SYNC");
    ch.onmessage = function(ev) {
      if (!ev || !ev.data) return;
      if (ev.data.type === "catalog_bust" || ev.data.type === "products_changed") {
        try { sessionStorage.removeItem("nx_products"); } catch (e) {}
        try { localStorage.setItem("nx_catalog_bust", String(Date.now())); } catch (e) {}
        if (typeof loadProducts === "function") loadProducts(true);
        if (typeof loadHeroConfig === "function") loadHeroConfig();
      }
    };
  } catch (e) {}
})();


(function bindSystemTheme(){
  try {
    const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    if (window.matchMedia && !window.__ATHAR_SCHEME_BOUND_JS) {
      window.__ATHAR_SCHEME_BOUND_JS = true;
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(e) {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        document.documentElement.style.colorScheme = e.matches ? "dark" : "light";
        if (typeof applySystemSurfaces === "function") applySystemSurfaces(window.__ATHAR_BRAND_COLORS);
      });
    }
  } catch (e) {}
})();


function applyStoreOpenState(cfg) {
  try {
    cfg = cfg || window.siteConfig || {};
    let bar = document.getElementById("storeClosedBar");
    if (cfg.storeOpen === false) {
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "storeClosedBar";
        bar.style.cssText = "position:sticky;top:0;z-index:90;background:linear-gradient(90deg,#7f1d1d,#991b1b);color:#fff;text-align:center;padding:10px 14px;font-size:.9rem;font-weight:700";
        document.body.prepend(bar);
      }
      bar.textContent = cfg.storeClosedMessage || "المتجر متوقف مؤقتًا";
      bar.hidden = false;
      const btn = document.getElementById("checkoutBtn");
      if (btn) { btn.disabled = true; btn.title = "المتجر مغلق"; }
    } else if (bar) {
      bar.hidden = true;
      const btn = document.getElementById("checkoutBtn");
      if (btn) { btn.disabled = false; btn.title = ""; }
    }
  } catch (e) {}
}

document.documentElement.classList.toggle("android-device", /Android/i.test(navigator.userAgent || ""));
function debounce(fn, ms){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), ms); }; }

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
    tgEl.style.display = "none";
  }
  // AI float
  const aiEl = document.getElementById("aiChatBtn") || document.getElementById("floatAiBtn");
  if (aiEl) aiEl.style.display = c.showFloatAI === false ? "none" : "";
  const fb = document.getElementById("floatButtons");
  if (fb) fb.style.display = "flex";
  const contact = document.getElementById("contact");
  if (contact) contact.style.display = c.showContact === false ? "none" : "";
  const categories = document.getElementById("catsMenuBtn");
  if (categories) categories.closest(".nav-drop")?.style.setProperty("display", c.showCategories === false ? "none" : "");
  document.querySelectorAll("#about, [data-section='about']").forEach(el => { el.style.display = c.showAbout === false ? "none" : ""; });

  // contact anchors in page
  document.querySelectorAll('a[href^="tel:"]').forEach(a => { if (phone) a.href = "tel:" + phone; });
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => { if (email) a.href = "mailto:" + email; });
}

function applyBrandConfig(c) {
  if (!c) return;
  const name = (c.siteName || "ATHAR | أثر").trim();
  const mark = (c.logoMark || name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2) || "NX").trim().slice(0, 3).toUpperCase();
  const tag = (c.siteTagline || "").trim();
  const fav = (c.favicon || "").trim();
  window.__SITE_NAME__ = name;
  window.__SITE_MARK__ = mark;

  document.querySelectorAll("[data-site-name]").forEach(el => { el.textContent = name; });
  document.querySelectorAll("[data-site-mark]").forEach(el => { el.textContent = mark; });
  document.querySelectorAll("[data-site-tagline]").forEach(el => { if (tag) el.textContent = tag; });

  const logoName = document.getElementById("logoName");
  const logoMark = document.getElementById("logoMarkText");
  const docTitle = document.getElementById("docTitle");
  if (logoName) logoName.textContent = name;
  if (logoMark) logoMark.textContent = mark;
  const title = tag ? (name + " | " + tag) : name;
  if (docTitle) docTitle.textContent = title;
  document.title = title;

  // Footer copyright
  const footCopy = document.getElementById("footerCopy");
  if (footCopy) footCopy.textContent = "© " + new Date().getFullYear() + " " + name + " · جميع الحقوق محفوظة";

  // Offers / new section blurbs
  document.querySelectorAll("[data-site-blurb]").forEach(el => {
    const kind = el.getAttribute("data-site-blurb");
    if (kind === "offers") el.textContent = "خصومات وعروض حصرية من " + name;
    if (kind === "new") el.textContent = "أحدث القطع في " + name;
  });

  // AI header
  const aiTitle = document.querySelector(".ai-head h4, #aiPanel h4");
  if (aiTitle) aiTitle.textContent = "نورا · " + name;
  const aiBubble = document.querySelector("#aiMessages .ai-msg.bot .ai-bubble");
  if (aiBubble && /ATHAR | أثر|نورا/.test(aiBubble.textContent || "")) {
    // only reset default bubble if still generic
  }

  // Auth brand marks
  document.querySelectorAll(".auth-brand-mark").forEach(el => { el.textContent = mark; });
  document.querySelectorAll(".auth-brand h2, .auth-brand .auth-title").forEach(el => {
    if (el.id === "authBrandName" || el.hasAttribute("data-site-name")) el.textContent = name;
  });
  const memberLabel = document.querySelector("[data-member-label]");
  if (memberLabel) memberLabel.textContent = "عضو " + name;

  // Favicon
  let link = document.getElementById("siteFavicon") || document.querySelector('link[rel="icon"]');
  if (link && fav) {
    link.href = fav;
    link.setAttribute("href", fav);
  }
  // meta description
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", name + " — متجر الموضة والأزياء");
}

async 
function applyHeroScaleFromConfig(c) {
  if (!c) return;
  try {
    const root = document.documentElement;
    let hs = Number(c.heroScale);
    let hsm = Number(c.heroScaleMobile);
    if (!(hs > 0.3 && hs <= 1.6)) hs = 1.28;
    if (!(hsm > 0.3 && hsm <= 1.5)) hsm = 1.05;
    root.style.setProperty("--hero-scale", String(hs));
    root.style.setProperty("--hero-scale-mobile", String(hsm));
  } catch (e) {}
}

async function loadHeroConfig() {
  const cached = nxCacheGet("nx_config");
  if (cached && typeof cached === "object") {
    window.siteConfig = cached;
    window.__SITE_CONFIG__ = cached;
    try { applyHeroScaleFromConfig(window.siteConfig); } catch (eHS) {}
    applyHeroScaleFromConfig(cached);
    try { applyBrandConfig(cached); } catch (e) {}
    try { applyGeneralConfig(cached); } catch (e) {}
  }
  try {
    let r = await fetch("/api/catalog?type=config", { cache: "default" });
    if (!r.ok) r = await fetch("/site-config.json", { cache: "default" });
    if (!r.ok) return;
    const raw = await r.json();
    const c = raw.config || raw;
    window.siteConfig = c;
    applyBrandConfig(c);
    window.__SITE_CONFIG__ = c;
    nxCacheSet("nx_config", c);
    try { startHeroProductRotate(c); } catch (e) {}
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


/* ATHAR | أثر — frontend demo store (localStorage only) */
/** Products loaded from products.json (bot-managed) */

/* ===== Instant refresh cache (sessionStorage) ===== */
const NX_CACHE_TTL = 12 * 1000; // 8 ثواني // 15 ثانية — تحديث سريع من الأدمن
function nxCacheGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || obj.t == null) return null;
    if (Date.now() - obj.t > NX_CACHE_TTL) return null;
    return obj.d;
  } catch (e) { return null; }
}
function nxCacheSet(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
}

/* PRODUCTS global at top */
/* cart global at top */
var currentUser = JSON.parse(localStorage.getItem("nx_user") || "null");
var usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]");
let regAvatar = null;
let pendingAvatar = null;

/* $ helper at top */
function normalizePhone(v) {
  const map = {"٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"};
  return String(v || "").replace(/[٠-٩]/g, d => map[d] || d).replace(/[^0-9+]/g, "");
}

const CHECKOUT_DRAFT_KEY = "nx_checkout_draft";
function readCheckoutDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || "null");
    return draft && typeof draft === "object" ? draft : {};
  } catch (e) { return {}; }
}
function saveCheckoutDraft() {
  try {
    const get = id => document.getElementById(id)?.value || "";
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({
      name: get("orderName").trim(),
      phone: get("orderPhone").trim(),
      address: get("orderAddress").trim(),
      note: get("orderNote").trim(),
      governorate: document.getElementById("orderGov")?.value || "",
      center: document.getElementById("orderCenter")?.value || ""
    }));
  } catch (e) {}
}
function restoreCheckoutDraft() {
  const draft = readCheckoutDraft();
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value && !el.value) el.value = value;
  };
  set("orderName", draft.name);
  set("orderPhone", draft.phone);
  set("orderAddress", draft.address);
  set("orderNote", draft.note);
  const gov = document.getElementById("orderGov");
  if (gov && draft.governorate) gov.value = draft.governorate;
  const cen = document.getElementById("orderCenter");
  if (cen && draft.center) cen.value = draft.center;
}
function bindCheckoutDraft() {
  ["orderName", "orderPhone", "orderAddress", "orderNote", "orderGov", "orderCenter"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", saveCheckoutDraft);
    document.getElementById(id)?.addEventListener("change", saveCheckoutDraft);
  });
  restoreCheckoutDraft();
}


let SHIPPING_ZONES = null;

async function loadShippingZones(force) {
  if (SHIPPING_ZONES && !force) return SHIPPING_ZONES;
  try {
    const cached = sessionStorage.getItem("nx_shipping_zones");
    if (cached && !force) {
      const o = JSON.parse(cached);
      if (o && o.t && Date.now() - o.t < 60000 && o.d) {
        SHIPPING_ZONES = o.d;
        return SHIPPING_ZONES;
      }
    }
  } catch (e) {}
  const urls = [
    "/api/catalog?type=shipping",
    "/shipping-zones.json"
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "default" });
      if (!r.ok) continue;
      const data = await r.json();
      const zones = data.zones || data;
      if (zones && (zones.governorates || zones.enabled != null)) {
        SHIPPING_ZONES = zones;
        try { sessionStorage.setItem("nx_shipping_zones", JSON.stringify({ t: Date.now(), d: zones })); } catch (e) {}
        return SHIPPING_ZONES;
      }
    } catch (e) {}
  }
  SHIPPING_ZONES = SHIPPING_ZONES || { enabled: false, defaultFee: 0, freeAbove: 0, governorates: [] };
  return SHIPPING_ZONES;
}

function getShippingConfig() {
  const z = SHIPPING_ZONES || {};
  const c = window.siteConfig || window.__SITE_CONFIG__ || {};
  return {
    enabled: z.enabled === true || c.shippingEnabled === true,
    fee: Number(z.defaultFee != null ? z.defaultFee : c.shippingFee) || 0,
    freeAbove: Number(z.freeAbove != null ? z.freeAbove : c.shippingFreeAbove) || 0,
    note: z.note || c.shippingNote || "",
    days: z.days || c.shippingDays || ""
  };
}

function findGov(id) {
  const list = (SHIPPING_ZONES && SHIPPING_ZONES.governorates) || [];
  return list.find(g => String(g.id) === String(id));
}
function findCenter(gov, centerId) {
  if (!gov || !Array.isArray(gov.centers)) return null;
  return gov.centers.find(c => String(c.id) === String(centerId));
}

function calcShipping(subtotal, govId, centerId) {
  const s = getShippingConfig();
  if (!s.enabled) return { amount: 0, free: false, label: "بدون شحن", note: "", govName: "", centerName: "" };
  const sub = Number(subtotal) || 0;
  if (s.freeAbove > 0 && sub >= s.freeAbove) {
    return { amount: 0, free: true, label: "شحن مجاني", note: s.note || s.days || "", govName: "", centerName: "" };
  }
  let amount = s.fee;
  let govName = "";
  let centerName = "";
  const gov = govId ? findGov(govId) : null;
  if (gov) {
    govName = gov.name || "";
    amount = Number(gov.fee != null ? gov.fee : amount) || amount;
    const center = centerId ? findCenter(gov, centerId) : null;
    if (center) {
      centerName = center.name || "";
      if (center.fee != null && center.fee !== "") amount = Number(center.fee) || amount;
    }
  }
  return {
    amount: Math.max(0, amount),
    free: false,
    label: "الشحن",
    note: [s.days, s.note].filter(Boolean).join(" — "),
    govName,
    centerName
  };
}

function populateGovSelect() {
  var sel = document.getElementById("orderGov");
  if (!sel) return;
  var zones = SHIPPING_ZONES || {};
  var list = Array.isArray(zones.governorates) ? zones.governorates : [];
  if (!list.length && zones.zones && Array.isArray(zones.zones.governorates)) list = zones.zones.governorates;
  var prev = sel.value;
  if (!list.length) {
    sel.innerHTML = '<option value="">— جاري تحميل المحافظات… —</option>';
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  sel.innerHTML = '<option value="">— اختاري المحافظة —</option>';
  for (var i = 0; i < list.length; i++) {
    var g = list[i] || {};
    var opt = document.createElement("option");
    opt.value = String(g.id || g.name || "");
    opt.textContent = String(g.name || g.id || "");
    sel.appendChild(opt);
  }
  if (prev) { try { sel.value = prev; } catch (e) {} }
}

function populateCenterSelect() {
  const govSel = document.getElementById("orderGov");
  const cenSel = document.getElementById("orderCenter");
  if (!cenSel) return;
  const gov = govSel && govSel.value ? findGov(govSel.value) : null;
  if (!gov) {
    cenSel.innerHTML = `<option value="">— اختاري المركز —</option>`;
    cenSel.disabled = true;
    return;
  }
  cenSel.disabled = false;
  const prev = cenSel.value;
  cenSel.innerHTML = `<option value="">— اختاري المركز / الحي —</option>` +
    (gov.centers || []).map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  if (prev && (gov.centers || []).some(c => String(c.id) === String(prev))) cenSel.value = prev;
}

function bindShippingSelects() {
  const govSel = document.getElementById("orderGov");
  const cenSel = document.getElementById("orderCenter");
  if (govSel && !govSel.dataset.bound) {
    govSel.addEventListener("change", () => {
      populateCenterSelect();
      if (typeof updateCartUI === "function") updateCartUI();
    });
    govSel.dataset.bound = "1";
  }
  if (cenSel && !cenSel.dataset.bound) {
    cenSel.addEventListener("change", () => {
      if (typeof updateCartUI === "function") updateCartUI();
    });
    cenSel.dataset.bound = "1";
  }
}


function dealPriceForQty(product, qty) {
  qty = Math.max(1, Number(qty) || 1);
  const unit = Number(product?.price || 0);
  const meta = product?.offerMeta;
  if (!meta || !Array.isArray(meta.tiers) || !meta.tiers.length) {
    return { lineTotal: unit * qty, unitEffective: unit, dealLabel: "" };
  }
  const tiers = [...meta.tiers].filter(t => t.qty > 0 && t.price > 0).sort((a,b) => b.qty - a.qty);
  let remaining = qty;
  let total = 0;
  let labelParts = [];
  for (const t of tiers) {
    const packs = Math.floor(remaining / t.qty);
    if (packs > 0) {
      total += packs * t.price;
      remaining -= packs * t.qty;
      labelParts.push(`${packs}×(${t.qty} بـ ${t.price})`);
    }
  }
  total += remaining * unit;
  return {
    lineTotal: total,
    unitEffective: qty ? total / qty : unit,
    dealLabel: labelParts.join(" + ")
  };
}

function cartLinePrice(i) {
  const p = PRODUCTS.find(x => Number(x.id) === Number(i.id));
  if (p && (p.isOffer || p.offerMeta)) {
    const d = dealPriceForQty(p, i.qty);
    return d.unitEffective;
  }
  if (i.price != null) return Number(i.price);
  return p ? Number(p.price || 0) : 0;
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


function bindCartQtyButtons() {
  try {
    var box = document.getElementById("cartItems");
    if (!box) return;
    box.querySelectorAll("[data-inc], [data-dec], [data-remove]").forEach(function (btn) {
      if (btn.dataset.qtyBound === "1") return;
      btn.dataset.qtyBound = "1";
      btn.style.pointerEvents = "auto";
      btn.style.cursor = "pointer";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        try { if (typeof loadCartFromStorage === "function") loadCartFromStorage(); } catch (e0) {}
        var id = btn.getAttribute("data-inc") || btn.getAttribute("data-dec") || btn.getAttribute("data-remove");
        var col = btn.getAttribute("data-color") || "";
        var it = typeof findCartLine === "function" ? findCartLine(id, col) : null;
        if (!it && Array.isArray(cart)) {
          it = cart.find(function (x) { return Number(x.id) === Number(id); });
        }
        if (!it) return;
        if (btn.hasAttribute("data-inc")) {
          it.qty = (Number(it.qty) || 1) + 1;
        } else if (btn.hasAttribute("data-dec")) {
          it.qty = (Number(it.qty) || 1) - 1;
          if (it.qty <= 0) cart = (cart || []).filter(function (x) { return x !== it; });
        } else if (btn.hasAttribute("data-remove")) {
          cart = (cart || []).filter(function (x) { return x !== it; });
        }
        try { saveCart(); } catch (e1) {}
        try { if (window.__atharRefreshCartTotals) window.__atharRefreshCartTotals(); } catch (e2) {}
      }, true);
    });
  } catch (err) { console.warn("bindCartQty", err); }
}

function findCartLine(id, colorHint) {
  id = Number(id);
  var col = String(colorHint || "").trim();
  var list = Array.isArray(cart) ? cart : [];
  if (!list.length) {
    try { if (typeof loadCartFromStorage === "function") loadCartFromStorage(); list = cart || []; } catch (e) {}
  }
  // 1) match id + color
  if (col) {
    var hit = list.find(function (x) {
      var xc = String(x.color || x.selectedColor || "").trim();
      var xs = Array.isArray(x.colors) ? x.colors.filter(Boolean).join("، ") : "";
      return Number(x.id) === id && (xc === col || xs === col || (x.colors && x.colors.indexOf(col) >= 0));
    });
    if (hit) return hit;
  }
  // 2) single line with same id
  var same = list.filter(function (x) { return Number(x.id) === id; });
  if (same.length === 1) return same[0];
  if (same.length > 1 && col) {
    var hit2 = same.find(function (x) { return String(x.color || "") === col; });
    if (hit2) return hit2;
  }
  // 3) first match by id
  return same[0] || null;
}

function loadCartFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem("nx_cart") || "[]");
    cart = Array.isArray(raw) ? raw : [];
  } catch (e) { cart = []; }
  return cart;
}
function saveCart() {
  try { localStorage.setItem("nx_cart", JSON.stringify(cart || [])); } catch (e) {}
  try { updateCartUI(); } catch (e2) { console.warn(e2); }
}
function discountPct(p) {
  if (!p.oldPrice || p.oldPrice <= p.price) return null;
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
}




/* activeBundleCat at top */
function getBundleProducts() {
  return (PRODUCTS || []).filter(p => isBundleOffer(p) || (p.isOffer && (p.offerType === "mixed_bundle" || p.offerType === "bundle" || p.offerType === "both")));
}
function categoryLabel(catId) {
  const id = String(catId || "");
  const list = (window.CATEGORIES && window.CATEGORIES.length) ? window.CATEGORIES : [];
  const hit = list.find(function(c) { return String(c.id) === id; });
  if (hit) return hit.name_ar || hit.name || hit.name_en || id;
  const map = { fashion: "الموضة والأزياء", electronics: "الإلكترونيات", "home-appliances": "الأجهزة المنزلية", beauty: "الجمال", sports: "رياضة", bags: "شنط", accessories: "إكسسوارات" };
  return map[id] || id || "بدون قسم";
}
function buildBundleCategoryTabs() {
  const tabs = document.getElementById("bundleTabs");
  if (!tabs) return;
  const bundles = getBundleProducts();
  const counts = {};
  bundles.forEach(function(p) {
    const c = String(p.category || p.cat || "").trim() || "_none";
    counts[c] = (counts[c] || 0) + 1;
  });
  // Prefer order from CATEGORIES, then any extra
  const ordered = [];
  const seen = new Set();
  const catList = (window.CATEGORIES && window.CATEGORIES.length) ? window.CATEGORIES : [];
  catList.forEach(function(c) {
    const id = String(c.id);
    if (counts[id]) { ordered.push(id); seen.add(id); }
  });
  Object.keys(counts).forEach(function(id) {
    if (!seen.has(id)) ordered.push(id);
  });
  let html = `<button type="button" class="chip bundle-tab ${activeBundleCat === "all" ? "active" : ""}" data-bundle-cat="all">الكل (${bundles.length})</button>`;
  ordered.forEach(function(id) {
    const label = id === "_none" ? "بدون قسم" : categoryLabel(id);
    html += `<button type="button" class="chip bundle-tab ${activeBundleCat === id ? "active" : ""}" data-bundle-cat="${id}">${label} (${counts[id]})</button>`;
  });
  tabs.innerHTML = html;
}

async function ensureCategoriesLoaded() {
  if (window.CATEGORIES && window.CATEGORIES.length) return window.CATEGORIES;
  try {
    const r = await fetch("/categories.json?t=" + Date.now(), { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      window.CATEGORIES = Array.isArray(d) ? d : (d.categories || []);
      return window.CATEGORIES;
    }
  } catch (e) {}
  window.CATEGORIES = window.CATEGORIES || [];
  return window.CATEGORIES;
}
async function renderBundleSection() {
  try { if (typeof ensureCategoriesLoaded === "function") await ensureCategoriesLoaded(); } catch (e) {}
  const bundleGrid = document.getElementById("bundleGrid") || (typeof $ === "function" ? $("#bundleGrid") : null);
  if (!bundleGrid) return;
  try { if (typeof buildBundleCategoryTabs === "function") buildBundleCategoryTabs(); } catch (e) {}
  let list = [];
  try {
    list = typeof getBundleProducts === "function" ? getBundleProducts() : (PRODUCTS || []).filter(function(p) {
      return typeof isBundleOffer === "function" && isBundleOffer(p);
    });
  } catch (e2) {
    list = (PRODUCTS || window.__ATHAR_PRODUCTS || []).filter(function(p) {
      if (!p) return false;
      if (p.isOffer) return true;
      const tiers = p.offerMeta && p.offerMeta.tiers;
      return Array.isArray(tiers) && tiers.some(function(t) { return Number(t.qty) >= 2; });
    });
  }
  if (typeof activeBundleCat !== "undefined" && activeBundleCat && activeBundleCat !== "all") {
    list = list.filter(function(p) {
      const c = String(p.category || p.cat || "").trim() || "_none";
      return c === String(activeBundleCat);
    });
  }
  var __hpBundleLimit = typeof atharSectionLimit === "function" ? atharSectionLimit("bundles") : null;
  if (__hpBundleLimit && __hpBundleLimit > 0) list = list.slice(0, __hpBundleLimit);
  if (list.length) {
    if (typeof renderGrid === "function") renderGrid(bundleGrid, list);
    else {
      bundleGrid.innerHTML = list.map(function(p) {
        return '<article class="product-card" data-id="' + p.id + '"><a href="/product.html?id=' + p.id + '"><img src="' + (p.image||'') + '" alt=""/><h3>' + (p.name||'') + '</h3></a>' +
          '<button type="button" class="add-btn" data-add="' + p.id + '" onclick="try{addToCart(' + p.id + ',{fromHome:true})}catch(e){}">أضف للسلة</button></article>';
      }).join("");
    }
  } else {
    bundleGrid.innerHTML = '<div class="empty-state">لا توجد عروض قطع حاليًا.</div>';
  }
}

function isBundleOffer(p) {
  if (!p) return false;
  const ot = String(p.offerType || "");
  if (ot === "mixed_bundle" || ot === "bundle" || ot === "both") return true;
  if (p.offerMeta && String(p.offerMeta.type || "") === "mixed_bundle") return true;
  const tiers = p.offerMeta && Array.isArray(p.offerMeta.tiers) ? p.offerMeta.tiers : [];
  if (tiers.some(function(t) { return Number(t.qty) >= 2 && Number(t.price) > 0; })) return true;
  if (p.isOffer && (ot === "bundle" || ot === "both" || ot === "mixed_bundle")) return true;
  return false;
}
function isDiscountOffer(p) {
  if (!p) return false;
  if (isBundleOffer(p)) return false; // bundles لها قسم لوحدها
  if (p.oldPrice && p.price && Number(p.oldPrice) > Number(p.price)) return true;
  if (p.isOffer && !isBundleOffer(p)) return true;
  return false;
}


function isMixedBundle(p) {
  if (!p) return false;
  if (String(p.offerType || "") === "mixed_bundle") return true;
  if (p.offerMeta && String(p.offerMeta.type || "") === "mixed_bundle") return true;
  const ids = (p.offerMeta && (p.offerMeta.productIds || p.offerMeta.sourceProductIds)) || [];
  if (Array.isArray(ids) && ids.length >= 2) return true;
  if (p.sourceProductId && p.sourceProductId2) return true;
  return false;
}
function resolveProductImage(prod) {
  if (!prod) return "";
  if (Array.isArray(prod.images) && prod.images[0]) return prod.images[0];
  return prod.image || "";
}
function getMixedOfferImages(p) {
  // [0] مثلث فوق = المنتج الأول | [1] مثلث تحت = المنتج الثاني
  if (!p) return ["", ""];
  const pool = (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length)
    ? window.PRODUCTS
    : (Array.isArray(PRODUCTS) && PRODUCTS.length)
      ? PRODUCTS
      : (window.__ATHAR_PRODUCTS || []);
  function byId(id) {
    if (id == null || id === "") return null;
    return pool.find(function(x) { return String(x.id) === String(id); }) || null;
  }
  function imgOf(prod) {
    if (!prod) return "";
    if (Array.isArray(prod.images) && prod.images[0]) return prod.images[0];
    return prod.image || "";
  }
  let id1 = null, id2 = null;
  const meta = p.offerMeta || {};
  const ids = meta.productIds || meta.sourceProductIds || [];
  if (Array.isArray(ids) && ids.length >= 1) id1 = ids[0];
  if (Array.isArray(ids) && ids.length >= 2) id2 = ids[1];
  if (id1 == null && p.sourceProductId != null) id1 = p.sourceProductId;
  if (id2 == null && p.sourceProductId2 != null) id2 = p.sourceProductId2;
  if (id2 == null && meta.sourceProductId2 != null) id2 = meta.sourceProductId2;
  if ((id1 == null || id2 == null) && p.name && String(p.name).indexOf("+") >= 0) {
    const raw = String(p.name).replace(/^عرض\s*:\s*/i, "");
    const parts = raw.split(/\s*\+\s*/).map(function(s){ return s.trim(); }).filter(Boolean);
    if (parts.length >= 2) {
      function findByName(n) {
        const nn = n.toLowerCase();
        return pool.find(function(x) {
          const xn = String(x.name || "").toLowerCase();
          return xn === nn || xn.indexOf(nn) >= 0 || nn.indexOf(xn) >= 0;
        });
      }
      if (id1 == null) {
        const f1 = findByName(parts[0]);
        if (f1) id1 = f1.id;
      }
      if (id2 == null) {
        const f2 = findByName(parts[1]);
        if (f2) id2 = f2.id;
      }
    }
  }
  let img1 = imgOf(byId(id1));
  let img2 = imgOf(byId(id2));
  if (!img1 && Array.isArray(p.images) && p.images[0]) img1 = p.images[0];
  if (!img2 && Array.isArray(p.images) && p.images[1]) img2 = p.images[1];
  if (!img1) img1 = p.image || "";
  if (!img2) img2 = (Array.isArray(p.images) && p.images[1]) || img1 || p.image || "";
  return [img1, img2];
}

function productCard(p) {
  const off = discountPct(p);
  return `<article class="product-card" data-id="${p.id}">
    <button type="button" class="btn-fav" data-fav="${p.id}" aria-label="مفضلة" onclick="event.preventDefault();event.stopPropagation();try{toggleFav&&toggleFav(${p.id})}catch(e){}">♡</button>
    <a class="product-media ${isMixedBundle(p) ? "mixed-split" : ""}" href="/product.html?id=${p.id}" data-open="${p.id}">
      ${isMixedBundle(p) ? (function(){
          const imgs = getMixedOfferImages(p);
          const a = imgs[0] || p.image || ""; // فوق = منتج 1
          const b = imgs[1] || a; // تحت = منتج 2
          return `<span class="mixed-tri mixed-tri-a" title="المنتج الأول" style="background-image:url('${a}')"></span>
      <span class="mixed-tri mixed-tri-b" title="المنتج الثاني" style="background-image:url('${b}')"></span>
      <span class="mixed-split-line" aria-hidden="true"></span>`;
        })() : `<img src="${p.image}" alt="${String(p.name||'منتج').replace(/"/g,'')}" loading="lazy" decoding="async" width="400" height="400" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&q=70'" />`}
      ${isBundleOffer(p) || isMixedBundle(p) ? `<span class="badge-off" style="background:linear-gradient(135deg,#f97316,#ea580c)">عرض قطع</span>` : (off ? `<span class="badge-off">-${off}%</span>` : "")}
    </a>
    <div class="product-body">
      <h3 class="product-name"><a class="product-link" href="/product.html?id=${p.id}" data-open="${p.id}">${p.name}</a></h3>
      <div class="rating" title="تقييم">${stars(p.rating)} <span>(${p.reviews} تقييم)</span></div>
      <div class="price-row">
        <span class="price">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
      </div>
      ${(p.offerMeta && Array.isArray(p.offerMeta.tiers) && p.offerMeta.tiers.length) ? `<div style="font-size:.72rem;color:#fdba74;margin-top:4px;font-weight:700">🔥 ${p.offerMeta.tiers.map(t => t.qty + " بـ " + Number(t.price).toLocaleString("ar-EG")).join(" · ")}</div>` : ""}
      <button type="button" class="add-btn" data-add="${p.id}" onclick="event.preventDefault();event.stopPropagation();try{addToCart(${p.id},{fromHome:true});}catch(e){console.warn(e);}">أضف للسلة</button>
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
  // خصومات فقط (من غير عروض ٢/٣ قطع)
  (function(){
    var bestEl = $("#bestGrid");
    if (!bestEl) return;
    var list = PRODUCTS.filter(function(p){ return !p.hidden && !isBundleOffer(p); });
    // فضّل الشنط والمنتجات اللي فيها صور
    list.sort(function(a,b){
      var sa = /شنط|حقيبة|bag/i.test(String(a.name||"")) || a.best ? 0 : 1;
      var sb = /شنط|حقيبة|bag/i.test(String(b.name||"")) || b.best ? 0 : 1;
      return sa - sb;
    });
    if (!list.length) list = PRODUCTS.slice(0, 6);
    renderGrid(bestEl, list.slice(0, 6));
  })();
  // عروض القطع — بأقسام
  renderBundleSection();
  renderGrid($("#newGrid"), PRODUCTS.filter(p => !p.isOffer && !isBundleOffer(p)).slice(0, 12));
  renderShop();
  // default storefront to fashion
  if (typeof setShopFilter === "function" && CATEGORIES.some(c => c.id === "fashion")) {
    try { setShopFilter("fashion", "", { scroll: false }); } catch (e) {}
  }
}

let COUPON_CODES = {
  NEXORA10: 10,
  WELCOME10: 10,
  FIRST10: 10,
  SAVE10: 10,
  EGYPT10: 10,
  AHMED: 50
};

async function loadCoupons(force) {
  try {
    if (!force) {
      const cached = sessionStorage.getItem("nx_coupons");
      if (cached) {
        const o = JSON.parse(cached);
        if (o && o.t && Date.now() - o.t < 60000 && o.map) {
          COUPON_CODES = o.map;
          return COUPON_CODES;
        }
      }
    }
  } catch (e) {}
  const urls = [
    "/api/catalog?type=coupons&t=" + Date.now(),
    "/coupons.json?t=" + Date.now()
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const data = await r.json();
      const list = Array.isArray(data.codes) ? data.codes : [];
      const map = {};
      list.forEach(row => {
        const code = String(row.code || "").trim().toUpperCase();
        const pct = Number(row.percent);
        if (!code || !Number.isFinite(pct) || pct <= 0) return;
        if (row.active === false) return;
        map[code] = Math.min(90, Math.round(pct));
      });
      if (Object.keys(map).length || data.ok) {
        COUPON_CODES = Object.keys(map).length ? map : COUPON_CODES;
        try { sessionStorage.setItem("nx_coupons", JSON.stringify({ t: Date.now(), map: COUPON_CODES })); } catch (e) {}
        return COUPON_CODES;
      }
    } catch (e) {}
  }
  return COUPON_CODES;
}

function getCouponCode() {
  try {
    var code = String(sessionStorage.getItem("nx_coupon_code") || localStorage.getItem("nx_coupon_code") || "").trim().toUpperCase();
    if (!code) return "";
    if (COUPON_CODES && COUPON_CODES[code] != null) return code;
    var FALLBACK = { NEXORA10: 10, WELCOME10: 10, FIRST10: 10, SAVE10: 10, EGYPT10: 10, AHMED: 50 };
    if (FALLBACK[code] != null) {
      if (!COUPON_CODES) COUPON_CODES = {};
      COUPON_CODES[code] = FALLBACK[code];
      return code;
    }
    return code; // احتفظ بالكود حتى لو القائمة ناقصة
  } catch (e) { return ""; }
}
function couponPercent(code = getCouponCode()) {
  return COUPON_CODES[code] || 0;
}
function couponDiscount(subtotal) {
  const amount = Math.max(0, Number(subtotal) || 0);
  return Math.round(amount * couponPercent()) / 100;
}
function getCartDiscount(subtotal) {
  return couponDiscount(subtotal);
}
async function applyCouponFromInput() {
  try {
    var input = document.getElementById("couponInput");
    var msg = document.getElementById("couponMsg");
    var raw = String((input && input.value) || "").trim().toUpperCase();
    if (!raw) {
      try { sessionStorage.removeItem("nx_coupon_code"); localStorage.removeItem("nx_coupon_code"); } catch (e) {}
      if (msg) msg.textContent = "اكتبي كود الخصم";
      try { updateCartUI(); } catch (e) {}
      return false;
    }
    if (msg) msg.textContent = "جاري التحقق من الكود…";
    try { await loadCoupons(true); } catch (eLoad) {}
    if (typeof COUPON_CODES !== "object" || !COUPON_CODES) COUPON_CODES = {};
    // أكواد احتياطية مضمونة
    var FALLBACK = { NEXORA10: 10, WELCOME10: 10, FIRST10: 10, SAVE10: 10, EGYPT10: 10, AHMED: 50 };
    if (!COUPON_CODES[raw] && FALLBACK[raw]) COUPON_CODES[raw] = FALLBACK[raw];
    if (!COUPON_CODES[raw]) {
      try { sessionStorage.removeItem("nx_coupon_code"); localStorage.removeItem("nx_coupon_code"); } catch (e) {}
      if (msg) msg.textContent = "الكود غير صالح أو غير مفعّل";
      try { updateCartUI(); } catch (e) {}
      return false;
    }
    try { sessionStorage.setItem("nx_coupon_code", raw); } catch (e) {}
    try { localStorage.setItem("nx_coupon_code", raw); } catch (e) {}
    var pct = Number(COUPON_CODES[raw]) || 0;
    if (msg) msg.textContent = "تم تطبيق الخصم ✓ (" + pct + "%)";
    try { updateCartUI(); } catch (e) {}
    return true;
  } catch (err) {
    console.warn("applyCoupon", err);
    var msg2 = document.getElementById("couponMsg");
    if (msg2) msg2.textContent = "تعذر تطبيق الكود، حاول مرة أخرى";
    return false;
  }
}
window.applyCouponFromInput = applyCouponFromInput;


function updateCartUI() {
  try { loadCartFromStorage(); } catch (e0) {}
  const list = Array.isArray(cart) ? cart : [];
  const count = list.reduce(function (s, i) { return s + (Number(i.qty) || 0); }, 0);
  const countEl = document.getElementById("cartCount");
  if (countEl) countEl.textContent = String(count);
  const box = document.getElementById("cartItems");
  const fields = document.getElementById("checkoutFields");
  const setTxt = function (id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  if (!list.length) {
    if (box) box.innerHTML = '<div class="empty-cart">السلة فارغة<br><small>أضف منتجات ثم أتمم الطلب</small></div>';
    setTxt("cartTotal", typeof money === "function" ? money(0) : "0 ج.م");
    setTxt("cartSubtotal", typeof money === "function" ? money(0) : "0 ج.م");
    setTxt("cartShipping", typeof money === "function" ? money(0) : "0 ج.م");
    const disc = document.getElementById("cartDiscountRow");
    if (disc) disc.hidden = true;
    const hint = document.getElementById("cartShippingHint");
    if (hint) { hint.style.display = "none"; hint.textContent = ""; }
    if (fields) fields.hidden = true;
    const checkout = document.getElementById("checkoutBtn");
    if (checkout) checkout.hidden = true;
    return;
  }
  if (fields) {
    fields.hidden = false;
    try {
      if (typeof currentUser !== "undefined" && currentUser) {
        const on = document.getElementById("orderName");
        const op = document.getElementById("orderPhone");
        const oa = document.getElementById("orderAddress");
        if (on && !on.value) on.value = currentUser.name || "";
        if (op && !op.value) op.value = currentUser.phone || "";
        if (oa && !oa.value) oa.value = currentUser.address || "";
      }
    } catch (e1) {}
  }
  const checkout = document.getElementById("checkoutBtn");
  if (checkout) checkout.hidden = false;
  if (!box) return;
  const prods = (typeof PRODUCTS !== "undefined" && PRODUCTS) ? PRODUCTS : (window.__ATHAR_PRODUCTS || []);
  box.innerHTML = list.map(function (i) {
    const p = prods.find(function (x) { return Number(x.id) === Number(i.id); });
    const colTxt = (Array.isArray(i.colors) && i.colors.length) ? i.colors.filter(Boolean).join("، ") : (i.color || "");
    const name = (i.name || (p && p.name) || ("منتج #" + i.id)) + (colTxt ? (" — لون: " + colTxt) : "");
    const image = (i.image || (p && p.image) || "");
    let lineTotal = (Number(i.price != null ? i.price : (p ? p.price : 0)) || 0) * (Number(i.qty) || 1);
    try {
      if (p && (p.isOffer || p.offerMeta) && typeof dealPriceForQty === "function") {
        const deal = dealPriceForQty(p, i.qty);
        if (deal && deal.lineTotal != null != null) lineTotal = deal.lineTotal;
      }
    } catch (e2) {}
    const unit = Number(i.price != null ? i.price : (p ? p.price : 0)) || 0;
    const img = image ? '<img src="' + String(image).replace(/"/g, "") + '" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:10px">' : "";
    return '<div class="cart-line" data-id="' + i.id + '" data-color="' + String(i.color || "").replace(/"/g, "") + '" style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border,rgba(255,255,255,.08))">' +
      img +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700;font-size:.9rem">' + name + '</div>' +
        '<div style="font-size:.8rem;opacity:.8">' + (typeof money === "function" ? money(unit) : unit) + ' × ' + (i.qty || 1) + '</div>' +
        '<div style="font-weight:700;margin-top:2px">' + (typeof money === "function" ? money(lineTotal) : lineTotal) + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:4px">' +
        '<button type="button" class="icon-btn cart-qty-btn" data-inc="' + i.id + '" data-color="' + String(colTxt || i.color || "").replace(/"/g, "") + '" aria-label="زيادة" style="min-width:36px;min-height:36px;font-size:18px;pointer-events:auto;z-index:5">+</button>' +
        '<button type="button" class="icon-btn cart-qty-btn" data-dec="' + i.id + '" data-color="' + String(colTxt || i.color || "").replace(/"/g, "") + '" aria-label="نقص" style="min-width:36px;min-height:36px;font-size:18px;pointer-events:auto;z-index:5">−</button>' +
        '<button type="button" class="icon-btn cart-qty-btn" data-remove="' + i.id + '" data-color="' + String(colTxt || i.color || "").replace(/"/g, "") + '" aria-label="حذف" style="min-width:36px;min-height:36px;pointer-events:auto;z-index:5">×</button>' +
      '</div>' +
    '</div>';
  }).join("");
  // totals
  let sub = 0;
  list.forEach(function (i) {
    const p = prods.find(function (x) { return Number(x.id) === Number(i.id); });
    let lineTotal = (Number(i.price != null ? i.price : (p ? p.price : 0)) || 0) * (Number(i.qty) || 1);
    try {
      if (p && (p.isOffer || p.offerMeta) && typeof dealPriceForQty === "function") {
        const deal = dealPriceForQty(p, i.qty);
        if (deal && deal.lineTotal != null) lineTotal = deal.lineTotal;
      }
    } catch (e3) {}
    sub += lineTotal;
  });
  setTxt("cartSubtotal", typeof money === "function" ? money(sub) : String(sub));
  // keep existing shipping/discount logic if helpers exist
  let ship = 0;
  let shipLabel = "الشحن";
  try {
    const govId = (document.getElementById("orderGov") && document.getElementById("orderGov").value) || "";
    const cenId = (document.getElementById("orderCenter") && document.getElementById("orderCenter").value) || "";
    if (typeof calcShipping === "function") {
      const info = calcShipping(sub, govId, cenId);
      if (info && typeof info === "object") {
        ship = Number(info.amount != null ? info.amount : info.fee != null ? info.fee : info) || 0;
        if (info.label) shipLabel = info.label;
        if (info.free) ship = 0;
      } else {
        ship = Number(info) || 0;
      }
    } else if (typeof calcShippingFee === "function") {
      ship = Number(calcShippingFee()) || 0;
    }
  } catch (e4) {}
  const shipLbl = document.getElementById("cartShippingLabel");
  if (shipLbl) shipLbl.textContent = shipLabel;
  const shipHint = document.getElementById("cartShippingHint");
  if (shipHint) {
    if (!document.getElementById("orderGov")?.value) {
      shipHint.style.display = "block";
      shipHint.textContent = "اختاري المحافظة لحساب الشحن";
      setTxt("cartShipping", "—");
      ship = 0;
    } else {
      shipHint.style.display = "none";
      setTxt("cartShipping", typeof money === "function" ? money(ship) : String(ship));
    }
  } else {
    setTxt("cartShipping", typeof money === "function" ? money(ship) : String(ship));
  }
  let discount = 0;
  try {
    if (typeof couponDiscount === "function") discount = Number(couponDiscount(sub)) || 0;
    else if (typeof getCartDiscount === "function") discount = Number(getCartDiscount(sub)) || 0;
  } catch (e5) {}
  const discRow = document.getElementById("cartDiscountRow");
  if (discRow) {
    discRow.hidden = !(discount > 0);
    setTxt("cartDiscount", typeof money === "function" ? money(discount) : String(discount));
  }
  try {
    const code = typeof getCouponCode === "function" ? getCouponCode() : "";
    const msg = document.getElementById("couponMsg");
    const input = document.getElementById("couponInput");
    /* لا تملأ خانة الكود تلقائيًا */
    if (msg && code && discount > 0 && typeof couponPercent === "function") {
      msg.textContent = "تم تطبيق الخصم ✓ (" + couponPercent(code) + "%)";
    }
  } catch (e6) {}
  const total = Math.max(0, sub + ship - discount);
  setTxt("cartTotal", typeof money === "function" ? money(total) : String(total));
  try {
    var n = (cart || []).reduce(function(s,i){ return s + (Number(i.qty)||1); }, 0);
    var badge = document.getElementById("bnCartCount");
    var topBadge = document.getElementById("cartCount");
    if (badge) { badge.textContent = String(n); badge.hidden = n < 1; }
    if (topBadge) { topBadge.textContent = String(n); topBadge.hidden = n < 1; }
  } catch (eBn) {}
  try { bindCartQtyButtons(); } catch (eBind) {}
}

function addToCart(id, opts) {
  opts = opts || {};
  id = Number(id);
  let p = (PRODUCTS || []).find(x => Number(x.id) === id);
  if (!p && window.__ATHAR_PRODUCTS) p = window.__ATHAR_PRODUCTS.find(x => Number(x.id) === id);
  if (!p) { toast("المنتج غير متاح"); return; }
  const colors = Array.isArray(p.colors) ? p.colors : [];
  // من الواجهة أو بدون لون: لازم صفحة المنتج لاختيار اللون
  if (colors.length && !opts.color && !opts.skipColorCheck) {
    try { toast("يجب اختيار لون المنتج"); } catch (e) {}
    window.location.href = "/product.html?id=" + encodeURIComponent(id);
    return;
  }
  // حتى بدون ألوان معرّفة — من الواجهة يفتح صفحة المنتج للتأكيد
  if (opts.fromHome && !opts.color && !opts.skipColorCheck && !opts.forceAdd) {
    window.location.href = "/product.html?id=" + encodeURIComponent(id);
    return;
  }
  if (p.available === false || (p.stock != null && Number(p.stock) <= 0)) {
    toast("المنتج غير متوفر حاليًا");
    return;
  }
  const color = opts.color || "";
  const item = cart.find(x => Number(x.id) === id && String(x.color || "") === String(color));
  if (item) {
    item.qty += 1;
    item.name = p.name;
    item.price = p.price;
    item.image = p.image;
    item.category = p.category;
    item.description = p.description || p.desc || "";
    item.color = color;
  } else {
    cart.push({
      id: id,
      qty: 1,
      name: p.name,
      price: p.price,
      image: p.image || "",
      category: p.category || "",
      description: p.description || p.desc || "",
      color: color
    });
  }
  saveCart();
  toast(color ? ("تمت إضافة " + p.name + " — " + color) : ("تمت إضافة " + p.name));
}


async function ensureCartExtras() {
  // 1) coupons
  try { await loadCoupons(true); } catch (e) {}
  // 2) shipping zones — always from JSON file as source of truth
  try {
    var r = await fetch("/shipping-zones.json?t=" + Date.now(), { cache: "no-store" });
    if (r.ok) {
      var data = await r.json();
      var zones = data.zones || data;
      if (zones && Array.isArray(zones.governorates) && zones.governorates.length) {
        SHIPPING_ZONES = zones;
        try { sessionStorage.setItem("nx_shipping_zones", JSON.stringify({ t: Date.now(), d: zones })); } catch (e) {}
      }
    }
  } catch (e2) {}
  if (!SHIPPING_ZONES || !Array.isArray(SHIPPING_ZONES.governorates) || !SHIPPING_ZONES.governorates.length) {
    try { await loadShippingZones(true); } catch (e3) {}
  }
  try { populateGovSelect(); } catch (e4) {}
  try { bindShippingSelects(); } catch (e5) {}
  try { populateCenterSelect(); } catch (e6) {}
  // bind coupon button every open (in case early bind missed)
  try {
    var btn = document.getElementById("applyCouponBtn");
    if (btn && btn.dataset.boundCoupon !== "1") {
      btn.dataset.boundCoupon = "1";
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        applyCouponFromInput();
      });
    }
    var inp = document.getElementById("couponInput");
    if (inp && inp.dataset.boundCoupon !== "1") {
      inp.dataset.boundCoupon = "1";
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); applyCouponFromInput(); }
      });
    }
  } catch (e7) {}
  try { updateCartUI(); } catch (e8) {}
  try { bindCheckoutButton(); } catch (e9) {}
  try {
    var ci = document.getElementById("couponInput");
    if (ci) ci.value = "";
    var cm = document.getElementById("couponMsg");
    if (cm) cm.textContent = "";
  } catch (e10) {}
}

async function openCart() {
  try { loadCartFromStorage(); } catch (e) {}
  var overlay = document.getElementById("cartOverlay");
  var drawer = document.getElementById("cartDrawer");
  if (overlay) overlay.classList.add("open");
  if (drawer) drawer.classList.add("open");
  document.body.style.overflow = "hidden";
  try { updateCartUI(); } catch (e2) {}
  try { await ensureCartExtras(); } catch (e3) { console.warn(e3); }
  try { bindCheckoutButton(); } catch (e4) {}
  try { bindCartQtyButtons(); } catch (e5) {}
}

function clearCartCoupon() {
  try { sessionStorage.removeItem("nx_coupon_code"); } catch (e) {}
  try { localStorage.removeItem("nx_coupon_code"); } catch (e2) {}
  try {
    var input = document.getElementById("couponInput");
    if (input) input.value = "";
    var msg = document.getElementById("couponMsg");
    if (msg) msg.textContent = "";
    var discRow = document.getElementById("cartDiscountRow");
    if (discRow) discRow.hidden = true;
    var disc = document.getElementById("cartDiscount");
    if (disc) disc.textContent = typeof money === "function" ? money(0) : "0 ج.م";
  } catch (e3) {}
  try { if (typeof updateCartUI === "function") updateCartUI(); } catch (e4) {}
  try { if (window.__atharRefreshCartTotals) window.__atharRefreshCartTotals(); } catch (e5) {}
}

function closeCart() {
  try { clearCartCoupon(); } catch (eClear) {}
  try {
    const overlay = document.getElementById("cartOverlay");
    const drawer = document.getElementById("cartDrawer");
    if (overlay) { overlay.classList.remove("open"); overlay.style.visibility = ""; overlay.style.opacity = ""; }
    if (drawer) { drawer.classList.remove("open"); drawer.style.transform = ""; }
    document.body.style.overflow = "";
    document.body.classList.remove("drawer-open");
  } catch (e) { console.warn(e); }
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
  try {
    const overlay = document.getElementById("authOverlay");
    const modal = document.getElementById("authModal");
    if (overlay) { overlay.classList.add("open"); overlay.style.display = "block"; }
    if (modal) { modal.classList.add("open"); modal.style.display = "block"; }
    document.body.style.overflow = "hidden";
    switchAuth(tab);
  } catch (e) { console.warn(e); }
}
function closeAuth() {
  try {
    const overlay = document.getElementById("authOverlay");
    const modal = document.getElementById("authModal");
    if (overlay) { overlay.classList.remove("open"); overlay.style.display = "none"; }
    if (modal) { modal.classList.remove("open"); modal.style.display = "none"; }
    document.body.style.overflow = "";
  } catch (e) { console.warn(e); }
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
  try {
    const overlay = document.getElementById("profileOverlay");
    const modal = document.getElementById("profileModal");
    if (overlay) overlay.classList.remove("open");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = "";
  } catch (e) { console.warn(e); }
}

// Events
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add], .add-btn");
  if (add) {
    e.preventDefault();
    e.stopPropagation();
    const id = Number(add.getAttribute("data-add") || add.dataset.add);
    if (id) addToCart(id, { fromHome: true });
    return;
  }
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
    e.preventDefault();
    e.stopPropagation();
    try { if (typeof loadCartFromStorage === "function") loadCartFromStorage(); } catch (e0) {}
    const it = findCartLine(inc.getAttribute("data-inc") || inc.dataset.inc, inc.getAttribute("data-color") || inc.dataset.color || "");
    if (it) {
      it.qty = (Number(it.qty) || 1) + 1;
      saveCart();
      try { if (window.__atharRefreshCartTotals) window.__atharRefreshCartTotals(); } catch (e1) {}
    }
    return;
  }
  const dec = e.target.closest("[data-dec]");
  if (dec) {
    e.preventDefault();
    e.stopPropagation();
    try { if (typeof loadCartFromStorage === "function") loadCartFromStorage(); } catch (e0) {}
    const id = Number(dec.getAttribute("data-dec") || dec.dataset.dec);
    const col = dec.getAttribute("data-color") || dec.dataset.color || "";
    const it = findCartLine(id, col);
    if (it) {
      it.qty = (Number(it.qty) || 1) - 1;
      if (it.qty <= 0) {
        cart = (cart || []).filter(function (x) { return x !== it; });
      }
      saveCart();
      try { if (window.__atharRefreshCartTotals) window.__atharRefreshCartTotals(); } catch (e1) {}
    }
    return;
  }
  const rm = e.target.closest("[data-remove]");
  if (rm) {
    e.preventDefault();
    e.stopPropagation();
    try { if (typeof loadCartFromStorage === "function") loadCartFromStorage(); } catch (e0) {}
    const it = findCartLine(rm.getAttribute("data-remove") || rm.dataset.remove, rm.getAttribute("data-color") || rm.dataset.color || "");
    if (it) {
      cart = (cart || []).filter(function (x) { return x !== it; });
      saveCart();
      try { if (window.__atharRefreshCartTotals) window.__atharRefreshCartTotals(); } catch (e1) {}
    }
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

function bindRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const name = (document.getElementById("regName") && document.getElementById("regName").value || "").trim();
      const phone = (document.getElementById("regPhone") && document.getElementById("regPhone").value || "").trim();
      const email = (document.getElementById("regEmail") && document.getElementById("regEmail").value || "").trim().toLowerCase();
      const password = (document.getElementById("regPassword") && document.getElementById("regPassword").value) || "";
      if (!name) return toast("اكتب الاسم");
      if (!phone || phone.replace(/\D/g, "").length < 10) return toast("اكتب رقم هاتف صحيح");
      if (!email || email.indexOf("@") < 0) return toast("اكتب بريد إلكتروني صحيح");
      if (!password || password.length < 4) return toast("كلمة المرور ٤ أحرف على الأقل");
      let usersDB = [];
      try { usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]"); } catch (e0) { usersDB = []; }
      if (!Array.isArray(usersDB)) usersDB = [];
      if (usersDB.some(function (u) { return (u.email || "").toLowerCase() === email; })) return toast("هذا البريد مسجّل بالفعل");
      const avatar = (typeof regAvatar !== "undefined" && regAvatar) ? regAvatar : null;
      const user = { name: name, phone: phone, email: email, password: password, address: "", avatar: avatar, createdAt: new Date().toISOString() };
      usersDB.push(user);
      localStorage.setItem("nx_users", JSON.stringify(usersDB));
      currentUser = { name: name, phone: phone, email: email, address: "", avatar: avatar };
      try { localStorage.setItem("nx_user", JSON.stringify(currentUser)); } catch (e1) {}
      try { if (typeof updateUserUI === "function") updateUserUI(); } catch (e2) {}
      try { if (typeof closeAuth === "function") closeAuth(); } catch (e3) {}
      toast("تم إنشاء الحساب بنجاح");
      try {
        if (typeof notifyAdmin === "function") {
          notifyAdmin("register", "🆕 حساب جديد\nالاسم: " + name + "\nالهاتف: " + phone + "\nالبريد: " + email);
        }
      } catch (e4) {}
    } catch (err) {
      console.warn(err);
      toast("تعذر إنشاء الحساب، حاولي مرة أخرى");
    }
  });
}
try { bindRegisterForm(); } catch (eR) {}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { try { bindRegisterForm(); } catch (e) {} });
} else {
  try { bindRegisterForm(); } catch (e) {}
}






const __loginForm = document.getElementById("loginForm"); if(__loginForm) __loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = ((document.getElementById("loginEmail") && document.getElementById("loginEmail").value) || "").trim().toLowerCase();
  const password = (document.getElementById("loginPassword") && document.getElementById("loginPassword").value) || "";
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
  const msg = "تسجيل دخول ATHAR | أثر" + nl + nl + "الاسم: " + (user.name || "-") + nl + "الهاتف: " + (user.phone || "-") + nl + "البريد: " + (user.email || "-") + nl + "الوقت: " + new Date().toLocaleString("ar-EG");
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
  const govId = (document.getElementById("orderGov")?.value || "").trim();
    const centerId = (document.getElementById("orderCenter")?.value || "").trim();
    if (getShippingConfig().enabled) {
      if (!govId) { alert("اختاري المحافظة"); return; }
      if (!centerId) { alert("اختاري المركز / الحي"); return; }
    }
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
  const msg = "تحديث بروفايل ATHAR | أثر" + nl + nl + "الاسم: " + name + nl + "الهاتف: " + phone + nl + "البريد: " + email + nl + "العنوان: " + (address || "-");
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
  if (idEl) idEl.textContent = orderId || "—";
  const msg = document.getElementById("orderSuccessMsg");
  if (msg) msg.innerHTML = "شكرًا لطلبكِ من ATHAR | أثر.<br>هنتواصل معاكِ قريبًا لتأكيد الطلب وترتيب التوصيل.";
  const ov = document.getElementById("orderSuccessOverlay");
  const md = document.getElementById("orderSuccessModal");
  if (ov) { ov.classList.add("open"); ov.style.display = "block"; }
  if (md) { md.classList.add("open"); md.style.display = "block"; }
  document.body.style.overflow = "hidden";
  try { bindOrderSuccessClose(); } catch (e) {}
}
window.showOrderSuccess = showOrderSuccess;
function closeOrderSuccess() {
  try {
    var ov = document.getElementById("orderSuccessOverlay");
    var md = document.getElementById("orderSuccessModal");
    if (ov) { ov.classList.remove("open"); ov.style.display = "none"; }
    if (md) { md.classList.remove("open"); md.style.display = "none"; }
    document.body.style.overflow = "";
    try { if (typeof closeCart === "function") closeCart(); } catch (e0) {}
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e1) { try { window.scrollTo(0, 0); } catch (e2) {} }
  } catch (err) { console.warn(err); }
}
window.closeOrderSuccess = closeOrderSuccess;
function bindOrderSuccessClose() {
  var btn = document.getElementById("orderSuccessClose");
  if (btn) {
    btn.onclick = function (e) {
      try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (e0) {}
      closeOrderSuccess();
      return false;
    };
  }
  var ov = document.getElementById("orderSuccessOverlay");
  if (ov) {
    ov.onclick = function () { closeOrderSuccess(); };
  }
}
try { bindOrderSuccessClose(); } catch (e) {}
document.addEventListener("DOMContentLoaded", function () { try { bindOrderSuccessClose(); } catch (e) {} });


window.__atharCheckoutRunner = async function () {
  try { if (typeof loadCartFromStorage === 'function') loadCartFromStorage(); } catch(e){}
  const btn = document.getElementById("checkoutBtn");
  if (btn && (btn.disabled || btn.dataset.submitting === "1")) return;
  try {
    if (!cart || !cart.length) { try { loadCartFromStorage(); } catch(e){} }
    if (!cart || !cart.length) { if (typeof toast==="function") toast("السلة فارغة"); else alert("السلة فارغة"); return; }
    try {
      const cfg = window.siteConfig || {};
      if (cfg.storeOpen === false) {
        return toast(cfg.storeClosedMessage || "المتجر متوقف مؤقتًا");
      }
    } catch (e0) {}
    const name = (document.getElementById("orderName")?.value || "").trim();
    let phoneRaw = (document.getElementById("orderPhone")?.value || "");
    try { if (typeof normalizePhone === "function") phoneRaw = normalizePhone(phoneRaw); } catch(ePh){}
    const phone = String(phoneRaw).replace(/[^0-9]/g, "");
    const address = (document.getElementById("orderAddress")?.value || "").trim();
    const note = (document.getElementById("orderNote")?.value || "").trim();
    const payMethod = (document.querySelector('input[name="payMethod"]:checked')?.value || "cod");
    const govId = (document.getElementById("orderGov")?.value || "").trim();
    const centerId = (document.getElementById("orderCenter")?.value || "").trim();
    if (!phone || phone.length < 10 || phone.length > 15) { if (typeof toast==="function") toast("اكتب رقم هاتف صحيح"); else alert("اكتب رقم هاتف صحيح"); return; }
    if (!address) { if (typeof toast==="function") toast("اكتب عنوان التوصيل"); else alert("اكتب عنوان التوصيل"); return; }
    try {
      if (typeof getShippingConfig === "function" && getShippingConfig().enabled) {
        if (!govId) return toast("اختاري المحافظة");
        if (!centerId) return toast("اختاري المركز / الحي");
      }
    } catch (e) {}
    // اللون إجباري لو المنتج له ألوان
    for (const i of cart) {
      const p = PRODUCTS.find(x => Number(x.id) === Number(i.id));
      const hasColors = p && Array.isArray(p.colors) && p.colors.length > 0;
      const qty = Number(i.qty) || 1;
      const picked = Array.isArray(i.colors) ? i.colors.filter(Boolean) : ((i.color || i.selectedColor) ? String(i.color || i.selectedColor).split(/،|,/).map(s=>s.trim()).filter(Boolean) : []);
      if (hasColors && picked.length === 0) {
        return toast("اختاري لون المنتج قبل إتمام الطلب: " + (i.name || p.name || ""));
      }
    }
    const btn = $("#checkoutBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري إرسال الطلب..."; }
    const orderId = "NX-" + Date.now().toString().slice(-8);
    const richItems = cart.map(i => {
      const p = PRODUCTS.find(x => Number(x.id) === Number(i.id));
      const qty = Number(i.qty) || 1;
      const unit = Number(i.price != null ? i.price : (p ? p.price : 0));
      const deal = (p && (p.isOffer || p.offerMeta)) ? dealPriceForQty(p, qty) : null;
      const lineTotal = deal ? deal.lineTotal : (unit * qty);
      const unitEff = qty ? (lineTotal / qty) : unit;
      return {
        id: Number(i.id),
        name: i.name || (p && p.name) || ("منتج #" + i.id),
        price: unitEff,
        lineTotal,
        dealLabel: deal ? (deal.dealLabel || "") : "",
        qty,
        image: i.image || (p && p.image) || "",
        category: i.category || (p && p.category) || "",
        description: i.description || (p && (p.description || p.desc)) || "",
        color: i.color || i.selectedColor || "",
        colors: Array.isArray(i.colors) ? i.colors : ((i.color || i.selectedColor) ? String(i.color || i.selectedColor).split(/،|,/).map(s=>s.trim()).filter(Boolean) : []),
        specs: (p && p.specs) || {},
        offerMeta: (p && p.offerMeta) || null
      };
    });
    const subtotal = richItems.reduce((s, it) => s + Number(it.lineTotal != null ? it.lineTotal : (it.price * it.qty)), 0);
    const shipInfo = calcShipping(subtotal, document.getElementById("orderGov")?.value, document.getElementById("orderCenter")?.value);
    const shipping = shipInfo.amount;
    const discount = couponDiscount(subtotal);
    const total = subtotal - discount + shipping;
    const lines = richItems.map(it => {
      const col = it.color ? (" | اللون: " + it.color) : "";
      const deal = it.dealLabel ? (" | عرض: " + it.dealLabel) : "";
      return "• " + it.name + col + deal + " × " + it.qty + " = " + Number(it.lineTotal != null ? it.lineTotal : (it.price * it.qty)).toLocaleString("ar-EG") + " ج.م";
    });
    if (btn) { btn.disabled = true; btn.dataset.submitting = "1"; btn.textContent = "جاري تنفيذ الطلب..."; }
    const orderRecord = {
      id: orderId,
      at: new Date().toISOString(),
      subtotal,
      discount,
      coupon: getCouponCode(),
      shipping,
      customer: {
        name: name || "عميل",
        phone,
        email: (currentUser && currentUser.email) || "",
        address,
        note,
        governorate: (typeof shipInfo !== "undefined" && shipInfo.govName) || (document.getElementById("orderGov")?.selectedOptions?.[0]?.text || ""),
        center: (typeof shipInfo !== "undefined" && shipInfo.centerName) || (document.getElementById("orderCenter")?.selectedOptions?.[0]?.text || ""),
        governorateId: document.getElementById("orderGov")?.value || "",
        centerId: document.getElementById("orderCenter")?.value || ""
      },
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
      let saveData = null;
      let saveRes = null;
      // 1) مسار حفظ الطلب المخصص
      try {
        saveRes = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderRecord })
        });
        try { saveData = await saveRes.json(); } catch (e2) { saveData = null; }
      } catch (e1) { saveRes = null; saveData = null; }
      // 2) احتياطي: api/admin
      if (!saveRes || !saveRes.ok || !saveData || saveData.ok === false) {
        try {
          saveRes = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save_order", order: orderRecord })
          });
          try { saveData = await saveRes.json(); } catch (e3) { saveData = null; }
        } catch (e4) { saveRes = null; saveData = null; }
      }
      if (!saveRes || !saveRes.ok || !saveData || saveData.ok === false) {
        const err = (saveData && saveData.error) || (saveRes ? ("HTTP " + saveRes.status) : "network");
        toast("تعذر حفظ الطلب: " + err);
        if (btn) { btn.disabled = false; btn.dataset.submitting = ""; btn.textContent = "إتمام الطلب الآن"; }
        return;
      }
    } catch (e) {
      toast("تعذر الاتصال لحفظ الطلب — حاول مرة أخرى");
      if (btn) { btn.disabled = false; btn.dataset.submitting = ""; btn.textContent = "إتمام الطلب الآن"; }
      return;
    }
    if (payMethod === "card") {
      try {
        const payRes = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "card", order: orderRecord }) });
        const payData = await payRes.json();
        if (payData.ok && payData.url) { toast("جاري التحويل لصفحة الدفع..."); window.location.href = payData.url; return; }
        toast(payData.error || "الدفع بالبطاقة غير متاح — جرّب عند الاستلام");
      } catch (e) { toast("تعذر فتح الدفع بالبطاقة"); }
    }
    try { await notifyAdmin("order", "", { order: orderRecord }); } catch (e) {}
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/notify", new Blob([JSON.stringify({ type: "order", order: orderRecord })], { type: "application/json" }));
      }
    } catch (eBe) {}
    cart = []; saveCart(); closeCart();
    if ($("#orderNote")) $("#orderNote").value = "";
    showOrderSuccess(orderId);
    toast("تم تأكيد طلبك بنجاح");
    if (btn) { btn.disabled = true; btn.dataset.submitting = "1"; btn.textContent = "تم إرسال الطلب"; }
  } catch (err) {
    console.error(err);
    toast("حصل خطأ أثناء إتمام الطلب");
    const btn = $("#checkoutBtn");
    if (btn) { btn.disabled = false; btn.dataset.submitting = ""; btn.textContent = "إتمام الطلب الآن"; }
  }
};
try { window.atharPlaceOrder = function(ev){ try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){} return window.__atharCheckoutRunner && window.__atharCheckoutRunner(); }; } catch(e) {}
function bindCheckoutButton() {
  var btn = document.getElementById("checkoutBtn");
  if (!btn) return;
  btn.hidden = false;
  btn.disabled = false;
  btn.style.pointerEvents = "auto";
  btn.onclick = function (ev) {
    try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
    try { if (window.__atharCheckoutRunner) window.__atharCheckoutRunner(); } catch (err) { console.warn(err); }
    return false;
  };
}
try { bindCheckoutButton(); } catch (e) {}
document.addEventListener("DOMContentLoaded", function(){ try { bindCheckoutButton(); } catch(e){} });



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
  const cached = nxCacheGet("nx_categories");
  if (cached && Array.isArray(cached.categories)) {
    CATEGORIES = (cached.categories || []).filter(c => c && c.visible !== false);
    BRANDS = Array.isArray(cached.brands) ? cached.brands : [];
  }
  const urls = [
    "/api/catalog?type=categories",
    "/categories.json"
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "default" });
      if (!r.ok) continue;
      const data = await r.json();
      const allCats = Array.isArray(data.categories) ? data.categories : (Array.isArray(data) ? data : []);
      if (url.indexOf("/api/catalog") === 0 && data.ok === true) {
        CATEGORIES = allCats.filter(c => c && c.visible !== false);
        BRANDS = Array.isArray(data.brands) ? data.brands : [];
        nxCacheSet("nx_categories", { categories: allCats, brands: BRANDS });
        return;
      }
      if (!allCats.length) continue;
      CATEGORIES = allCats.filter(c => c && c.visible !== false);
      BRANDS = Array.isArray(data.brands) ? data.brands : [];
      nxCacheSet("nx_categories", { categories: allCats, brands: BRANDS });
      return;
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
  if (!p) return false;
  if (p.hidden === true || p.active === false) return false;
  if (activeCategory && String(p.category || "") !== String(activeCategory)) return false;
  if (activeSubcategory && String(p.subcategory || "") !== String(activeSubcategory)) {
    if (!(activeSubcategory === "mobiles" && (p.tags || []).includes("phone-accessory"))) return false;
  }
  if (activeBrand && String(p.brand || "") !== String(activeBrand)) return false;
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
function setShopFilter(cat, sub, opts) {
  opts = opts || {};
  activeCategory = cat || "";
  activeSubcategory = sub || "";
  activeBrand = "";
  try { renderSubcatsBar(); } catch (e) {}
  try { renderShop(); } catch (e) {}
  try { renderCatNav(); } catch (e) {}
  const title = document.getElementById("shopTitle");
  const subEl = document.getElementById("shopSubtitle");
  const c = getCat(activeCategory);
  if (title) {
    if (c && activeSubcategory) {
      const s = (c.subs || []).find(x => x.id === activeSubcategory);
      title.textContent = (s && s.name_ar) || c.name_ar || "المتجر";
    } else if (c) title.textContent = c.name_ar || "المتجر";
    else title.textContent = "كل المنتجات";
  }
  if (subEl) subEl.textContent = activeCategory ? "تصفية حسب القسم" : "كل المنتجات";
  if (opts.scroll) {
    const shop = document.getElementById("shop");
    if (shop) shop.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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
        <img src="${c.image || ""}" alt="" loading="lazy" decoding="async" width="400" height="400" onerror="this.style.display='none'" />
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
let _renderShopTimer = null;
function renderShop() {
  // homepage builder limit
  var __hpShopLimit = typeof atharSectionLimit === "function" ? atharSectionLimit("shop") : null;

  let pool = Array.isArray(PRODUCTS) ? PRODUCTS : [];
  if (!pool.length && window.__ATHAR_PRODUCTS) pool = window.__ATHAR_PRODUCTS;
  let list = pool.filter(function(p){ try { return productMatches(p); } catch(e){ return !!p && !p.hidden; } });
  // لو الفلتر رجّع فاضي وفي منتجات — اعرض الكل (عشان المتجر ميفضلش فاضي)
  if (!list.length && pool.length) {
    list = pool.filter(function(p){ return p && p.hidden !== true && p.active !== false; });
  }
  list = sortedProducts(list);
  if (__hpShopLimit && list.length > __hpShopLimit) list = list.slice(0, __hpShopLimit);
  const grid = document.getElementById("shopGrid");
  const empty = document.getElementById("shopEmpty");
  if (grid) {
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">لا توجد منتجات حالياً — حدّثي الصفحة أو أضيفي من الأدمن</div>';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      try { renderGrid(grid, list); } catch (eG) {
        grid.innerHTML = list.map(function(p){
          return '<article class="product-card"><a href="/product.html?id='+p.id+'"><img src="'+(p.image||'')+'" alt=""/><h3>'+(p.name||'')+'</h3></a></article>';
        }).join("");
      }
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
        setShopFilter(cat, sub, { scroll: true });
        if (menu) menu.hidden = true;
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


/* ===== AI Chat (WhatsApp-style) — interactive ===== */
let aiBusy = false;
const aiHistory = [];

function openAiChat() {
  const overlay = document.getElementById("aiOverlay");
  const panel = document.getElementById("aiPanel");
  if (panel && panel.classList.contains("open")) {
    closeAiChat();
    return;
  }
  if (overlay) overlay.classList.add("open");
  if (panel) panel.classList.add("open");
  const box = document.getElementById("aiMessages");
  if (box && !box.dataset.welcomed) {
    box.dataset.welcomed = "1";
    // keep existing welcome if any, else add
    if (!box.children.length) {
      const name = window.__SITE_NAME__ || "ATHAR | أثر";
      appendAiMsg("bot", "أهلاً أهلاً 😊 أنا نورا… قولي بتفكري في إيه؟ شنطة، هدوم، حذاء، ولا لسه بتلفّي؟", {
        chips: [
          { label: "👜 شنطة", q: "عايزة شنطة حريمي أنيقة" },
          { label: "👗 ملابس", q: "عايزة إطلالة كاجوال" },
          { label: "🔥 عروض", q: "فيه عروض؟" }
        ]
      });
    }
  }
  setTimeout(() => document.getElementById("aiInput")?.focus(), 200);
}
function closeAiChat() {
  document.getElementById("aiOverlay")?.classList.remove("open");
  document.getElementById("aiPanel")?.classList.remove("open");
  document.body.style.overflow = "";
}

function appendAiMsg(role, text, opts) {
  opts = opts || {};
  const box = document.getElementById("aiMessages");
  if (!box) return null;
  const wrap = document.createElement("div");
  wrap.className = "ai-msg " + (role === "user" ? "user" : "bot");
  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";
  const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const safe = String(text || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g, "<br>");
  bubble.innerHTML = safe + '<span class="ai-time">' + time + "</span>";
  wrap.appendChild(bubble);
  if (opts.chips && opts.chips.length) {
    const row = document.createElement("div");
    row.className = "ai-follow-chips";
    opts.chips.forEach(ch => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ai-chip ai-follow";
      b.textContent = ch.label;
      b.addEventListener("click", () => {
        const input = document.getElementById("aiInput");
        if (input) input.value = ch.q || ch.label;
        handleAiSend();
      });
      row.appendChild(b);
    });
    wrap.appendChild(row);
  }
  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
  return wrap;
}

function showAiTyping() {
  const box = document.getElementById("aiMessages");
  if (!box) return;
  removeAiTyping();
  const div = document.createElement("div");
  div.className = "ai-msg bot ai-typing";
  div.id = "aiTyping";
  div.innerHTML = '<div class="ai-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
function removeAiTyping() {
  document.getElementById("aiTyping")?.remove();
}

function suggestFollowChips(userText, reply) {
  const t = (String(userText) + " " + String(reply)).toLowerCase();
  const chips = [];
  if (/شنط|شنطة|bag/.test(t)) {
    chips.push({ label: "💼 بيج", q: "عايزة شنطة بيج أنيقة" });
    chips.push({ label: "🖤 أسود", q: "شنطة سوداء كاجوال" });
    chips.push({ label: "💰 تحت 500", q: "شنطة تحت 500 جنيه" });
  } else if (/حذاء|شوز|كوتشي/.test(t)) {
    chips.push({ label: "👟 رياضي", q: "حذاء رياضي مريح" });
    chips.push({ label: "👠 سهرة", q: "حذاء سهرة أنيق" });
  } else if (/عرض|خصم/.test(t)) {
    chips.push({ label: "🔥 عروض تانية", q: "إيه العروض المتاحة؟" });
    chips.push({ label: "🛒 ازاي أطلب", q: "ازاي أطلب من الموقع؟" });
  } else if (/طلب|سله|سلة|اوردر|واتس/.test(t)) {
    chips.push({ label: "📞 واتساب", q: "رقم الواتساب كام؟" });
    chips.push({ label: "🎨 الألوان", q: "الألوان إجبارية قبل الطلب؟" });
  } else {
    chips.push({ label: "👜 شنط", q: "وريني شنط حلوة" });
    chips.push({ label: "👗 ملابس", q: "عايزة ملابس كاجوال" });
    chips.push({ label: "🔥 عروض", q: "فيه عروض؟" });
  }
  chips.push({ label: "💬 ميزانيتي", q: "ميزانيتي 400 جنيه رشحيلي" });
  return chips.slice(0, 4);
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
  const sendBtn = document.getElementById("aiSend");
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "..."; }
  showAiTyping();
  try {
    const catalog = (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS) ? PRODUCTS : [])
      .filter(p => !p.hidden)
      .slice(0, 40)
      .map(p => ({
        id: p.id, name: p.name, price: p.price, oldPrice: p.oldPrice,
        category: p.category, isOffer: p.isOffer, brand: p.brand
      }));
    const res = await fetch("/api/chat", {
      method: "POST",
      signal: (typeof AbortSignal !== "undefined" && AbortSignal.timeout) ? AbortSignal.timeout(12000) : undefined,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: aiHistory.slice(-12),
        catalog,
        siteName: window.__SITE_NAME__ || "ATHAR | أثر"
      })
    });
    const data = await res.json().catch(() => ({}));
    removeAiTyping();
    const reply = data.reply || "حاضر 😅 قولي تاني بصيغة أوضح وأنا معاكِ.";
    appendAiMsg("bot", reply, { chips: suggestFollowChips(text, reply) });
    aiHistory.push({ role: "assistant", content: reply });
  } catch (e) {
    removeAiTyping();
    appendAiMsg("bot", "الاتصال اتقطع لحظة 😅 جرّبي تاني أو واتساب من الزر الأخضر.", {
      chips: [
        { label: "🔁 حاول تاني", q: text },
        { label: "📞 رقم الواتساب", q: "رقم الواتساب كام؟" }
      ]
    });
  } finally {
    aiBusy = false;
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "إرسال"; }
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

document.getElementById("aiChips")?.addEventListener("click", function (e) {
  const chip = e.target.closest(".ai-chip");
  if (!chip) return;
  const q = chip.getAttribute("data-q") || chip.textContent || "";
  const input = document.getElementById("aiInput");
  if (input && q) { input.value = q; handleAiSend(); }
});
// backward compat if old id
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


function dedupeProducts(list) {
  const arr = Array.isArray(list) ? list : [];
  const seenIds = new Set();
  const seenNames = new Set();
  const out = [];
  arr.forEach(function(p) {
    if (!p || p.hidden) return;
    const id = String(p.id);
    if (seenIds.has(id)) return;
    const name = String(p.name || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (name && seenNames.has(name)) return;
    seenIds.add(id);
    if (name) seenNames.add(name);
    out.push(p);
  });
  return out;
}
function minOrderQty(p) {
  if (!p) return 1;
  const tiers = p.offerMeta && Array.isArray(p.offerMeta.tiers) ? p.offerMeta.tiers : [];
  if (tiers.length) {
    const qs = tiers.map(function(t) { return Number(t.qty) || 0; }).filter(function(q) { return q > 0; });
    if (qs.length) return Math.min.apply(null, qs);
  }
  if (p.isOffer) return 2;
  const n = String(p.name || "");
  if (/قطعتين|2 قطعه|2 قطعة|عرض القطع/i.test(n)) return 2;
  return 1;
}

async function loadProducts(force) {
  // مزامنة مع الأدمن: كاش سريع + تحديث من الشبكة دائمًا
  let mustFresh = !!force;
  try {
    const bust = localStorage.getItem("nx_catalog_bust");
    const lastSeen = sessionStorage.getItem("nx_bust_seen") || "";
    if (bust && bust !== lastSeen) {
      mustFresh = true;
      sessionStorage.setItem("nx_bust_seen", bust);
    }
  } catch (e) {}
  if (mustFresh) {
    try { sessionStorage.removeItem("nx_products"); } catch (e) {}
  }
  let servedCache = false;
  if (!mustFresh) {
    const cached = nxCacheGet("nx_products");
    if (cached && Array.isArray(cached) && cached.length) {
      PRODUCTS = dedupeProducts(cached.filter(p => p && !p.hidden && p.active !== false));
      try { window.__ATHAR_PRODUCTS = PRODUCTS; } catch (e0) {}
      servedCache = true;
      // لا نرجع هنا — نكمّل fetch بالخلفية ونحدّث الواجهة لو تغيّر شيء
    }
  }
  const t = Date.now();
  const urls = ["/api/catalog?type=products&t=" + t, "/products.json?t=" + t];
  let best = null;
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: mustFresh ? "no-store" : "default", headers: mustFresh ? { "Cache-Control": "no-cache" } : {} });
      if (!r.ok) continue;
      const data = await r.json();
      let list = Array.isArray(data) ? data : (data.products || []);
      if (!Array.isArray(list)) continue;
      list = list.filter(p => p && p.hidden !== true && p.active !== false);
      if (!best || list.length >= best.length) best = list;
      if (best && best.length >= 8 && url.indexOf("/api/catalog") === 0 && !mustFresh) break;
    } catch (e) {}
  }
  if ((!best || !best.length) && !mustFresh) {
    try {
      const r = await fetch("/products.json?t=" + t, { cache: "default" });
      if (r.ok) {
        const data = await r.json();
        let list = Array.isArray(data) ? data : (data.products || []);
        best = (list || []).filter(p => p && p.hidden !== true && p.active !== false);
      }
    } catch (e) {}
  }
  if (best && best.length) {
    PRODUCTS = dedupeProducts(best);
    try { window.PRODUCTS = PRODUCTS; } catch (eW2) {}
    try { nxCacheSet("nx_products", PRODUCTS); } catch (eC) {}
    try { window.__ATHAR_PRODUCTS = PRODUCTS; } catch (e) {}
  }
  PRODUCTS = Array.isArray(PRODUCTS) ? PRODUCTS : [];
  try { window.PRODUCTS = PRODUCTS; } catch (eW) {}
  try { if (typeof startHeroProductRotate === "function") startHeroProductRotate(window.siteConfig || window.__SITE_CONFIG__ || {}); } catch (eHR) {}
  try { if (typeof renderBundleSection === "function") renderBundleSection(); } catch (eBR) {}
  try {
    if (typeof renderShop === "function") renderShop();
    if (typeof renderBundleSection === "function") renderBundleSection();
    else if (typeof renderBundles === "function") renderBundles();
    if (typeof renderAll === "function" && PRODUCTS.length) {
      // لا تعيد renderAll كامل لو هتكرر — فقط تأكيد المتجر
    }
  } catch (eR) { console.warn(eR); }
  return PRODUCTS;
}

// عند رجوع التبويب أو إشارة من الأدمن — حدّث المنتجات فورًا
(function bindStoreAdminSync() {
  let lastBust = "";
  try { lastBust = localStorage.getItem("nx_catalog_bust") || ""; } catch (e) {}
  async function softRefresh() {
    try {
      const bust = localStorage.getItem("nx_catalog_bust") || "";
      if (bust && bust !== lastBust) {
        lastBust = bust;
        await loadProducts(true);
        try {
          if (typeof renderShop === "function") renderShop();
          else if (typeof renderHome === "function") renderHome();
          else if (typeof renderBundleSection === "function") renderBundleSection();
        } catch (e2) {}
        try { if (typeof startHeroProductRotate === "function") startHeroProductRotate(window.siteConfig || {}); } catch (e3) {}
      }
    } catch (e) {}
  }
  window.addEventListener("storage", function(ev) {
    if (ev && (ev.key === "nx_catalog_bust" || ev.key === "nx_products_tick")) softRefresh();
  });
  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "visible") softRefresh();
  });
  window.addEventListener("focus", softRefresh);
  setInterval(softRefresh, 60000);
})();



function ensureHomeOnStart() {
  try {
    ["authOverlay","authModal","profileOverlay","profileModal","cartOverlay","cartDrawer","aiOverlay","aiPanel","productOverlay","productModal"].forEach(id => {
      document.getElementById(id)?.classList.remove("open");
    });
    document.body.style.overflow = "";
    // امسح هاش الأقسام عشان متعملش سكرول لتحت
    if (location.hash === "#cats" || location.hash === "#categories" || location.hash === "#shop" || location.hash === "#best") {
      history.replaceState({}, "", "/");
    } else if (!location.hash || location.hash === "#" || location.hash === "#home") {
      history.replaceState({}, "", "/");
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch (e) {}
}



/* Hero rotate globals at top */
function stopHeroProductRotate() {
  if (__heroRotateTimer) {
    clearInterval(__heroRotateTimer);
    clearTimeout(__heroRotateTimer);
    __heroRotateTimer = null;
  }
}
function startHeroProductRotate(config) {
  stopHeroProductRotate();
  config = config || window.siteConfig || window.__SITE_CONFIG__ || {};
  // The reference artwork is the source of truth. Product rotation is opt-in
  // so an early call made before site-config.json arrives cannot replace it.
  const enabled = config.heroRotateFromProducts === true;
  if (!enabled) return;
  const secs = Math.max(2, Math.min(60, Number(config.heroRotateSeconds) || 3));

  function imgOf(p) {
    if (!p) return "";
    if (p.image && String(p.image).trim()) return String(p.image).trim();
    if (Array.isArray(p.images) && p.images[0]) return String(p.images[0]).trim();
    return "";
  }
  function okSrc(src) {
    if (!src) return false;
    src = String(src);
    if (/^https?:\/\//i.test(src)) return true;
    if (src.indexOf("//") === 0) return true;
    if (src.charAt(0) === "/") return true;
    if (src.indexOf("data:image") === 0) return true;
    return false;
  }

  const pool = (Array.isArray(PRODUCTS) && PRODUCTS.length)
    ? PRODUCTS
    : (Array.isArray(window.__ATHAR_PRODUCTS) ? window.__ATHAR_PRODUCTS : []);

  let imgs = pool
    .filter(function(p) { return p && p.hidden !== true && p.active !== false && okSrc(imgOf(p)); })
    .map(function(p) { return { src: imgOf(p), name: p.name || "", id: p.id }; });

  [config.heroImage1, config.heroImage2].forEach(function(src) {
    if (okSrc(src) && !imgs.some(function(x){ return x.src === src; })) {
      imgs.push({ src: src, name: "", id: null });
    }
  });
  try {
    const i1 = document.getElementById("heroImg1");
    const i2 = document.getElementById("heroImg2");
    if (i1 && okSrc(i1.getAttribute("src") || i1.src) && !imgs.some(function(x){ return x.src === (i1.getAttribute("src")||i1.src); }))
      imgs.push({ src: i1.getAttribute("src") || i1.src, name: "", id: null });
    if (i2 && okSrc(i2.getAttribute("src") || i2.src) && !imgs.some(function(x){ return x.src === (i2.getAttribute("src")||i2.src); }))
      imgs.push({ src: i2.getAttribute("src") || i2.src, name: "", id: null });
  } catch (e) {}

  if (imgs.length < 2) {
    // أعد المحاولة بعد ما المنتجات تتحمل
    __heroRotateTimer = setTimeout(function() { startHeroProductRotate(config); }, 2000);
    return;
  }

  const img1 = document.getElementById("heroImg1");
  const img2 = document.getElementById("heroImg2");
  const chipTitle = document.getElementById("heroChipTitle");
  const chipSub = document.getElementById("heroChipSub");
  if (!img1 && !img2) return;

  function showPair() {
    if (!imgs.length) return;
    const a = imgs[__heroRotateIdx % imgs.length];
    const b = imgs[(__heroRotateIdx + 1) % imgs.length];
    if (img1) {
      img1.style.transition = "opacity .3s ease";
      img1.style.opacity = "0.3";
      setTimeout(function() { img1.src = a.src; img1.alt = a.name || "منتج"; img1.style.opacity = "1"; }, 200);
    }
    if (img2) {
      img2.style.transition = "opacity .3s ease";
      img2.style.opacity = "0.3";
      setTimeout(function() { img2.src = b.src; img2.alt = b.name || "منتج"; img2.style.opacity = "1"; }, 240);
    }
    if (chipTitle && a.name) chipTitle.textContent = a.name;
    if (chipSub) chipSub.textContent = "من تشكيلتنا";
    const chip = document.querySelector(".hero-chip");
    if (chip && a.id != null) {
      try { chip.setAttribute("href", "/product.html?id=" + encodeURIComponent(a.id)); } catch (e) {}
    }
    __heroRotateIdx = (__heroRotateIdx + 1) % imgs.length;
  }

  showPair();
  __heroRotateTimer = setInterval(showPair, secs * 1000);
  try { window.__HERO_ROTATE_COUNT = imgs.length; } catch (e) {}
}


/* ===== Visitor tracking (enter / leave / online) ===== */
function nxSessionId() {
  try {
    let id = sessionStorage.getItem("nx_sid");
    if (!id) {
      id = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("nx_sid", id);
    }
    return id;
  } catch (e) {
    return "s_" + Date.now();
  }
}
function nxDeviceId() {
  try {
    let id = localStorage.getItem("nx_device_id");
    if (!id) {
      id = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("nx_device_id", id);
    }
    return id;
  } catch (e) {
    return "d_" + Date.now();
  }
}
function nxDeviceType() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const uaData = navigator.userAgentData;
  if (/iPhone|iPod/i.test(ua) || /iPhone|iPod/i.test(platform)) return "iphone";
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) || /iPad/i.test(platform)) return "ipad";
  if (uaData && uaData.mobile === true) return /Android/i.test(ua) ? "android" : "other";
  if (/iPhone|iPod/.test(ua)) return "iphone";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return "desktop";
  return "other";
}
function nxTrack(action) {
  try {
    const payload = JSON.stringify({
      action: action || "ping",
      sessionId: nxSessionId(),
      deviceId: nxDeviceId(),
      deviceType: nxDeviceType(),
      path: (location.pathname + (location.search || "")).slice(0, 120)
    });
    if (action === "leave" && navigator.sendBeacon) {
      try {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } catch (eB) {}
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      cache: "no-store"
    }).catch(function () {});
  } catch (e) {}
}
(function initVisitTrack() {
  try {
    var today;
    try {
      today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e0) {
      today = new Date().toISOString().slice(0, 10);
    }
    var dayKey = "nx_enter_day_" + today;
    // أول فتح للتبويب في اليوم = enter
    if (!sessionStorage.getItem(dayKey)) {
      sessionStorage.setItem(dayKey, "1");
      sessionStorage.setItem("nx_enter_sent", "1");
      nxTrack("enter");
    } else {
      nxTrack("ping");
    }
  } catch (e) { try { nxTrack("enter"); } catch (e2) {} }
  // ping كل 45 ثانية للحفاظ على "متصل الآن"
  setInterval(function () {
    try {
      if (document.visibilityState === "hidden") return;
      nxTrack("ping");
    } catch (e) {}
  }, 45000);
  window.addEventListener("pagehide", function () { try { nxTrack("leave"); } catch (e) {} });
  document.addEventListener("visibilitychange", function () {
    try {
      if (document.visibilityState === "hidden") nxTrack("leave");
      else nxTrack("ping");
    } catch (e) {}
  });
})();

async function bootStore() {
  try { if (typeof closeAuth === 'function') closeAuth(); } catch (eAuth) {}
  try { await loadCoupons(); } catch (e) {}

  bindCheckoutDraft();
  loadShippingZones().then(() => {
    populateGovSelect();
    bindShippingSelects();
    restoreCheckoutDraft();
    populateCenterSelect();
  }).catch(() => {});

  try { ensureHomeOnStart(); } catch (e) {}

  // امسح كاش منتجات فاضي كان يمنع الظهور
  try {
    const cp = nxCacheGet("nx_products");
    if (Array.isArray(cp) && cp.length === 0) sessionStorage.removeItem("nx_products");
  } catch (e) {}

  // تحميل التصنيفات والإعدادات أولًا (خفيفة)
  try { await loadCatalog(); } catch (e) { console.warn(e); }
  try { await loadHeroConfig(); } catch (e) { console.warn(e); }

  // تحميل المنتجات إجباري من الشبكة — هذا أهم شيء في الصفحة
  try {
    await loadProducts(true);
  } catch (e) {
    console.warn("loadProducts failed", e);
    try { await loadProducts(true); } catch (e2) { console.warn(e2); }
  }

  // لو لسه فاضي — مسار طوارئ مباشر
  if (!PRODUCTS || !PRODUCTS.length) {
    try {
      const r = await fetch("/products.json?t=" + Date.now(), { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        let list = Array.isArray(data) ? data : (data.products || []);
        list = (list || []).filter(p => p && p.hidden !== true && p.active !== false);
        PRODUCTS = typeof dedupeProducts === "function" ? dedupeProducts(list) : list;
        window.PRODUCTS = PRODUCTS;
        window.__ATHAR_PRODUCTS = PRODUCTS;
      }
    } catch (e3) { console.warn(e3); }
  }

  try { startHeroProductRotate(window.__SITE_CONFIG__ || {}); } catch (e) {}
  try { renderAll(); } catch (e) { console.warn(e); }
  try { if (typeof renderShop === "function") renderShop(); } catch (e) {}
  try { if (typeof renderBundleSection === "function") renderBundleSection(); } catch (e) {}
  try { bindCategoryUI(); } catch (e) { console.warn(e); }
  try { updateCartUI(); } catch (e) {}
  try { updateUserUI(); } catch (e) {}
  try {
    if (typeof setShopFilter === "function" && CATEGORIES.some(c => c.id === "fashion")) {
      setShopFilter("fashion", "", { scroll: false });
    }
  } catch (e) {}
  try {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch (e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { bootStore().then(() => { window.scrollTo(0,0); }); });
} else {
  bootStore().then(() => { window.scrollTo(0,0); });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    loadHeroConfig();
  }
});
setInterval(() => { loadHeroConfig(); }, 120000);



window.addEventListener("storage", (e) => {
  if (e.key === "nx_catalog_bump") {
    try {
      sessionStorage.removeItem("nx_products");
      sessionStorage.removeItem("nx_categories");
      sessionStorage.removeItem("nx_config");
    } catch (err) {}
    if (typeof loadProducts === "function") loadProducts().then(() => {
      if (typeof loadCatalog === "function") return loadCatalog();
    }).then(() => {
      if (typeof renderAll === "function") renderAll();
    }).catch(() => {});
  }
});

// فتح السلة من صفحة المنتج: /?openCart=1
(function openCartFromQuery() {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("openCart") === "1") {
      const run = () => {
        try {
          if (typeof updateCartUI === "function") updateCartUI();
          if (typeof openCart === "function") openCart();
        } catch (e) {}
        // نظّف الرابط بدون ريفرش
        try {
          const u = new URL(location.href);
          u.searchParams.delete("openCart");
          history.replaceState({}, "", u.pathname + (u.search || "") + (u.hash || ""));
        } catch (e) {}
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(run, 200));
      } else {
        setTimeout(run, 200);
      }
    }
  } catch (e) {}
})();

// تحديث المنتجات تلقائيًا كل ثوانٍ + عند الرجوع للتاب (بعد إضافة من الأدمن)
(function nxLiveProductsRefresh() {
  let last = 0;
  async function refresh(force) {
    const now = Date.now();
    if (!force && now - last < 5000) return;
    last = now;
    try {
      if (typeof loadProducts === "function") await loadProducts(true);
      if (typeof loadCatalog === "function") await loadCatalog();
      if (typeof loadHeroConfig === "function") await loadHeroConfig();
      if (typeof renderAll === "function") renderAll();
      if (typeof updateCartUI === "function") updateCartUI();
    } catch (e) {}
  }
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const catalogChannel = new BroadcastChannel("nexora-catalog");
      catalogChannel.addEventListener("message", (e) => {
        if (e.data && e.data.type === "catalog-updated") {
          try {
            sessionStorage.removeItem("nx_products");
            sessionStorage.removeItem("nx_categories");
            sessionStorage.removeItem("nx_config");
          } catch (err) {}
          refresh(true);
        }
      });
    }
  } catch (e) {}
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh(true);
  });
  window.addEventListener("focus", () => refresh(true));
  window.addEventListener("pageshow", () => refresh(true));
  window.addEventListener("storage", (e) => {
    if (e.key === "nx_catalog_bump") refresh(true);
  });
  setInterval(() => {
    if (document.visibilityState === "visible") refresh(true);
  }, 25000);
})();

document.getElementById("applyCouponBtn")?.addEventListener("click", applyCouponFromInput);
document.getElementById("couponInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); applyCouponFromInput(); }
});

try {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => applyStoreOpenState(window.siteConfig), 400);
    setTimeout(() => applyStoreOpenState(window.siteConfig), 1500);
  });
} catch (e) {}

document.addEventListener("click", function(e) {
  const tab = e.target && e.target.closest && e.target.closest(".bundle-tab");
  if (!tab) return;
  activeBundleCat = tab.getAttribute("data-bundle-cat") || "all";
  renderBundleSection();
});



/* ===== SAFETY NET: never leave shop empty ===== */
(function atharEnsureProductsVisible() {
  async function pullAndPaint() {
    try {
      if (typeof loadProducts === "function") {
        await loadProducts(true);
      }
    } catch (e) {
      try {
        const r = await fetch("/products.json?t=" + Date.now(), { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          let list = Array.isArray(data) ? data : (data.products || []);
          list = (list || []).filter(function(p) { return p && p.hidden !== true && p.active !== false; });
          PRODUCTS = list;
          try { window.PRODUCTS = PRODUCTS; window.__ATHAR_PRODUCTS = PRODUCTS; } catch (e2) {}
        }
      } catch (e3) {}
    }
    try { if (typeof renderShop === "function") renderShop(); } catch (e4) {}
    try { if (typeof renderBundleSection === "function") renderBundleSection(); } catch (e5) {}
    try { if (typeof renderBundleSection === "function") setTimeout(function(){ renderBundleSection(); }, 500); } catch (e5b) {}
    try {
      const grid = document.getElementById("shopGrid");
      if (grid && PRODUCTS && PRODUCTS.length && (!grid.children.length || (grid.children.length === 1 && grid.innerHTML.indexOf("empty-state") >= 0))) {
        if (typeof renderGrid === "function") renderGrid(grid, PRODUCTS);
        else {
          grid.innerHTML = PRODUCTS.map(function(p) {
            return '<article class="product-card"><a href="/product.html?id=' + p.id + '"><img src="' + (p.image || "") + '" alt="" loading="lazy"/><h3>' + (p.name || "") + '</h3></a></article>';
          }).join("");
        }
      }
    } catch (e6) {}
  }
  function schedule() {
    pullAndPaint();
    setTimeout(pullAndPaint, 800);
    setTimeout(pullAndPaint, 2500);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
})();


function ensureHomeAddButtons() {
  try {
    document.querySelectorAll("#shopGrid .product-card, #bundleGrid .product-card").forEach(function(card) {
      if (card.querySelector(".add-btn, [data-add]")) return;
      const id = card.getAttribute("data-id");
      if (!id) return;
      const body = card.querySelector(".product-body") || card;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "add-btn";
      btn.setAttribute("data-add", id);
      btn.textContent = "أضف للسلة";
      btn.onclick = function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        try { addToCart(Number(id), { fromHome: true }); } catch (e) { console.warn(e); }
      };
      body.appendChild(btn);
    });
  } catch (e) {}
}
setInterval(ensureHomeAddButtons, 2000);

try {
  window.openCart = openCart;
  window.closeCart = closeCart;
  window.openAuth = openAuth;
  window.closeAuth = closeAuth;
  window.openProfile = openProfile;
  window.closeProfile = closeProfile;
} catch (eExp) {}


/* Hero gravity: once per full page load after images ready */
(function atharHeroGravity() {
  /* DISABLED: hero motion is controlled only by atharApplyAnimations + site-config.animations.hero */
})();


/* Modal/Drawer close — capture phase (X + overlay) */
(function atharModalCloseFix() {
  if (window.__ATHAR_CLOSE_BOUND) return;
  window.__ATHAR_CLOSE_BOUND = true;
  function handleCloseClick(e) {
    try {
      const t = e.target;
      if (!t || !t.closest) return;
      const btn = t.closest("#closeCart, #closeAuth, #closeProfile, #closeProduct, [data-close]");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.id || btn.getAttribute("data-close") || "";
        if (id === "closeCart" || btn.closest("#cartDrawer")) { if (typeof closeCart === "function") closeCart(); return; }
        if (id === "closeAuth" || btn.closest("#authModal")) { if (typeof closeAuth === "function") closeAuth(); return; }
        if (id === "closeProfile" || btn.closest("#profileModal")) { if (typeof closeProfile === "function") closeProfile(); return; }
        if (id === "closeProduct") { if (typeof closeProduct === "function") closeProduct(); return; }
        // generic data-close
        const which = btn.getAttribute("data-close");
        if (which === "cart" && typeof closeCart === "function") closeCart();
        if (which === "auth" && typeof closeAuth === "function") closeAuth();
        if (which === "profile" && typeof closeProfile === "function") closeProfile();
        return;
      }
      // overlay click (backdrop)
      if (t.id === "cartOverlay") { e.preventDefault(); if (typeof closeCart === "function") closeCart(); return; }
      if (t.id === "authOverlay") { e.preventDefault(); if (typeof closeAuth === "function") closeAuth(); return; }
      if (t.id === "profileOverlay") { e.preventDefault(); if (typeof closeProfile === "function") closeProfile(); return; }
      if (t.id === "productOverlay") { e.preventDefault(); if (typeof closeProduct === "function") closeProduct(); return; }
    } catch (err) { console.warn(err); }
  }
  document.addEventListener("click", handleCloseClick, true);
  // Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    try {
      if (document.getElementById("cartDrawer")?.classList.contains("open") && typeof closeCart === "function") closeCart();
      if (document.getElementById("authModal")?.classList.contains("open") && typeof closeAuth === "function") closeAuth();
      if (document.getElementById("profileModal")?.classList.contains("open") && typeof closeProfile === "function") closeProfile();
    } catch (err) {}
  });
  try {
    window.closeCart = closeCart;
    window.closeAuth = closeAuth;
    window.closeProfile = closeProfile;
  } catch (e) {}
})();

function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const email = ((document.getElementById("loginEmail") && document.getElementById("loginEmail").value) || "").trim().toLowerCase();
      const password = (document.getElementById("loginPassword") && document.getElementById("loginPassword").value) || "";
      if (!email) return toast("اكتب البريد الإلكتروني");
      if (!password) return toast("اكتب كلمة المرور");
      let usersDB = [];
      try { usersDB = JSON.parse(localStorage.getItem("nx_users") || "[]"); } catch (e0) { usersDB = []; }
      if (!Array.isArray(usersDB)) usersDB = [];
      const user = usersDB.find(function (u) {
        return (u.email || "").toLowerCase() === email && String(u.password) === String(password);
      });
      if (!user) {
        const exists = usersDB.some(function (u) { return (u.email || "").toLowerCase() === email; });
        return toast(exists ? "كلمة المرور غير صحيحة" : "لا يوجد حساب بهذا البريد — أنشئ حسابًا جديدًا");
      }
      currentUser = { name: user.name, phone: user.phone || "", email: user.email, address: user.address || "", avatar: user.avatar || null };
      try { localStorage.setItem("nx_user", JSON.stringify(currentUser)); } catch (e1) {}
      try { if (typeof updateUserUI === "function") updateUserUI(); } catch (e2) {}
      try { if (typeof closeAuth === "function") closeAuth(); } catch (e3) {}
      toast("مرحبًا " + (user.name || ""));
    } catch (err) {
      console.warn(err);
      toast("تعذر تسجيل الدخول");
    }
  });
}
try { bindLoginForm(); } catch (eL) {}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { try { bindLoginForm(); bindRegisterForm(); } catch (e) {} });


/* ATHAR storefront animations from site-config */
(function atharApplyAnimations() {
  function qs(sel) {
    try { return Array.prototype.slice.call(document.querySelectorAll(sel)); } catch (e) { return []; }
  }
  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function ensureCss() {
    if (document.getElementById("atharAnimLibCss")) return;
    var l = document.createElement("link");
    l.id = "atharAnimLibCss";
    l.rel = "stylesheet";
    l.href = "/animations.css?v=20261103";
    document.head.appendChild(l);
  }
  function runOn(el, type, opts) {
    if (!el || !type) return;
    opts = opts || {};
    var speed = Number(opts.globalSpeed) || 1;
    var dur = (Number(opts.duration) || 0.6) / speed;
    var delay = Number(opts.delay) || 0;
    var intensity = Number(opts.intensity) || 1;
    var repeat = Number(opts.repeat) || 1;
    el.classList.remove("athar-anim-run");
    // strip previous athar-anim-*
    (el.className || "").split(/\s+/).forEach(function (c) {
      if (c.indexOf("athar-anim-") === 0 && c !== "athar-anim-run") el.classList.remove(c);
    });
    el.classList.add("athar-anim-" + type);
    el.style.setProperty("--athar-anim-duration", dur + "s");
    el.style.setProperty("--athar-anim-delay", delay + "s");
    el.style.setProperty("--athar-anim-intensity", String(intensity));
    el.style.setProperty("--athar-anim-repeat", String(repeat));
    void el.offsetWidth;
    el.classList.add("athar-anim-run");
    // safety: never leave invisible
    setTimeout(function () {
      try {
        el.style.opacity = "1";
        el.style.visibility = "visible";
        el.style.transform = el.style.transform || "";
      } catch (e) {}
    }, (dur + delay) * 1000 + 80);
  }
  function applyHero(hero) {
    var stack = document.querySelector(".phones-stack");
    if (!stack) return;
    // reset classes
    stack.classList.remove("hero-gravity-on", "hero-gravity-done", "hero-gravity-skip", "hero-collision-on", "hero-collision-done");
    stack.querySelectorAll(".phone, .phone img").forEach(function (n) {
      try {
        n.style.opacity = "1";
        n.style.visibility = "visible";
        n.style.animation = "";
      } catch (e) {}
    });
    if (!hero || hero.enabled === false) {
      stack.classList.add("hero-collision-done");
      return;
    }
    if (reduceMotion()) {
      stack.classList.add("hero-collision-done");
      return;
    }
    var type = String(hero.type || "collision");
    var dur = Number(hero.duration) || (type === "collision" ? 1.8 : 1.25);
    if (type === "collision") {
      if (dur < 1.5) dur = 1.5;
      if (dur > 2.2) dur = 2.2;
    }
    document.documentElement.style.setProperty("--athar-hero-duration", dur + "s");
    document.documentElement.style.setProperty("--athar-hero-stagger", (Number(hero.stagger) || 0.15) + "s");
    document.documentElement.style.setProperty("--athar-hero-bounce", (Number(hero.bounce) || 18) + "px");

    if (type === "none") {
      stack.classList.add("hero-collision-done");
      return;
    }

    // restart CSS animations cleanly
    function restart(cls) {
      stack.classList.remove(cls);
      void stack.offsetWidth;
      stack.classList.add(cls);
      stack.querySelectorAll(".p1, .p2").forEach(function (ph) {
        ph.style.animation = "none";
        void ph.offsetWidth;
        ph.style.animation = "";
      });
    }

    if (type === "collision") {
      restart("hero-collision-on");
      setTimeout(function () {
        stack.classList.remove("hero-collision-on");
        stack.classList.add("hero-collision-done");
        stack.querySelectorAll(".phone, .phone img").forEach(function (n) {
          n.style.opacity = "1";
          n.style.visibility = "visible";
        });
      }, dur * 1000 + 120);
      return;
    }

    if (type === "gravity") {
      restart("hero-gravity-on");
      setTimeout(function () {
        stack.classList.remove("hero-gravity-on");
        stack.classList.add("hero-gravity-done");
        stack.querySelectorAll(".phone, .phone img").forEach(function (n) {
          n.style.opacity = "1";
          n.style.visibility = "visible";
        });
      }, (dur + (Number(hero.stagger) || 0.15) + 0.35) * 1000);
      return;
    }

    // generic library animation on phones
    qs(".phones-stack .phone").forEach(function (ph, i) {
      runOn(ph, type, {
        duration: dur,
        delay: i * (Number(hero.stagger) || 0.12),
        intensity: 1,
        repeat: 1,
        globalSpeed: 1
      });
    });
  }
  function sectionSelector(key) {
    if (key === "products") return "#shop .product-card, #products .product-card, .products-grid .product-card";
    if (key === "bundles") return "#bundles .product-card, #bundles .bundle-card, .bundles-section .product-card";
    if (key === "categories") return "#categories .cat-card, .cats-grid > *";
    if (key === "cards") return ".product-card";
    if (key === "hero") return ".hero-copy, .hero-text, .hero .hero-title";
    return null;
  }
  function applySection(key, conf, globalSpeed) {
    if (!conf || conf.enabled === false) return;
    var sel = sectionSelector(key);
    if (!sel) return;
    var nodes = qs(sel);
    if (!nodes.length) return;
    var trigger = conf.trigger || "scroll";
    function go(el, idx) {
      runOn(el, conf.type || "fadeUp", {
        duration: conf.duration,
        delay: (Number(conf.delay) || 0) + idx * 0.04,
        intensity: conf.intensity,
        repeat: conf.repeat,
        globalSpeed: globalSpeed
      });
    }
    if (trigger === "load" || reduceMotion()) {
      nodes.forEach(function (el, i) { go(el, i); });
      return;
    }
    if (trigger === "hover") {
      nodes.forEach(function (el) {
        el.addEventListener("mouseenter", function () { go(el, 0); });
      });
      return;
    }
    // scroll
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el, i) { go(el, i); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var idx = nodes.indexOf(el);
        go(el, Math.max(0, idx));
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (el) { io.observe(el); });
  }
  function applyAll(anim) {
    if (!anim || anim.enabled === false) return;
    if (reduceMotion()) {
      // still ensure hero visible
      applyHero({ enabled: false });
      return;
    }
    ensureCss();
    applyHero(anim.hero || {});
    var sections = anim.sections || {};
    var gs = Number(anim.globalSpeed) || 1;
    Object.keys(sections).forEach(function (k) {
      applySection(k, sections[k], gs);
    });
  }
  var booted = false;
  function boot(force) {
    try {
      if (booted && !force) return;
      function run(anim) {
        booted = true;
        // wait for hero images so collision starts when painted
        var stack = document.querySelector(".phones-stack");
        var imgs = stack ? stack.querySelectorAll("img") : [];
        var pending = 0;
        function go() {
          applyAll(anim || {});
        }
        if (!imgs.length) { go(); return; }
        pending = imgs.length;
        var done = false;
        function one() {
          pending--;
          if (pending <= 0 && !done) { done = true; go(); }
        }
        imgs.forEach(function (img) {
          if (img.complete && img.naturalWidth) one();
          else {
            img.addEventListener("load", one, { once: true });
            img.addEventListener("error", one, { once: true });
          }
        });
        setTimeout(function () { if (!done) { done = true; go(); } }, 1000);
      }
      var cfg = window.__SITE_CONFIG || window.SITE_CONFIG || null;
      if (cfg && cfg.animations) {
        run(cfg.animations);
        return;
      }
      fetch("/site-config.json?t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          window.__SITE_CONFIG = j;
          run(j.animations || {});
        })
        .catch(function () { run({}); });
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { boot(false); });
  else boot(false);
  // products late paint — section anims only, don't retrigger hero twice unless needed
  setTimeout(function () {
    try {
      var anim = (window.__SITE_CONFIG && window.__SITE_CONFIG.animations) || {};
      var sections = anim.sections || {};
      var gs = Number(anim.globalSpeed) || 1;
      if (anim.enabled === false) return;
      Object.keys(sections).forEach(function (k) {
        if (k === "hero") return;
        applySection(k, sections[k], gs);
      });
    } catch (e) {}
  }, 2000);
  try { window.__ATHAR_REPLAY_HERO = function () { booted = false; boot(true); }; } catch (e) {}
})();


(function atharCouponBtnFix() {
  function bind() {
    var btn = document.getElementById("applyCouponBtn");
    if (btn) {
      btn.onclick = function (ev) {
        try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
        try { applyCouponFromInput(); } catch (e2) { console.warn(e2); }
        return false;
      };
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t) return;
    var btn = t.id === "applyCouponBtn" ? t : (t.closest && t.closest("#applyCouponBtn"));
    if (!btn) return;
    try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
    try { applyCouponFromInput(); } catch (e2) {}
  }, true);
})();


/* ATHAR standalone checkout end */
(function () {
  function msg(t) {
    try { if (typeof toast === "function") { toast(String(t)); return; } } catch (e) {}
    try { alert(String(t)); } catch (e2) {}
  }
  function readCart() {
    try {
      if (typeof loadCartFromStorage === "function") loadCartFromStorage();
      if (typeof cart !== "undefined" && Array.isArray(cart) && cart.length) return cart.slice();
    } catch (e) {}
    try {
      var c = JSON.parse(localStorage.getItem("nx_cart") || "[]");
      return Array.isArray(c) ? c : [];
    } catch (e2) { return []; }
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }
  async function doCheckout(ev) {
    try { if (ev && ev.preventDefault) { ev.preventDefault(); ev.stopPropagation(); } } catch (e) {}
    var btn = document.getElementById("checkoutBtn");
    if (btn && btn.dataset.busy === "1") return false;
    var items = readCart();
    if (!items.length) { msg("السلة فارغة"); return false; }
    var name = val("orderName") || "عميل";
    var phone = val("orderPhone").replace(/[^0-9]/g, "");
    var address = val("orderAddress");
    var note = val("orderNote");
    var govEl = document.getElementById("orderGov");
    var cenEl = document.getElementById("orderCenter");
    var govId = govEl ? String(govEl.value || "").trim() : "";
    var centerId = cenEl ? String(cenEl.value || "").trim() : "";
    var govName = (govEl && govEl.selectedOptions && govEl.selectedOptions[0]) ? govEl.selectedOptions[0].textContent : "";
    var centerName = (cenEl && cenEl.selectedOptions && cenEl.selectedOptions[0]) ? cenEl.selectedOptions[0].textContent : "";
    var payEl = document.querySelector('input[name="payMethod"]:checked');
    var payMethod = payEl ? payEl.value : "cod";
    if (!phone || phone.length < 10) { msg("اكتب رقم هاتف صحيح"); return false; }
    if (!address) { msg("اكتب عنوان التوصيل"); return false; }
    if (!govId) { msg("اختاري المحافظة"); return false; }
    if (!centerId) { msg("اختاري المركز / الحي"); return false; }
    var subtotal = 0;
    var rich = items.map(function (i) {
      var qty = Number(i.qty) || 1;
      var unit = Number(i.price) || 0;
      var line = unit * qty;
      subtotal += line;
      return { id: i.id, name: i.name || ("منتج #" + i.id), price: unit, qty: qty, lineTotal: line, image: i.image || "", color: i.color || "", colors: Array.isArray(i.colors) ? i.colors : [] };
    });
    var GOV_FEES = {"g1": 90, "g2": 35, "g3": 45, "g4": 45, "g5": 45, "g6": 45, "g7": 50, "g8": 45, "g9": 55, "g10": 55, "g11": 55, "g12": 55, "g13": 55, "g14": 55, "g15": 75, "g16": 75, "g17": 55, "g18": 55, "g19": 55, "g20": 55, "g21": 55, "g22": 55, "g23": 55, "g24": 55, "g25": 75, "g26": 75, "g27": 75};
    var CENTERS = {"g1": [{"id": "g1c1", "name": "حي شرق", "fee": 80}, {"id": "g1c2", "name": "حي غرب", "fee": 80}, {"id": "g1c3", "name": "حي وسط", "fee": 80}, {"id": "g1c4", "name": "حي شمال", "fee": 80}, {"id": "g1c5", "name": "المعادي", "fee": 80}, {"id": "g1c6", "name": "مدينة نصر", "fee": 80}, {"id": "g1c7", "name": "مصر الجديدة", "fee": 80}, {"id": "g1c8", "name": "الزمالك", "fee": 80}, {"id": "g1c9", "name": "شبرا", "fee": 80}, {"id": "g1c10", "name": "عين شمس", "fee": 80}, {"id": "g1c11", "name": "المرج", "fee": 80}, {"id": "g1c12", "name": "حلوان", "fee": 80}, {"id": "g1c13", "name": "التجمع الخامس", "fee": 80}, {"id": "g1c14", "name": "الشروق", "fee": 80}, {"id": "g1c15", "name": "بدر", "fee": 80}, {"id": "g1c16", "name": "15 مايو", "fee": 80}], "g2": [{"id": "g2c1", "name": "الجيزة", "fee": 35}, {"id": "g2c2", "name": "الدقي", "fee": 35}, {"id": "g2c3", "name": "المهندسين", "fee": 35}, {"id": "g2c4", "name": "العجوزة", "fee": 35}, {"id": "g2c5", "name": "الهرم", "fee": 35}, {"id": "g2c6", "name": "فيصل", "fee": 35}, {"id": "g2c7", "name": "6 أكتوبر", "fee": 35}, {"id": "g2c8", "name": "الشيخ زايد", "fee": 35}, {"id": "g2c9", "name": "الحوامدية", "fee": 35}, {"id": "g2c10", "name": "البدرشين", "fee": 35}, {"id": "g2c11", "name": "الصف", "fee": 35}, {"id": "g2c12", "name": "أطفيح", "fee": 35}, {"id": "g2c13", "name": "العياط", "fee": 35}, {"id": "g2c14", "name": "أوسيم", "fee": 35}, {"id": "g2c15", "name": "كرداسة", "fee": 35}, {"id": "g2c16", "name": "أبو النمرس", "fee": 35}], "g3": [{"id": "g3c1", "name": "حي شرق", "fee": 45}, {"id": "g3c2", "name": "حي وسط", "fee": 45}, {"id": "g3c3", "name": "حي غرب", "fee": 45}, {"id": "g3c4", "name": "المنتزه", "fee": 45}, {"id": "g3c5", "name": "الجمرك", "fee": 45}, {"id": "g3c6", "name": "العجمي", "fee": 45}, {"id": "g3c7", "name": "العامرية", "fee": 45}, {"id": "g3c8", "name": "برج العرب", "fee": 45}, {"id": "g3c9", "name": "سيدي جابر", "fee": 45}, {"id": "g3c10", "name": "محرم بك", "fee": 45}, {"id": "g3c11", "name": "ميامي", "fee": 45}, {"id": "g3c12", "name": "سموحة", "fee": 45}], "g4": [{"id": "g4c1", "name": "المنصورة", "fee": 45}, {"id": "g4c2", "name": "طلخا", "fee": 45}, {"id": "g4c3", "name": "ميت غمر", "fee": 45}, {"id": "g4c4", "name": "أجا", "fee": 45}, {"id": "g4c5", "name": "السنبلاوين", "fee": 45}, {"id": "g4c6", "name": "دكرنس", "fee": 45}, {"id": "g4c7", "name": "بلقاس", "fee": 45}, {"id": "g4c8", "name": "شربين", "fee": 45}, {"id": "g4c9", "name": "منية النصر", "fee": 45}, {"id": "g4c10", "name": "تمى الأمديد", "fee": 45}, {"id": "g4c11", "name": "نبروه", "fee": 45}, {"id": "g4c12", "name": "المطرية", "fee": 45}, {"id": "g4c13", "name": "الجمالية", "fee": 45}], "g5": [{"id": "g5c1", "name": "الزقازيق", "fee": 45}, {"id": "g5c2", "name": "العاشر من رمضان", "fee": 45}, {"id": "g5c3", "name": "بلبيس", "fee": 45}, {"id": "g5c4", "name": "منيا القمح", "fee": 45}, {"id": "g5c5", "name": "أبو حماد", "fee": 45}, {"id": "g5c6", "name": "ههيا", "fee": 45}, {"id": "g5c7", "name": "فاقوس", "fee": 45}, {"id": "g5c8", "name": "كفر صقر", "fee": 45}, {"id": "g5c9", "name": "أبو كبير", "fee": 45}, {"id": "g5c10", "name": "الإبراهيمية", "fee": 45}, {"id": "g5c11", "name": "ديرب نجم", "fee": 45}, {"id": "g5c12", "name": "أولاد صقر", "fee": 45}, {"id": "g5c13", "name": "مشتول السوق", "fee": 45}], "g6": [{"id": "g6c1", "name": "بنها", "fee": 45}, {"id": "g6c2", "name": "شبرا الخيمة", "fee": 45}, {"id": "g6c3", "name": "القناطر الخيرية", "fee": 45}, {"id": "g6c4", "name": "الخانكة", "fee": 45}, {"id": "g6c5", "name": "كفر شكر", "fee": 45}, {"id": "g6c6", "name": "طوخ", "fee": 45}, {"id": "g6c7", "name": "قليوب", "fee": 45}, {"id": "g6c8", "name": "شبين القناطر", "fee": 45}, {"id": "g6c9", "name": "العبور", "fee": 45}, {"id": "g6c10", "name": "الخصوص", "fee": 45}], "g7": [{"id": "g7c1", "name": "طنطا", "fee": 50}, {"id": "g7c2", "name": "المحلة الكبرى", "fee": 50}, {"id": "g7c3", "name": "كفر الزيات", "fee": 50}, {"id": "g7c4", "name": "زفتى", "fee": 50}, {"id": "g7c5", "name": "سمنود", "fee": 50}, {"id": "g7c6", "name": "بسيون", "fee": 50}, {"id": "g7c7", "name": "قطور", "fee": 50}, {"id": "g7c8", "name": "السنطة", "fee": 50}], "g8": [{"id": "g8c1", "name": "شبين الكوم", "fee": 45}, {"id": "g8c2", "name": "منوف", "fee": 45}, {"id": "g8c3", "name": "أشمون", "fee": 45}, {"id": "g8c4", "name": "قويسنا", "fee": 45}, {"id": "g8c5", "name": "تلا", "fee": 45}, {"id": "g8c6", "name": "الباجور", "fee": 45}, {"id": "g8c7", "name": "السادات", "fee": 45}, {"id": "g8c8", "name": "بركة السبع", "fee": 45}, {"id": "g8c9", "name": "الشهداء", "fee": 45}], "g9": [{"id": "g9c1", "name": "دمنهور", "fee": 55}, {"id": "g9c2", "name": "كفر الدوار", "fee": 55}, {"id": "g9c3", "name": "رشيد", "fee": 55}, {"id": "g9c4", "name": "إدكو", "fee": 55}, {"id": "g9c5", "name": "أبو المطامير", "fee": 55}, {"id": "g9c6", "name": "حوش عيسى", "fee": 55}, {"id": "g9c7", "name": "الدلنجات", "fee": 55}, {"id": "g9c8", "name": "كوم حمادة", "fee": 55}, {"id": "g9c9", "name": "المحمودية", "fee": 55}, {"id": "g9c10", "name": "إيتاي البارود", "fee": 55}, {"id": "g9c11", "name": "شبراخيت", "fee": 55}, {"id": "g9c12", "name": "الرحمانية", "fee": 55}, {"id": "g9c13", "name": "النوبارية", "fee": 55}], "g10": [{"id": "g10c1", "name": "كفر الشيخ", "fee": 55}, {"id": "g10c2", "name": "دسوق", "fee": 55}, {"id": "g10c3", "name": "فوه", "fee": 55}, {"id": "g10c4", "name": "مطوبس", "fee": 55}, {"id": "g10c5", "name": "بلطيم", "fee": 55}, {"id": "g10c6", "name": "سيدي سالم", "fee": 55}, {"id": "g10c7", "name": "قلين", "fee": 55}, {"id": "g10c8", "name": "بُيلا", "fee": 55}, {"id": "g10c9", "name": "الحامول", "fee": 55}, {"id": "g10c10", "name": "الرياض", "fee": 55}, {"id": "g10c11", "name": "مسير", "fee": 55}], "g11": [{"id": "g11c1", "name": "دمياط", "fee": 55}, {"id": "g11c2", "name": "فارسكور", "fee": 55}, {"id": "g11c3", "name": "كفر سعد", "fee": 55}, {"id": "g11c4", "name": "الزرقا", "fee": 55}, {"id": "g11c5", "name": "رأس البر", "fee": 55}, {"id": "g11c6", "name": "دمياط الجديدة", "fee": 55}, {"id": "g11c7", "name": "عزبة البرج", "fee": 55}], "g12": [{"id": "g12c1", "name": "حي الشرق", "fee": 55}, {"id": "g12c2", "name": "حي العرب", "fee": 55}, {"id": "g12c3", "name": "حي المناخ", "fee": 55}, {"id": "g12c4", "name": "حي الضواحي", "fee": 55}, {"id": "g12c5", "name": "بورفؤاد", "fee": 55}, {"id": "g12c6", "name": "الزهور", "fee": 55}], "g13": [{"id": "g13c1", "name": "الإسماعيلية", "fee": 55}, {"id": "g13c2", "name": "فايد", "fee": 55}, {"id": "g13c3", "name": "القنطرة شرق", "fee": 55}, {"id": "g13c4", "name": "القنطرة غرب", "fee": 55}, {"id": "g13c5", "name": "التل الكبير", "fee": 55}, {"id": "g13c6", "name": "أبو صوير", "fee": 55}, {"id": "g13c7", "name": "القصاصين", "fee": 55}], "g14": [{"id": "g14c1", "name": "حي السويس", "fee": 55}, {"id": "g14c2", "name": "الأربعين", "fee": 55}, {"id": "g14c3", "name": "عتاقة", "fee": 55}, {"id": "g14c4", "name": "الجناين", "fee": 55}, {"id": "g14c5", "name": "فيصل", "fee": 55}], "g15": [{"id": "g15c1", "name": "العريش", "fee": 75}, {"id": "g15c2", "name": "بئر العبد", "fee": 75}, {"id": "g15c3", "name": "الشيخ زويد", "fee": 75}, {"id": "g15c4", "name": "رفح", "fee": 75}, {"id": "g15c5", "name": "الحسنة", "fee": 75}, {"id": "g15c6", "name": "نخل", "fee": 75}], "g16": [{"id": "g16c1", "name": "الطور", "fee": 75}, {"id": "g16c2", "name": "شرم الشيخ", "fee": 75}, {"id": "g16c3", "name": "دهب", "fee": 75}, {"id": "g16c4", "name": "نويبع", "fee": 75}, {"id": "g16c5", "name": "طابا", "fee": 75}, {"id": "g16c6", "name": "رأس سدر", "fee": 75}, {"id": "g16c7", "name": "أبو رديس", "fee": 75}, {"id": "g16c8", "name": "سانت كاترين", "fee": 75}], "g17": [{"id": "g17c1", "name": "بني سويف", "fee": 55}, {"id": "g17c2", "name": "الواسطى", "fee": 55}, {"id": "g17c3", "name": "ناصر", "fee": 55}, {"id": "g17c4", "name": "إهناسيا", "fee": 55}, {"id": "g17c5", "name": "ببا", "fee": 55}, {"id": "g17c6", "name": "الفشن", "fee": 55}, {"id": "g17c7", "name": "سمسطا", "fee": 55}, {"id": "g17c8", "name": "إهناسيا المدينة", "fee": 55}], "g18": [{"id": "g18c1", "name": "الفيوم", "fee": 55}, {"id": "g18c2", "name": "سنورس", "fee": 55}, {"id": "g18c3", "name": "طامية", "fee": 55}, {"id": "g18c4", "name": "إطسا", "fee": 55}, {"id": "g18c5", "name": "يوسف الصديق", "fee": 55}, {"id": "g18c6", "name": "أبشواي", "fee": 55}, {"id": "g18c7", "name": "الفيوم الجديدة", "fee": 55}], "g19": [{"id": "g19c1", "name": "المنيا", "fee": 55}, {"id": "g19c2", "name": "ملوي", "fee": 55}, {"id": "g19c3", "name": "بني مزار", "fee": 55}, {"id": "g19c4", "name": "مغاغة", "fee": 55}, {"id": "g19c5", "name": "سمالوط", "fee": 55}, {"id": "g19c6", "name": "مطاي", "fee": 55}, {"id": "g19c7", "name": "أبو قرقاص", "fee": 55}, {"id": "g19c8", "name": "دير مواس", "fee": 55}, {"id": "g19c9", "name": "العدوة", "fee": 55}, {"id": "g19c10", "name": "المنيا الجديدة", "fee": 55}], "g20": [{"id": "g20c1", "name": "أسيوط", "fee": 55}, {"id": "g20c2", "name": "ديروط", "fee": 55}, {"id": "g20c3", "name": "منفلوط", "fee": 55}, {"id": "g20c4", "name": "القوصية", "fee": 55}, {"id": "g20c5", "name": "أبنوب", "fee": 55}, {"id": "g20c6", "name": "أبو تيج", "fee": 55}, {"id": "g20c7", "name": "صدفا", "fee": 55}, {"id": "g20c8", "name": "الغنايم", "fee": 55}, {"id": "g20c9", "name": "ساحل سليم", "fee": 55}, {"id": "g20c10", "name": "البداري", "fee": 55}, {"id": "g20c11", "name": "أسيوط الجديدة", "fee": 55}], "g21": [{"id": "g21c1", "name": "سوهاج", "fee": 55}, {"id": "g21c2", "name": "جرجا", "fee": 55}, {"id": "g21c3", "name": "طهطا", "fee": 55}, {"id": "g21c4", "name": "طما", "fee": 55}, {"id": "g21c5", "name": "أخميم", "fee": 55}, {"id": "g21c6", "name": "البلينا", "fee": 55}, {"id": "g21c7", "name": "المراغة", "fee": 55}, {"id": "g21c8", "name": "دار السلام", "fee": 55}, {"id": "g21c9", "name": "ساقلتة", "fee": 55}, {"id": "g21c10", "name": "جهينة", "fee": 55}, {"id": "g21c11", "name": "سوهاج الجديدة", "fee": 55}], "g22": [{"id": "g22c1", "name": "قنا", "fee": 55}, {"id": "g22c2", "name": "نجع حمادي", "fee": 55}, {"id": "g22c3", "name": "قوص", "fee": 55}, {"id": "g22c4", "name": "دشنا", "fee": 55}, {"id": "g22c5", "name": "أبو تشت", "fee": 55}, {"id": "g22c6", "name": "فرشوط", "fee": 55}, {"id": "g22c7", "name": "نقادة", "fee": 55}, {"id": "g22c8", "name": "الوقف", "fee": 55}, {"id": "g22c9", "name": "قنا الجديدة", "fee": 55}], "g23": [{"id": "g23c1", "name": "الأقصر", "fee": 55}, {"id": "g23c2", "name": "الزينية", "fee": 55}, {"id": "g23c3", "name": "البياضية", "fee": 55}, {"id": "g23c4", "name": "القرنة", "fee": 55}, {"id": "g23c5", "name": "أرمنت", "fee": 55}, {"id": "g23c6", "name": "الطود", "fee": 55}, {"id": "g23c7", "name": "إسنا", "fee": 55}], "g24": [{"id": "g24c1", "name": "أسوان", "fee": 55}, {"id": "g24c2", "name": "كوم أمبو", "fee": 55}, {"id": "g24c3", "name": "إدفو", "fee": 55}, {"id": "g24c4", "name": "نصر النوبة", "fee": 55}, {"id": "g24c5", "name": "دراو", "fee": 55}, {"id": "g24c6", "name": "كلابشة", "fee": 55}, {"id": "g24c7", "name": "أسوان الجديدة", "fee": 55}], "g25": [{"id": "g25c1", "name": "الغردقة", "fee": 75}, {"id": "g25c2", "name": "رأس غارب", "fee": 75}, {"id": "g25c3", "name": "سفاجا", "fee": 75}, {"id": "g25c4", "name": "القصير", "fee": 75}, {"id": "g25c5", "name": "مرسى علم", "fee": 75}, {"id": "g25c6", "name": "الشلاتين", "fee": 75}, {"id": "g25c7", "name": "حلايب", "fee": 75}], "g26": [{"id": "g26c1", "name": "الخارجة", "fee": 75}, {"id": "g26c2", "name": "الداخلة", "fee": 75}, {"id": "g26c3", "name": "الفرافرة", "fee": 75}, {"id": "g26c4", "name": "باريس", "fee": 75}, {"id": "g26c5", "name": "بلاط", "fee": 75}], "g27": [{"id": "g27c1", "name": "مرسى مطروح", "fee": 75}, {"id": "g27c2", "name": "العلمين", "fee": 75}, {"id": "g27c3", "name": "الحمام", "fee": 75}, {"id": "g27c4", "name": "الضبعة", "fee": 75}, {"id": "g27c5", "name": "النجيلة", "fee": 75}, {"id": "g27c6", "name": "سيدي براني", "fee": 75}, {"id": "g27c7", "name": "السلوم", "fee": 75}, {"id": "g27c8", "name": "سيوة", "fee": 75}]};
    var ship = Number(GOV_FEES[govId] != null ? GOV_FEES[govId] : 80) || 80;
    var clist = CENTERS[govId] || [];
    for (var k = 0; k < clist.length; k++) {
      if (String(clist[k].id) === String(centerId) && clist[k].fee != null) { ship = Number(clist[k].fee) || ship; break; }
    }
    var code = "";
    try { code = String(sessionStorage.getItem("nx_coupon_code") || localStorage.getItem("nx_coupon_code") || "").toUpperCase(); } catch (e) {}
    var CODES = { NEXORA10: 10, WELCOME10: 10, FIRST10: 10, SAVE10: 10, EGYPT10: 10, AHMED: 50 };
    var discount = Math.round(subtotal * (CODES[code] || 0)) / 100;
    var total = Math.max(0, subtotal + ship - discount);
    var orderId = "NX-" + Date.now().toString().slice(-8);
    var orderRecord = {
      id: orderId, at: new Date().toISOString(), subtotal: subtotal, discount: discount, coupon: code,
      shipping: ship, total: total, status: "new", paymentMethod: payMethod,
      customer: { name: name, phone: phone, address: address, note: note, governorate: govName, center: centerName, governorateId: govId, centerId: centerId },
      items: rich
    };
    if (btn) { btn.dataset.busy = "1"; btn.disabled = true; btn.textContent = "جاري إرسال الطلب..."; }
    var ok = false;
    try {
      var r = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: orderRecord }) });
      var d = await r.json().catch(function () { return {}; });
      ok = !!(r.ok && d && d.ok !== false);
    } catch (e1) { ok = false; }
    if (!ok) {
      try {
        var r2 = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_order", order: orderRecord }) });
        var d2 = await r2.json().catch(function () { return {}; });
        ok = !!(r2.ok && d2 && d2.ok !== false);
      } catch (e2) { ok = false; }
    }
    try { await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "order", order: orderRecord }) }); } catch (e3) {}
    if (ok) {
      try {
        localStorage.setItem("nx_cart", "[]");
        try { clearCartCoupon(); } catch (eC) {}
        if (typeof cart !== "undefined") cart = [];
        if (typeof saveCart === "function") saveCart();
        if (typeof updateCartUI === "function") updateCartUI();
      } catch (e4) {}
      try { if (typeof closeCart === "function") closeCart(); } catch (e5) {}
      try { if (typeof showOrderSuccess === "function") showOrderSuccess(orderId); } catch (e6) {}
      msg("تم تأكيد طلبك بنجاح ✓ رقم الطلب: " + orderId);
      if (btn) { btn.dataset.busy = ""; btn.disabled = false; btn.textContent = "إتمام الطلب الآن"; }
    } else {
      msg("تعذر إرسال الطلب — حاولي مرة أخرى");
      if (btn) { btn.dataset.busy = ""; btn.disabled = false; btn.textContent = "إتمام الطلب الآن"; }
    }
    return false;
  }
  window.__atharDoCheckout = doCheckout;
  function wireBtn() {
    var btn = document.getElementById("checkoutBtn");
    if (!btn) return;
    btn.hidden = false;
    btn.removeAttribute("hidden");
    btn.style.display = "block";
    btn.style.visibility = "visible";
    btn.style.pointerEvents = "auto";
    btn.disabled = false;
    btn.onclick = function (e) { return doCheckout(e); };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireBtn);
  else wireBtn();
  setInterval(wireBtn, 2500);
})();



/* ATHAR hero carousel */
(function () {
  function bindHeroCarousel() {
    var stack = document.getElementById("heroPhonesStack") || document.querySelector(".phones-stack");
    var prev = document.getElementById("heroCarouselPrev");
    var next = document.getElementById("heroCarouselNext");
    if (!stack) return;
    var idx = 0;
    function show(i) {
      idx = i % 2;
      if (idx < 0) idx = 1;
      if (idx === 1) stack.classList.add("show-second");
      else stack.classList.remove("show-second");
    }
    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    // auto every 5s
    setInterval(function () { show(idx + 1); }, 5000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindHeroCarousel);
  else bindHeroCarousel();
})();



/* ATHAR hero from real products */
(function(){
  function applyHeroProducts(){
    try {
      if (typeof PRODUCTS === "undefined" || !PRODUCTS || !PRODUCTS.length) return;
      var list = PRODUCTS.filter(function(p){
        return p && !p.hidden && p.image && !((typeof isBundleOffer==="function") && isBundleOffer(p));
      });
      if (!list.length) list = PRODUCTS.filter(function(p){ return p && p.image; });
      if (!list.length) return;
      var a = list[0], b = list[1] || list[0];
      var img1 = document.getElementById("heroImg1");
      var img2 = document.getElementById("heroImg2");
      if (img1 && a.image) { img1.src = a.image; img1.alt = a.name || "منتج"; img1.dataset.pid = a.id; }
      if (img2 && b.image) { img2.src = b.image; img2.alt = b.name || "منتج"; img2.dataset.pid = b.id; }
      var chip = document.getElementById("heroChipTitle");
      if (chip && a.name) chip.textContent = String(a.name).slice(0, 28);
      // click hero image -> product
      [img1, img2].forEach(function(img){
        if (!img) return;
        img.style.cursor = "pointer";
        img.onclick = function(){
          var id = img.dataset.pid;
          if (id) location.href = "/product.html?id=" + id;
        };
      });
    } catch(e) { console.warn(e); }
  }
  window.__atharApplyHeroProducts = applyHeroProducts;
  // after products load
  var tries = 0;
  var t = setInterval(function(){
    tries++;
    if (typeof PRODUCTS !== "undefined" && PRODUCTS && PRODUCTS.length) {
      applyHeroProducts();
      clearInterval(t);
    }
    if (tries > 40) clearInterval(t);
  }, 250);
})();
