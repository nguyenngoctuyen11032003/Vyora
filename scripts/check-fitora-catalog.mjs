// Fails when the code copied from Fitora (src/lib/fitora/) drifts from Fitora `main`, so Vyora and
// Fitora always compute the same kcal, titles and activity list (spec §4, §10).
//
// Usage: node scripts/check-fitora-catalog.mjs <path-to-Fitora-checkout>
//
// Checks:
//   1. src/lib/fitora/activities.ts == Fitora src/data/activities.ts, ignoring the header comment and
//      the one redirected import line (`./types` instead of `@/types/db`).
//   2. Every `export function|const` in src/lib/fitora/lib.ts is byte-identical (modulo line endings
//      and trailing spaces) to the same declaration in Fitora src/features/workout/lib.ts or
//      src/lib/energy.ts.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const gymRoot = path.resolve(here, "..");
const fitoraRoot = path.resolve(process.argv[2] ?? path.join(gymRoot, "..", "Fitora"));

const errors = [];
const read = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "");

function need(p) {
  if (!existsSync(p)) {
    console.error(`::error::Không tìm thấy ${p}. Truyền đường dẫn checkout Fitora làm tham số.`);
    process.exit(2);
  }
  return read(p);
}

/** Body of a module after its first import line (drops header comments and the import itself). */
function afterImport(src, file) {
  const lines = src.split("\n");
  const i = lines.findIndex((l) => /^import\b/.test(l));
  if (i < 0) errors.push(`${file}: không thấy dòng import để căn chỉnh.`);
  return lines.slice(i + 1).join("\n").trim();
}

/** Every top-level `export function NAME` / `export const NAME` declaration, keyed by name. */
function declarations(src) {
  const out = new Map();
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = /^export (?:async )?(function|const) (\w+)/.exec(lines[i]);
    if (!m) continue;
    let end = i;
    if (m[1] === "function" || /[{[(]\s*$/.test(lines[i])) {
      while (end < lines.length && !/^[}\])]/.test(lines[end])) end++;
    } else {
      while (end < lines.length && !/;\s*$/.test(lines[end])) end++;
    }
    out.set(m[2], lines.slice(i, end + 1).join("\n"));
  }
  return out;
}

function firstDiff(a, b) {
  const la = a.split("\n");
  const lb = b.split("\n");
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) return `dòng ${i + 1}:\n    Vyora : ${la[i] ?? "<hết>"}\n    Fitora: ${lb[i] ?? "<hết>"}`;
  }
  return "";
}

// 1. Activity catalogue
const gymCat = need(path.join(gymRoot, "src/lib/fitora/activities.ts"));
const fitCat = need(path.join(fitoraRoot, "src/data/activities.ts"));
const a = afterImport(gymCat, "activities.ts (Vyora)");
const b = afterImport(fitCat, "activities.ts (Fitora)");
if (a !== b) errors.push(`Danh mục hoạt động lệch với Fitora src/data/activities.ts — ${firstDiff(a, b)}`);

// 2. Copied helpers
const gymLib = declarations(need(path.join(gymRoot, "src/lib/fitora/lib.ts")));
const fitLib = new Map([
  ...declarations(need(path.join(fitoraRoot, "src/lib/energy.ts"))),
  ...declarations(need(path.join(fitoraRoot, "src/features/workout/lib.ts"))),
]);
for (const [name, body] of gymLib) {
  const theirs = fitLib.get(name);
  if (theirs === undefined) errors.push(`${name}: không còn tồn tại trong Fitora (energy.ts / workout/lib.ts).`);
  else if (theirs !== body) errors.push(`${name} lệch với Fitora — ${firstDiff(body, theirs)}`);
}

if (errors.length) {
  for (const e of errors) console.error(`::error::${e}`);
  console.error(`\n${errors.length} chỗ lệch. Chép lại từ Fitora vào src/lib/fitora/ (không sửa tay).`);
  process.exit(1);
}
console.log(`Fitora compat OK: danh mục hoạt động + ${gymLib.size} hàm/hằng số khớp với ${fitoraRoot}.`);
