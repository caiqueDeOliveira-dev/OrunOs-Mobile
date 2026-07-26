const fs = require("fs");
const path = require("path");
const nmDir = path.join(process.cwd(), "node_modules");
const expoPkgs = fs.readdirSync(nmDir).filter(f => f.startsWith("expo-") || f === "expo");
const missing = new Set();
expoPkgs.forEach(p => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(nmDir, p, "package.json"), "utf8"));
    if (pkg.peerDependencies) {
      Object.keys(pkg.peerDependencies).forEach(dep => {
        try { require.resolve(dep); } catch { missing.add(dep + " (needed by " + p + ")"); }
      });
    }
  } catch {}
});
if (missing.size === 0) console.log("No missing expo peer deps!");
else { console.log("Missing:"); missing.forEach(m => console.log("  -", m)); }
