// Guard: everything in NEXT_PUBLIC_* is inlined into the public JS bundle. Fail the build if the
// Supabase key is anything other than the public anon / publishable key (same rules as Fitora).
//
// Usage: node .github/scripts/check-public-env.mjs [--strict]
//   --strict  require URL + anon key to be set (production deploy)

const strict = process.argv.includes("--strict");
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const errors = [];

if (!url || !key) {
  if (strict) {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY phải được đặt trong GitHub → Settings → Secrets and variables → Actions → Variables.",
    );
  }
} else {
  if (!/^https:\/\/[^/]+$/.test(url.replace(/\/$/, ""))) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL phải có dạng https://<project-ref>.supabase.co");
  }

  if (key.startsWith("sb_secret_")) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY đang là SECRET key (sb_secret_…). Chỉ dùng publishable/anon key.");
  } else if (key.startsWith("eyJ")) {
    let role;
    try {
      const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      role = JSON.parse(Buffer.from(payload, "base64").toString("utf8")).role;
    } catch {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY không phải JWT hợp lệ.");
    }
    if (role && role !== "anon") {
      errors.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY có role "${role}" — chỉ được dùng key role "anon".`);
    }
  } else if (!key.startsWith("sb_publishable_")) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY không giống anon JWT (eyJ…) hay publishable key (sb_publishable_…).");
  }
}

if (basePath && !/^\/[A-Za-z0-9._-]+$/.test(basePath)) {
  errors.push(`NEXT_PUBLIC_BASE_PATH "${basePath}" phải có dạng /<tên-repo> (không có / ở cuối).`);
}

// Any other NEXT_PUBLIC_* variable that looks like a secret would also be bundled.
for (const name of Object.keys(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && /SECRET|PASSWORD|SERVICE_ROLE|PRIVATE|DB_URL|DATABASE|TOKEN/i.test(name)) {
    errors.push(`${name} trông giống secret nhưng có tiền tố NEXT_PUBLIC_ → sẽ bị lộ trong bundle.`);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`::error::${e}`);
  process.exit(1);
}
console.log(url && key ? "Public env OK (anon/publishable key only)." : "Public env not set — build continues with empty values (non-strict).");
