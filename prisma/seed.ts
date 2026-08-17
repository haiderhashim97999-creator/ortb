import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to MongoDB...");

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@yieldprosper.com" },
    update: { password: adminPassword, status: "active", role: "admin" },
    create: {
      email: "admin@yieldprosper.com",
      password: adminPassword,
      name: "YieldProsper Admin",
      role: "admin",
      status: "active",
    },
  });
  console.log("✅ Admin:", admin.email);

  // Demo publisher
  const pubPassword = await bcrypt.hash("demo123", 12);
  const existingPub = await prisma.user.findUnique({
    where: { email: "demo@publisher.com" },
    include: { publisher: true },
  });

  if (existingPub) {
    await prisma.user.update({
      where: { email: "demo@publisher.com" },
      data: { password: pubPassword, status: "active" },
    });
    console.log("✅ Publisher updated:", existingPub.email);
  } else {
    const pubUser = await prisma.user.create({
      data: {
        email: "demo@publisher.com",
        password: pubPassword,
        name: "Demo Publisher",
        role: "publisher",
        status: "active",
        publisher: {
          create: {
            companyName: "Demo Media Inc",
            website: "https://demo-publisher.com",
            revenueShare: 70,
            sites: {
              create: {
                name: "Demo News",
                domain: "demo-publisher.com",
                status: "active",
              },
            },
          },
        },
      },
    });
    console.log("✅ Publisher created:", pubUser.email);
  }

  // Sample oRTB
  const existingOrtb = await prisma.ortbDemandSource.findFirst({
    where: { name: "Sample Demand Partner (Inactive)" },
  });
  if (!existingOrtb) {
    await prisma.ortbDemandSource.create({
      data: {
        name: "Sample Demand Partner (Inactive)",
        endpoint: "https://rtb.example.com/openrtb2/auction",
        timeout: 300,
        active: false,
        priority: 2,
        mediaTypes: "banner,video",
        floorCpm: 0.5,
      },
    });
    console.log("✅ oRTB sample created");
  }

  console.log("\n=== Seed complete ===");
  console.log("Admin:     admin@yieldprosper.com / admin123");
  console.log("Publisher: demo@publisher.com / demo123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
