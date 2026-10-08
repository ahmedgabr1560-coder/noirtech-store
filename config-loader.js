(async function applySiteConfig() {
  try {
    const r = await fetch("/site-config.json?t=" + Date.now());
    if (!r.ok) return;
    const c = await r.json();
    const root = document.documentElement;
    if (c.colors) {
      const map = [
        ["bg", "--bg"], ["bgCard", "--bg-card"], ["gold", "--gold"],
        ["goldLight", "--gold-light"], ["goldDark", "--gold-dark"],
        ["accent", "--accent"], ["text", "--text"], ["textMuted", "--text-muted"]
      ];
      map.forEach(([k, css]) => { if (c.colors[k]) root.style.setProperty(css, c.colors[k]); });
      if (c.colors.bg) document.body.style.background = c.colors.bg;
      if (c.colors.text) document.body.style.color = c.colors.text;
    }
    const text = (sel, val) => { const el = document.querySelector(sel); if (el && val != null) el.textContent = val; };
    text(".owner-name", c.ownerName);
    text(".hero-badge", c.heroBadge);
    text(".hero-desc", c.heroDesc);
    text(".btn-primary", c.heroBtn);
    if (c.heroHighlight) {
      const h1 = document.querySelector(".hero h1");
      if (h1) h1.innerHTML = (c.heroTitle || "إلكترونيات") + "<br><span>" + c.heroHighlight + "</span>";
    }
    if (c.siteName) document.title = c.siteName + " | إلكترونيات فاخرة";
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
    const about = document.getElementById("about");
    const contact = document.getElementById("contact");
    const cats = document.querySelector(".categories");
    if (about) about.style.display = c.showAbout === false ? "none" : "";
    if (contact) contact.style.display = c.showContact === false ? "none" : "";
    if (cats) cats.style.display = c.showCategories === false ? "none" : "";
    if (c.stats) {
      const stats = document.querySelectorAll(".stat h3");
      if (stats[0] && c.stats.customers) stats[0].textContent = c.stats.customers;
      if (stats[1] && c.stats.products) stats[1].textContent = c.stats.products;
      if (stats[2] && c.stats.rating) stats[2].textContent = c.stats.rating;
    }
  } catch (e) {}
})();
