import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const required = ["index.html", "admin.html", "product.html", "script.js", "vercel.json"];
const errors = [];

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
  console.error("SITE VALIDATION FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("SITE VALIDATION PASSED: HTML, JavaScript, and Vercel configuration are intact.");
