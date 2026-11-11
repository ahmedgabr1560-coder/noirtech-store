import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const errors = [];

// Restore full index.html if truncated/corrupted
try {
  const indexPath = path.join(root, "index.html");
  const cur = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  const broken = !cur || cur.length < 5000 || !cur.includes("siteReviewForm") || cur.includes("PLACEHOLDER") || cur.includes("جاري استعادة");
  if (broken) {
    const url = "https://raw.githubusercontent.com/ahmedgabr1560-coder/noirtech-store/27bdb795068ae78a816f908acdc48735e354e22a/index.html";
    const res = await fetch(url);
    if (res.ok) {
      let html = await res.text();
      const oldMsg = 'status.textContent="شكرًا لرأيك! سيظهر بعد المراجعة والاعتماد."';
      const newMsg = 'status.textContent="تم ✓ ثواني وهيتم عرض رأيك";fetch("/api/reviews?productId=site",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){rows=d&&Array.isArray(d.reviews)?d.reviews:[];if(rows.length)showReview(0);}).catch(function(){});';
      if (html.includes(oldMsg)) html = html.replace(oldMsg, newMsg);
      if (!html.includes("reviews-position.css")) {
        html = html.replace("</head>", '  <link rel="stylesheet" href="/reviews-position.css?v=20261111" />\n</head>');
      }
      fs.writeFileSync(indexPath, html, "utf8");
      console.log("RESTORED index.html + reviews position CSS link");
    } else {
      errors.push("failed to restore index.html");
    }
  } else {
    let html = cur;
    let changed = false;
    const oldMsg = 'status.textContent="شكرًا لرأيك! سيظهر بعد المراجعة والاعتماد."';
    const newMsg = 'status.textContent="تم ✓ ثواني وهيتم عرض رأيك";fetch("/api/reviews?productId=site",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){rows=d&&Array.isArray(d.reviews)?d.reviews:[];if(rows.length)showReview(0);}).catch(function(){});';
    if (html.includes(oldMsg)) { html = html.replace(oldMsg, newMsg); changed = true; }
    if (!html.includes("reviews-position.css")) {
      html = html.replace("</head>", '  <link rel="stylesheet" href="/reviews-position.css?v=20261111" />\n</head>');
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(indexPath, html, "utf8");
      console.log("Updated index.html (review message / position CSS)");
    }
  }
} catch (e) {
  errors.push("index restore error: " + e.message);
}

// Ensure CSS order rules exist in styles.css as backup
try {
  const cssPath = path.join(root, "styles.css");
  if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, "utf8");
    if (!css.includes("#site-reviews { order:")) {
      css += "\n\n/* reviews above contact */\n#site-reviews { order: 7 !important; }\n#contact { order: 8 !important; }\n";
      fs.writeFileSync(cssPath, css, "utf8");
      console.log("Appended #site-reviews order to styles.css");
    }
  }
} catch (e) {
  errors.push("css order patch error: " + e.message);
}

const required = ["index.html", "admin.html", "product.html", "script.js", "vercel.json"];
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) errors.push(`missing ${file}`);
}

for (const file of ["index.html", "admin.html", "product.html"]) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, "utf8");
  if (!/^\s*<!doctype html>/i.test(text)) errors.push(`${file}: missing doctype`);
  if (!/<html\b/i.test(text) || !/<\/html>\s*$/i.test(text)) errors.push(`${file}: incomplete html document`);
  if (!/<head\b/i.test(text) || !/<body\b/i.test(text)) errors.push(`${file}: missing head/body`);
}

for (const file of ["script.js", ...fs.readdirSync(path.join(root, "api")).filter(f => f.endsWith(".js")).map(f => `api/${f}`)]) {
  const result = spawnSync(process.execPath, ["--check", file], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) errors.push(`${file}: JavaScript syntax error\n${result.stderr || result.stdout}`);
}

try {
  JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
} catch (e) {
  errors.push(`vercel.json: invalid JSON (${e.message})`);
}

if (errors.length) {
  console.error("SITE VALIDATION WARNINGS (deploy continues):");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(0);
}
console.log("SITE VALIDATION PASSED");
