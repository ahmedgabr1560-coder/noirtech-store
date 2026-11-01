(async function applySiteConfig() {
  try {
    const r = await fetch("/site-config.json?t=" + Date.now());
    if (!r.ok) return;
    const c = await r.json();
    window.siteConfig = c;
    try { if (typeof applyStoreOpenState === "function") applyStoreOpenState(c); } catch (e) {}
    const root = document.documentElement;
    const text = (sel, val) => { const el = document.querySelector(sel); if (el && val != null) el.textContent = val; };

    
  function applyHeroScale(c) {
    if (!c) return;
    try {
      const root = document.documentElement;
      let hs = Number(c.heroScale);
      let hsm = Number(c.heroScaleMobile);
      if (!(hs > 0.3 && hs <= 1.6)) hs = 1.28;
      if (!(hsm > 0.3 && hsm <= 1.5)) hsm = 1.05;
      root.style.setProperty("--hero-scale", String(hs));
      root.style.setProperty("--hero-scale-mobile", String(hsm));
      // force on body too (some CSS scopes)
      if (document.body) {
        document.body.style.setProperty("--hero-scale", String(hs));
        document.body.style.setProperty("--hero-scale-mobile", String(hsm));
      }
    } catch (e) {}
  }

  
  const SYSTEM_LIGHT = {
    bg: "#f6f5f2", bgSection: "#efece6", bgCard: "#ffffff", text: "#1c1916",
    textHeading: "#0c0b0a", textMuted: "#6f6a62", border: "#e4ddd3",
    headerBg: "#faf8f5", footerBg: "#efece6", navBg: "#faf8f5",
    inputBg: "#ffffff", inputBorder: "#ddd5c8", btnSecondaryBg: "#f0ebe3",
    btnSecondaryText: "#1c1916", shadow: "rgba(0,0,0,0.12)", priceOld: "#8a847a"
  };
  const SYSTEM_DARK = {
    bg: "#07070a", bgSection: "#0a0a0c", bgCard: "#0f0f14", text: "#f4f4f8",
    textHeading: "#ffffff", textMuted: "#9898a6", border: "#2a2a32",
    headerBg: "#0a0a0c", footerBg: "#07070a", navBg: "#0a0a0c",
    inputBg: "#0c0c12", inputBorder: "#2a2a32", btnSecondaryBg: "#1a1a22",
    btnSecondaryText: "#f5f5f7", shadow: "rgba(0,0,0,0.45)", priceOld: "#9898a6"
  };

  function prefersDark() {
    try { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }
    catch (e) { return true; }
  }

  function applySystemSurfaces(brandColors) {
    const dark = prefersDark();
    const root = document.documentElement;
    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.style.colorScheme = dark ? "dark" : "light";
    const surfaces = dark ? SYSTEM_DARK : SYSTEM_LIGHT;
    // ابدأ من ألوان الأدمن (العلامة) ثم افرض الأسطح حسب النظام
    const merged = Object.assign({}, brandColors || {}, surfaces);
    // أبقِ ألوان الهوية من الأدمن
    if (brandColors) {
      ["primary","secondary","btnPrimaryBg","btnPrimaryText","btnHover","link","price","badge","cartIcon","gold","goldLight","goldDark","accent","success","error"].forEach(function(k){
        if (brandColors[k]) merged[k] = brandColors[k];
      });
    }
    applyColors(merged);
    try {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", dark ? (merged.bg || "#0a0a0c") : (merged.bg || "#f6f5f2"));
    } catch (e) {}
  }

  function applyColors(colors) {
      if (!colors || typeof colors !== "object") return;
      const map = {
        bg: "--bg",
        bgSection: "--bg-section",
        bgCard: "--bg-card",
        primary: "--primary",
        secondary: "--secondary",
        border: "--border-solid",
        text: "--text",
        textHeading: "--text-heading",
        textMuted: "--muted",
        link: "--link",
        btnPrimaryBg: "--btn-primary-bg",
        btnPrimaryText: "--btn-primary-text",
        btnSecondaryBg: "--btn-secondary-bg",
        btnSecondaryText: "--btn-secondary-text",
        btnHover: "--btn-hover",
        headerBg: "--header-bg",
        footerBg: "--footer-bg",
        navBg: "--nav-bg",
        price: "--price",
        priceOld: "--price-old",
        badge: "--badge",
        cartIcon: "--cart-icon",
        inputBg: "--input-bg",
        inputBorder: "--input-border",
        success: "--success",
        error: "--error",
        gold: "--gold",
        goldLight: "--gold-light",
        goldDark: "--gold-dark",
        accent: "--accent",
        accent: "--violet",
        shadow: "--shadow",
        radius: "--radius"
      };
      // dual: accent maps to --violet too
      if (colors.radius != null) {
        const rad = String(colors.radius);
        root.style.setProperty("--radius", rad.endsWith("px") ? rad : rad + "px");
      }
      Object.keys(map).forEach((k) => {
        if (colors[k] == null || colors[k] === "") return;
        let v = String(colors[k]);
        if (k === "radius" && !/px|rem|%/.test(v)) v = v + "px";
        root.style.setProperty(map[k], v);
      });
      if (colors.primary) root.style.setProperty("--violet", String(colors.primary));
      if (colors.bg) {
        root.style.setProperty("--bg", String(colors.bg));
        try { document.body.style.background = String(colors.bg); } catch (e) {}
      }
      if (colors.text) {
        try { document.body.style.color = String(colors.text); } catch (e) {}
      }
    }

    window.__ATHAR_BRAND_COLORS = c.colors || null;
    applySystemSurfaces(c.colors);
    try {
      if (!window.__ATHAR_SCHEME_BOUND && window.matchMedia) {
        window.__ATHAR_SCHEME_BOUND = true;
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function() {
          applySystemSurfaces(window.__ATHAR_BRAND_COLORS);
        });
      }
    } catch (e) {}
    try {
      const hs = Number(c.heroScale);
      const hsm = Number(c.heroScaleMobile);
      if (hs > 0.3 && hs <= 1.6) {
        root.style.setProperty("--hero-scale", String(hs));
        document.documentElement.style.setProperty("--hero-scale", String(hs));
      } else {
        root.style.setProperty("--hero-scale", "1.28");
      }
      if (hsm > 0.3 && hsm <= 1.5) {
        root.style.setProperty("--hero-scale-mobile", String(hsm));
        document.documentElement.style.setProperty("--hero-scale-mobile", String(hsm));
      } else {
        root.style.setProperty("--hero-scale-mobile", "1.05");
      }
    } catch (e) {}

    if (c.siteName) {
      document.querySelectorAll("[data-site-name]").forEach((el) => { el.textContent = c.siteName; });
      if (!location.pathname.includes("product") && !location.search.includes("id=")) {
        try { document.title = c.siteName; } catch (e) {}
      }
    }
    if (c.logoMark) {
      document.querySelectorAll("[data-site-mark]").forEach((el) => { el.textContent = c.logoMark; });
    }
    if (c.phone) text("[data-phone]", c.phone);
    if (c.whatsapp) {
      document.querySelectorAll("[data-whatsapp-link]").forEach((a) => {
        const n = String(c.whatsapp).replace(/\D/g, "");
        a.href = "https://wa.me/20" + (n.startsWith("0") ? n.slice(1) : n);
      });
    }
  } catch (e) {
    console.warn("config-loader", e);
  }
})();
