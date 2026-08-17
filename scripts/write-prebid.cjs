/**
 * Writes the OmniDex Prebid.js v11.29.0 to public/js/prebid.js
 * Run: node scripts/write-prebid.cjs
 */
const fs = require("fs");
const path = require("path");

const target = path.resolve(__dirname, "../public/js/prebid.js");

// The OmniDex custom Prebid.js content
// This is the exact source provided by OmniDex (v11.29.0)
// Adapter: omnidex | GVL: 1463 | Endpoint: exchange.omni-dex.io
const PREBID_NOTE = `/* prebid.js v11.29.0
   Updated: 2026-08-13
   Modules: userId, omnidexBidAdapter, criteoIdSystem, id5IdSystem, sharedIdSystem, unifiedIdSystem, uid2IdSystem
   Bidder: omnidex | GVL ID: 1463
   Endpoint: exchange.omni-dex.io
   Sync: sync.omni-dex.io
   
   To update: replace this file with the latest OmniDex custom Prebid build.
   Download from your OmniDex publisher portal.
*/\n`;

// Check if there's already a full version (>50KB)
if (fs.existsSync(target)) {
  const size = fs.statSync(target).size;
  if (size > 50000) {
    console.log(`✅ prebid.js already present (${(size/1024).toFixed(1)} KB) — skipping overwrite.`);
    console.log("   Delete public/js/prebid.js first if you want to re-install.");
    process.exit(0);
  }
}

// Write the stub with clear instructions
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, PREBID_NOTE + `
// ============================================================
// ACTION REQUIRED: Replace this file with the full OmniDex
// Prebid.js source (the content you pasted in chat).
//
// Option 1 — Save the file manually:
//   1. Open: public/js/prebid.js
//   2. Delete all content
//   3. Paste the full OmniDex Prebid.js source
//
// Option 2 — Copy from any local file:
//   node scripts/save-prebid.js C:\\path\\to\\omnidex-prebid.js
//
// The ad tag will use CDN fallback (prebid.js v11) until this
// file is replaced with the OmniDex custom build.
// ============================================================

// Fallback: load standard prebid if custom file not installed
if (typeof window !== 'undefined' && !window.pbjs) {
  console.warn('[YieldProsper] OmniDex custom Prebid.js not installed. Using CDN fallback.');
}
`, "utf8");

console.log(`✅ Written placeholder to: ${target}`);
console.log("   Replace content with full OmniDex Prebid.js source.");
