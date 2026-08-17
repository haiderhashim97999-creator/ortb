-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'publisher',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerType" TEXT NOT NULL DEFAULT 'PUBLISHER',
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "revenueShare" REAL NOT NULL DEFAULT 70.0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Publisher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publisherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "adsTxtContent" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adType" TEXT NOT NULL,
    "sizes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "bidFloor" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdUnit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrtbDemandSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL DEFAULT '',
    "timeout" INTEGER NOT NULL DEFAULT 300,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "mediaTypes" TEXT NOT NULL DEFAULT 'banner,video',
    "floorCpm" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReportCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publisherId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0.0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cpm" REAL NOT NULL DEFAULT 0.0,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKey_key" ON "User"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_userId_key" ON "Publisher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_sellerId_key" ON "Publisher"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_publisherId_domain_key" ON "Site"("publisherId", "domain");

-- CreateIndex
CREATE INDEX "ReportCache_publisherId_idx" ON "ReportCache"("publisherId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCache_publisherId_siteId_date_key" ON "ReportCache"("publisherId", "siteId", "date");
