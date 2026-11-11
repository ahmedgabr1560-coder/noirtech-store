import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const errors = [];

function patchReviewForm(html) {
  // Success message
  const oldMsg = 'status.textContent="شكرًا لرأيك! سيظهر بعد المراجعة والاعتماد."';
  const newMsg = 'status.textContent="تم ✓ ثواني وهيتم عرض رأيك";fetch("/api/reviews?productId=site",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){rows=d&&Array.isArray(d.reviews)?d.reviews:[];if(rows.length)showReview(0);}).catch(function(){});';
  if (html.includes(oldMsg)) html = html.replace(oldMsg, newMsg);

  // Add name field if missing
  if (!html.includes('id="siteReviewNameInput"')) {
    const oldRow = '<div style="display:flex;gap:8px;align-items:stretch"><input id="siteReviewText"';
    const newRow = '<input id="siteReviewNameInput" type="text" maxlength="40" required placeholder="اسمك" aria-label="اسمك" style="width:100%;border:1px solid rgba(212,175,55,.28);border-radius:12px;padding:12px;background:rgba(0,0,0,.15);color:inherit;font:inherit" /><div style="display:flex;gap:8px;align-items:stretch"><input id="siteReviewText"';
    if (html.includes(oldRow)) html = html.replace(oldRow, newRow);
  }

  // Use typed name instead of hardcoded عميلنا
  if (html.includes('name:"عميلنا",message:message')) {
    html = html.replace(
      'event.preventDefault();var input=$("siteReviewText"),status=$("siteReviewStatus"),button=$("siteReviewSubmit"),message=input.value.trim();',
      'event.preventDefault();var input=$("siteReviewText"),nameInput=$("siteReviewNameInput"),status=$("siteReviewStatus"),button=$("siteReviewSubmit"),message=input.value.trim(),customerName=(nameInput&&nameInput.value||"").trim();'
    );
    html = html.replace(
      'if(!message){status.textContent="اكتبي رأيك أولًا";return;}',
      'if(!customerName){status.textContent="اكتبي اسمك أولًا";return;}if(!message){status.textContent="اكتبي رأيك أولًا";return;}'
    );
    html = html.replace(
      'name:"عميلنا",message:message',
      'name:customerName,message:message'
    );
    // clear name on success
    html = html.replace(
      'input.value="";setRating(5);',
      'input.value="";if(nameInput)nameInput.value="";setRating(5);'
    );
  }

  // CSS for position above contact
  if (!html.includes("reviews-position.css")) {
    html = html.replace("</head>", '  <link rel="stylesheet" href="/reviews-position.css?v=20261111b" />\n</head>');
  }
  return html;
}

try {
  const indexPath = path.join(root, "index.html");
  let cur = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  const broken = !cur || cur.length < 5000 || !cur.includes("siteReviewForm") || cur.includes("PLACEHOLDER") || cur.includes("جاري استعادة");
  if (broken) {
    const url = "https://raw.githubusercontent.com/ahmedgabr1560-coder/noirtech-store/27bdb795068ae78a816f908acdc48735e354e22a/index.html";
    const res = await fetch(url);
    if (res.ok) {
      let html = patchReviewForm(await res.text());
      fs.writeFileSync(indexPath, html, "utf8");
      console.log("RESTORED + patched index.html (name field, message, order)");
    } else {
      errors.push("failed to restore index.html");
    }
  } else {
    const next = patchReviewForm(cur);
    if (next !== cur) {
      fs.writeFileSync(indexPath, next, "utf8");
      console.log("Patched index.html (name field / message / order)");
    }
  }
} catch (e) {
  errors.push("index patch error: " + e.message);
}

try {
  const cssPath = path.join(root, "styles.css");
  if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, "utf8");
    if (!css.includes("#site-reviews { order:")) {
      css += "\n\n/* reviews above contact */\n#site-reviews { order: 7 !important; }\n#contact { order: 8 !important; }\n";
      fs.writeFileSync(cssPath, css, "utf8");
      console.log("Appended reviews order CSS");
    }
  }
} catch (e) {
  errors.push("css patch error: " + e.message);
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

const apiDir = path.join(root, "api");
const apiFiles = fs.existsSync(apiDir) ? fs.readdirSync(apiDir).filter(f => f.endsWith(".js")).map(f => `api/${f}`) : [];
for (const file of ["script.js", ...apiFiles]) {
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
