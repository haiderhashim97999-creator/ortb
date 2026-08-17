#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# YieldProsper — One-Click VPS Deploy Script
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit on any error

echo "🚀 YieldProsper Deployment Starting..."
echo ""

# ── Step 1: System check ───────────────────────────────────────────────────
echo "📦 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 process manager..."
    sudo npm install -g pm2
fi

echo "✅ Node.js $(node -v) | npm $(npm -v) | PM2 $(pm2 -v)"
echo ""

# ── Step 2: Clone/Pull latest code ────────────────────────────────────────
APP_DIR="/var/www/yieldprosper"
REPO_URL="https://github.com/haiderhashim97999-creator/ortb.git"

if [ -d "$APP_DIR" ]; then
    echo "📂 Directory exists. Pulling latest changes..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "📂 Cloning repository..."
    sudo mkdir -p /var/www
    sudo git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

echo ""

# ── Step 3: Environment setup ─────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your real credentials:"
    echo "   - DATABASE_URL (MongoDB Atlas)"
    echo "   - JWT_SECRET (random 32+ char string)"
    echo "   - OMNIDEX_API_KEY"
    echo "   - NEXT_PUBLIC_APP_URL"
    echo ""
    read -p "Press Enter after you've edited .env..."
fi

# ── Step 4: Install dependencies ──────────────────────────────────────────
echo "📦 Installing dependencies..."
npm install --production=false

echo ""

# ── Step 5: Prisma setup ──────────────────────────────────────────────────
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

echo ""

# ── Step 6: Build Next.js app ─────────────────────────────────────────────
echo "🔨 Building production app..."
npm run build

echo ""

# ── Step 7: PM2 deployment ────────────────────────────────────────────────
echo "🚀 Starting app with PM2..."
pm2 delete yieldprosper 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 App status:"
pm2 status
echo ""
echo "🌐 Access your app at: http://$(curl -s ifconfig.me):3000"
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs yieldprosper    # View logs"
echo "   pm2 restart yieldprosper # Restart app"
echo "   pm2 stop yieldprosper    # Stop app"
echo "   pm2 monit                # Monitor dashboard"
echo ""
