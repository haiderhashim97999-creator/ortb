# YieldProsper — Publisher Ad Network

Modern oRTB header bidding ad network with real-time reporting, admin dashboard, and publisher portal.

---

## 🚀 One-Click VPS Deployment

### Prerequisites
- Ubuntu 20.04+ VPS (2GB RAM minimum)
- Root or sudo access
- Domain name (optional, can use IP)

### Deploy in 3 Commands

```bash
# 1. Clone repository
git clone https://github.com/haiderhashim97999-creator/ortb.git
cd ortb

# 2. Make deploy script executable
chmod +x deploy.sh

# 3. Run deployment
./deploy.sh
```

The script will:
- ✅ Install Node.js 20 LTS
- ✅ Install PM2 process manager
- ✅ Install dependencies
- ✅ Setup database
- ✅ Build production app
- ✅ Start app on port 3000

### Post-Deployment Setup

1. **Edit environment variables:**
   ```bash
   nano .env
   ```
   Fill in:
   - `DATABASE_URL` — MongoDB Atlas connection string
   - `JWT_SECRET` — Random 32+ character string
   - `OMNIDEX_API_KEY` — Your demand API key
   - `NEXT_PUBLIC_APP_URL` — Your domain (https://yourdomain.com)

2. **Restart the app:**
   ```bash
   pm2 restart yieldprosper
   ```

3. **Access your app:**
   - Open `http://YOUR_VPS_IP:3000`
   - Default admin: Create via register page → admin manually approves

---

## 🐳 Docker Deployment (Alternative)

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 2. Build and run
docker-compose up -d

# 3. Check logs
docker-compose logs -f
```

Access at `http://localhost:3000`

---

## 🔧 Manual Deployment

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma generate
npx prisma db push

# 3. Build
npm run build

# 4. Start production server
npm start
```

---

## 📊 PM2 Commands

```bash
pm2 status              # Check app status
pm2 logs yieldprosper   # View logs
pm2 restart yieldprosper # Restart app
pm2 stop yieldprosper   # Stop app
pm2 monit               # Live monitoring
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-random-secret-here` |
| `OMNIDEX_API_KEY` | Demand API key | `your-api-key` |
| `NEXT_PUBLIC_APP_URL` | App URL | `https://yourdomain.com` |
| `NODE_ENV` | Environment | `production` |

---

## 🌐 Nginx Reverse Proxy (Optional)

For production with domain name:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then install SSL:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 🔄 GitHub Actions Auto-Deploy

Setup secrets in GitHub repository settings:
- `VPS_HOST` — Your VPS IP address
- `VPS_USERNAME` — SSH username (usually `root`)
- `VPS_SSH_KEY` — Private SSH key
- `VPS_PORT` — SSH port (default 22)

Every push to `main` branch will auto-deploy.

---

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js pages (dashboard, admin, auth)
│   ├── components/       # UI components
│   ├── lib/              # Utilities (auth, DB, API)
│   └── middleware.ts     # Auth middleware
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── deploy.sh             # One-click deploy script
├── ecosystem.config.js   # PM2 config
├── Dockerfile            # Docker image
└── docker-compose.yml    # Docker orchestration
```

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB + Prisma
- **Auth:** JWT (httpOnly cookies)
- **UI:** Tailwind CSS v4 + Framer Motion
- **Reporting:** Server-side API integration
- **Process Manager:** PM2
- **Deployment:** Docker / PM2 / GitHub Actions

---

## 📝 Default Credentials

No default admin exists. To create first admin:

1. Register as publisher at `/register`
2. Manually update database:
   ```bash
   # Connect to MongoDB
   # Update user role:
   db.users.updateOne(
     { email: "your@email.com" },
     { $set: { role: "admin", status: "active" } }
   )
   ```

---

## 🐛 Troubleshooting

**App won't start:**
```bash
pm2 logs yieldprosper --lines 50
```

**Database connection error:**
- Verify `DATABASE_URL` in `.env`
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 or your VPS IP)

**Port 3000 already in use:**
```bash
pm2 stop yieldprosper
# Or change port in ecosystem.config.js
```

**Build fails:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 📄 License

Proprietary — All rights reserved.

---

## 🤝 Support

For deployment support, contact the development team.
