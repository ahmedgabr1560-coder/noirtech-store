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
    bg: "#f8f7f4", bgSection: "#f1efe9", bgCard: "#ffffff", text: "#1a1814",
    textHeading: "#0c0b0a", textMuted: "#6b6560", border: "#e6e1d8",
    headerBg: "rgba(255,255,255,0.92)", footerBg: "#f1efe9", navBg: "#ffffff",
    inputBg: "#ffffff", inputBorder: "#ddd6ca", btnSecondaryBg: "#f0ebe3",
    btnSecondaryText: "#1a1814", shadow: "rgba(28,24,20,0.08)", priceOld: "#9a9388"
  };
  const SYSTEM_DARK = {
    bg: "#000000", bgSection: "#0a0a0a", bgCard: "#111111", text: "#f5f5f5",
    textHeading: "#ffffff", textMuted: "#aaaaaa", border: "#2a2a2a",
    headerBg: "#000000", footerBg: "#000000", navBg: "#000000",
    inputBg: "#111111", inputBorder: "#333333", btnSecondaryBg: "#1a1a1a",
    btnSecondaryText: "#f5f5f5", shadow: "rgba(0,0,0,0.55)", priceOld: "#888888"
  };

  function prefersDark() {
    try {
      const mode = window.__ATHAR_THEME_MODE || "system";
      if (mode === "dark") return true;
      if (mode === "light") return false;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) { return true; }
  }

  function applySystemSurfaces(brandColors) {
    const dark = prefersDark();
    const root = document.documentElement;
    root.setAttribute("data-theme", dark ? "dark" : "light");
    /* light force */
    if (!dark) { try { document.body && (document.body.style.background = "#ffffff"); } catch(e){} }
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

  
  function applyHeroLayout(layout) {
    if (!layout || typeof layout !== "object") return;
    try {
      const w = window.innerWidth || 1200;
      const dev = w <= 700 ? "mobile" : (w <= 1024 ? "tablet" : "desktop");
      const block = layout[dev] || layout.desktop || {};
      const m = block.main || {};
      const c = block.chip || {};
      const root = document.documentElement;
      if (m.w) root.style.setProperty("--hero-main-w", String(m.w));
      if (m.h) root.style.setProperty("--hero-main-h", String(m.h));
      if (m.scale) root.style.setProperty("--hero-main-scale", String((Number(m.scale) || 100) / 100));
      root.style.setProperty("--hero-main-x", String(m.x || 0));
      root.style.setProperty("--hero-main-y", String(m.y || 0));
      if (m.fit) root.style.setProperty("--hero-main-fit", String(m.fit));
      if (c.w) root.style.setProperty("--hero-chip-w", String(c.w));
      if (c.h && Number(c.h) > 0) root.style.setProperty("--hero-chip-h", String(c.h) + "px");
      else root.style.setProperty("--hero-chip-h", "auto");
      root.style.setProperty("--hero-chip-text", String(c.text || 14));
      root.style.setProperty("--hero-chip-icon", String(c.icon || 28));
      root.style.setProperty("--hero-chip-x", String(c.x || 0));
      root.style.setProperty("--hero-chip-y", String(c.y || 0));
      root.style.setProperty("--hero-chip-pad", String(c.pad || 12));
    } catch (e) {}
  }

  
  function applyHomepageConfig(hp) {
    if (!hp || typeof hp !== "object") return;
    try {
      const w = window.innerWidth || 1200;
      const dev = w <= 700 ? "mobile" : (w <= 1024 ? "tablet" : "desktop");
      const order = Array.isArray(hp.order) ? hp.order : ["home","bundles","shop","contact"];
      const sections = hp.sections || {};
      // reorder + visibility
      const parentMap = {};
      order.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) parentMap[id] = el;
      });
      // use common parent - body main flow: sections are sequential under body/main
      const first = parentMap[order[0]];
      const parent = first && first.parentNode;
      if (parent) {
        order.forEach(function(id) {
          const el = parentMap[id];
          if (!el) return;
          parent.appendChild(el); // move to end in order
        });
      }
      order.forEach(function(id) {
        const el = document.getElementById(id);
        const sec = sections[id] || {};
        if (!el) return;
        if (sec.visible === false) { el.style.display = "none"; } else { el.style.display = ""; el.style.visibility = "visible"; }
        const d = sec[dev] || sec.desktop || {};
        el.style.setProperty("--hp-pad-y", (d.padY != null ? d.padY : 40) + "px");
        el.style.setProperty("--hp-title", (d.titleSize != null ? d.titleSize : 28) + "px");
        el.style.setProperty("--hp-text", (d.textSize != null ? d.textSize : 15) + "px");
        el.style.setProperty("--hp-gap", (d.gap != null ? d.gap : 16) + "px");
        el.style.setProperty("--hp-radius", (d.radius != null ? d.radius : 14) + "px");
        el.style.setProperty("--hp-card-scale", String((d.cardScale != null ? d.cardScale : 100) / 100));
        el.style.setProperty("--hp-img-scale", String((d.imgScale != null ? d.imgScale : 100) / 100));
        el.style.setProperty("--hp-btn-scale", String((d.btnScale != null ? d.btnScale : 100) / 100));
        var colsN = Number(d.cols != null ? d.cols : 2); if (!colsN || colsN < 1) colsN = 2; el.style.setProperty("--hp-cols", String(colsN));
        el.style.setProperty("--hp-shadow", String((d.shadow != null ? d.shadow : 40) / 100));
        if (d.bg) el.style.setProperty("--hp-bg", d.bg);
        if (d.titleColor) el.style.setProperty("--hp-title-color", d.titleColor);
        if (d.textColor) el.style.setProperty("--hp-text-color", d.textColor);
        if (d.btnColor) el.style.setProperty("--hp-btn-color", d.btnColor);
        if (d.borderColor) el.style.setProperty("--hp-border", d.borderColor);
        el.setAttribute("data-hp-limit", (d.limit != null && Number(d.limit) > 0) ? d.limit : "");
        el.classList.add("hp-controlled");
      });
      window.__ATHAR_HOMEPAGE = hp;
      window.dispatchEvent(new CustomEvent("athar-homepage-applied", { detail: hp }));
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
    window.__ATHAR_THEME_MODE = c.themeMode || "system";
    applySystemSurfaces(c.colors);
    if (c.heroLayout) applyHeroLayout(c.heroLayout);
    if (c.homepage) applyHomepageConfig(c.homepage);
    try {
      if (!window.__HL_RESIZE_BOUND) {
        window.__HL_RESIZE_BOUND = true;
        window.addEventListener("resize", function() {
          const cfg = window.__SITE_CONFIG__ || window.siteConfig;
          if (cfg && cfg.heroLayout) applyHeroLayout(cfg.heroLayout);
          if (cfg && cfg.homepage) applyHomepageConfig(cfg.homepage);
        });
      }
    } catch (e) {}
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
