(async function applySiteConfig() {
  try {
    const r = await fetch("/site-config.json?t=" + Date.now());
    if (!r.ok) return;
    const c = await r.json();
    window.siteConfig = c;
    try { if (typeof applyStoreOpenState === "function") applyStoreOpenState(c); } catch (e) {}
    const root = document.documentElement;
    const text = (sel, val) => { const el = document.querySelector(sel); if (el && val != null) el.textContent = val; };

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

    applyColors(c.colors);
    try {
      const hs = Number(c.heroScale);
      const hsm = Number(c.heroScaleMobile);
      if (hs > 0.3 && hs <= 1.5) root.style.setProperty("--hero-scale", String(hs));
      if (hsm > 0.3 && hsm <= 1.5) root.style.setProperty("--hero-scale-mobile", String(hsm));
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
