(async function applySiteConfig() {
  try {
    const r = await fetch("/site-config.json?t=" + Date.now());
    if (!r.ok) return;
    const c = await r.json();
    window.siteConfig = c;
    const root = document.documentElement;
    const text = (sel, val) => { const el = document.querySelector(sel); if (el && val != null) el.textContent = val; };

    if (c.colors) {
      const map = [["bg","--bg"],["bgCard","--bg-card"],["gold","--gold"],["goldLight","--gold-light"],["goldDark","--gold-dark"],["accent","--accent"],["text","--text"],["textMuted","--text-muted"]];
      map.forEach(([key, css]) => { if (c.colors[key]) root.style.setProperty(css, c.colors[key]); });
      if (c.colors.bg) document.body.style.background = c.colors.bg;
      if (c.colors.text) document.body.style.color = c.colors.text;
    }
    if (c.layout) document.body.dataset.layout = c.layout;
    if (c.font) root.style.setProperty("--site-font", c.font);
    document.body.style.fontFamily = "var(--site-font, Cairo), sans-serif";

    text(".owner-name", c.ownerName);
    text(".hero-badge", c.heroBadge);
    text(".hero-desc", c.heroDesc);
    text(".btn-primary", c.heroBtn);
    text(".about-text > p", c.aboutText);
    text(".footer-bottom p", c.footerText);
    if (c.heroTitle || c.heroHighlight) {
      const h1 = document.querySelector(".hero h1");
      if (h1) { h1.textContent = ""; h1.append(document.createTextNode(c.heroTitle || "إلكترونيات"), document.createElement("br")); const span = document.createElement("span"); span.textContent = c.heroHighlight || "تليق بذوقك"; h1.append(span); }
    }
    if (c.siteName) document.title = c.siteName + " | إلكترونيات فاخرة";

    const labels = c.categoryLabels || {};
    Object.entries(labels).forEach(([key, value]) => text(`#${key} .section-header h2`, value));
    const nav = c.navLabels || {};
    Object.entries(nav).forEach(([key, value]) => text(`.nav-links a[href="#${key === "home" ? "home" : key}"]`, value));
    if (c.stats) document.querySelectorAll(".stat h3").forEach((el, i) => { const key = ["customers","products","rating"][i]; if (c.stats[key]) el.textContent = c.stats[key]; });
    if (Array.isArray(c.features)) { const list = document.querySelector(".features"); if (list) { list.textContent = ""; c.features.forEach(item => { const li = document.createElement("li"); li.textContent = "✓ " + item; list.append(li); }); } }

    const cards = document.querySelectorAll(".contact-card p");
    if (cards[0] && c.address) cards[0].textContent = c.address;
    if (cards[1] && c.phone) cards[1].textContent = c.phone;
    if (cards[2] && c.email) cards[2].textContent = c.email;
    const wa = document.querySelector(".float-btn.whatsapp");
    const tg = document.querySelector(".float-btn.telegram");
    const ai = document.getElementById("aiChatBtn");
    if (wa) { wa.style.display = c.showFloatWhatsapp === false ? "none" : ""; if (c.whatsapp) wa.href = "https://wa.me/" + c.whatsapp; }
    if (tg) { tg.style.display = c.showFloatTelegram === false ? "none" : ""; if (c.telegramBot) tg.href = "https://t.me/" + c.telegramBot; }
    if (ai) ai.style.display = c.showFloatAI === false ? "none" : "";
    const visibility = [["about","showAbout"],["contact","showContact"]];
    visibility.forEach(([id, key]) => { const el = document.getElementById(id); if (el) el.style.display = c[key] === false ? "none" : ""; });
    const cats = document.querySelector(".categories"); if (cats) cats.style.display = c.showCategories === false ? "none" : "";

    if (Array.isArray(c.sectionOrder)) {
      const sections = { hero: ".hero", categories: ".categories", phones: "#phones", laptops: "#laptops", audio: "#audio", wearables: "#wearables", about: "#about", contact: "#contact" };
      const footer = document.querySelector(".footer");
      c.sectionOrder.forEach(key => { const el = document.querySelector(sections[key]); if (el && footer) footer.parentNode.insertBefore(el, footer); });
    }
  } catch (e) { console.error("Site config error", e); }
})();
