const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

// Use the generated client path (same as seed.ts uses)
const dbPath = path.resolve(__dirname, "../dev.db");
const adapter = new PrismaBetterSqlite3({ url: "file:" + dbPath });

// Direct SQLite query to verify without Prisma client
const Database = require("better-sqlite3");
const db = new Database(dbPath);

async function main() {
  const users = db.prepare("SELECT * FROM User").all();
  console.log("Total users in DB:", users.length);

  for (const u of users) {
    console.log(`\n  Email:  ${u.email}`);
    console.log(`  Role:   ${u.role}`);
    console.log(`  Status: ${u.status}`);
    console.log(`  Hash:   ${u.password.substring(0, 30)}...`);

    const testPass = u.role === "admin" ? "admin123" : "demo123";
    const match = await bcrypt.compare(testPass, u.password);
    console.log(`  Pass '${testPass}' => ${match ? "✅ MATCH" : "❌ NO MATCH"}`);
  }
  db.close();
}
main().catch(e => { console.error(e); db.close(); });
