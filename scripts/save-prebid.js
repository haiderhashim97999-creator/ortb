/**
 * save-prebid.js
 * Saves the OmniDex Prebid.js content passed via stdin or a file argument.
 *
 * Usage (from file):
 *   node scripts/save-prebid.js path/to/omnidex-prebid.js
 *
 * Usage (from clipboard on Windows):
 *   Get-Clipboard | node scripts/save-prebid.js
 */
const fs = require("fs");
const path = require("path");

const target = path.resolve(__dirname, "../public/js/prebid.js");
const source = process.argv[2];

if (source) {
  // Copy from file
  if (!fs.existsSync(source)) {
    console.error("❌ File not found: " + source);
    process.exit(1);
  }
  fs.copyFileSync(source, target);
  console.log("✅ Prebid.js saved from: " + source);
} else {
  // Read from stdin
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", chunk => { data += chunk; });
  process.stdin.on("end", () => {
    if (!data.trim()) {
      console.error("❌ No content provided via stdin");
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data, "utf8");
    console.log("✅ Prebid.js saved (" + (data.length / 1024).toFixed(1) + " KB)");
  });
}

const stats = fs.existsSync(target) ? fs.statSync(target) : null;
if (stats) {
  console.log("   Target: " + target);
  console.log("   Size:   " + (stats.size / 1024).toFixed(1) + " KB");
}
