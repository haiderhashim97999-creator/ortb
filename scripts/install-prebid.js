/**
 * YieldProsper - OmniDex Prebid.js Installer
 * 
 * Run: node scripts/install-prebid.js
 * 
 * This script copies the OmniDex custom Prebid.js build
 * from wherever you have saved it to the correct location.
 * 
 * Usage:
 *   node scripts/install-prebid.js /path/to/your/prebid.js
 * 
 * Or, simply copy prebid.js manually to: public/js/prebid.js
 */

const fs = require("fs");
const path = require("path");

const target = path.resolve(__dirname, "../public/js/prebid.js");
const source = process.argv[2];

if (!source) {
  console.log("\n📦 OmniDex Prebid.js Installer");
  console.log("================================");
  console.log("Usage: node scripts/install-prebid.js <path-to-prebid.js>");
  console.log("\nOr manually copy your Prebid.js file to:");
  console.log("  " + target);
  console.log("\nThe file will be served at: /js/prebid.js");
  console.log("Ad tags load it automatically with CDN fallback.\n");
  process.exit(0);
}

if (!fs.existsSync(source)) {
  console.error("❌ Source file not found: " + source);
  process.exit(1);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);

const stats = fs.statSync(target);
console.log("✅ Prebid.js installed successfully!");
console.log("   Source: " + source);
console.log("   Target: " + target);
console.log("   Size:   " + (stats.size / 1024).toFixed(1) + " KB");
console.log("\n🚀 The file is now served at /js/prebid.js");
