# 🚀 YieldProsper — Deployment Guide

## Quick Start — GitHub Push (from Windows)

Since Git is not available in your PowerShell, use **GitHub Desktop** or **VS Code Git** to push:

### Option 1: GitHub Desktop
1. Download GitHub Desktop: https://desktop.github.com/
2. Open the project folder: `File → Add Local Repository`
3. Select folder: `C:\Users\Syed_Haider\Music\Yieldpros\yieldprosper`
4. Commit all files: Add message "Initial commit"
5. Publish to: `haiderhashim97999-creator/ortb` (main branch)

### Option 2: VS Code Git
1. Open project in VS Code
2. Click Source Control panel (Ctrl+Shift+G)
3. Click "Initialize Repository"
4. Stage all files (+ icon)
5. Commit message: "Initial commit"
6. Click "..." → Remote → Add Remote
7. Enter: `https://github.com/haiderhashim97999-creator/ortb.git`
8. Push to main

### Option 3: Install Git for Windows
```powershell
# Download from: https://git-scm.com/download/win
# After install, restart PowerShell, then:
cd "C:\Users\Syed_Haider\Music\Yieldpros\yieldprosper"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/haiderhashim97999-creator/ortb.git
git push -u origin main
```

---

## 🌐 VPS Deployment (Ubuntu 20.04+)

### 1. Login to VPS
```bash
ssh root@YOUR_VPS_IP
```

### 2. One-Command Deploy
```bash
curl -fsSL https://raw.githubusercontent.com/haiderhashim97999-creator/ortb/main/deploy.sh | bash
```

**OR manual deploy:**

```bash
# Clone repository
git clone https://github.com/haiderhashim97999-creator/ortb.git
cd ortb

# Run deploy script
chmod +x deploy.sh
./deploy.sh
```

### 3. Configure Environment
```bash
nano .env
```

**Required variables:**
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/yieldprosper?retryWrites=true&w=majority"
JWT_SECRET="your-random-32-char-secret-here"
OMNIDEX_API_KEY="your-demand-api-key"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

Save and exit: `Ctrl+X → Y → Enter`

### 4. Restart App
```bash
pm2 restart yieldprosper
```

### 5. Access App
```
http://YOUR_VPS_IP:3000
```

---

## 🐳 Docker Deployment

### Prerequisites
- Docker + Docker Compose installed

### Deploy
```bash
# 1. Clone repo
git clone https://github.com/haiderhashim97999-creator/ortb.git
cd ortb

# 2. Create .env
cp .env.example .env
nano .env  # Fill in your credentials

# 3. Build and run
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f
```

**Access:** `http://localhost:3000`

---

## 🔄 Auto-Deploy with GitHub Actions

### Setup (One-Time)

1. **Generate SSH Key on VPS:**
   ```bash
   ssh-keygen -t ed25519 -C "github-actions"
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   cat ~/.ssh/id_ed25519  # Copy this private key
   ```

2. **Add GitHub Secrets:**
   - Go to: `https://github.com/haiderhashim97999-creator/ortb/settings/secrets/actions`
   - Add:
     - `VPS_HOST` = Your VPS IP (e.g., `203.0.113.45`)
     - `VPS_USERNAME` = `root` (or your SSH user)
     - `VPS_SSH_KEY` = Private key from step 1
     - `VPS_PORT` = `22` (default SSH port)

3. **Initial Deploy:**
   ```bash
   # On VPS, run deploy.sh once manually
   cd /var/www/yieldprosper
   ./deploy.sh
   ```

4. **Auto-Deploy:**
   - Every `git push` to `main` will auto-deploy
   - Check status: `https://github.com/haiderhashim97999-creator/ortb/actions`

---

## 🌍 Domain Setup (Optional)

### 1. Point Domain to VPS
Add DNS A record:
```
Type: A
Name: @
Value: YOUR_VPS_IP
TTL: 3600
```

### 2. Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

### 3. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/yieldprosper
```

**Paste:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/yieldprosper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Install SSL (Free)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Access:** `https://yourdomain.com`

---

## 📊 Monitoring & Management

### PM2 Commands
```bash
pm2 status                # Check running apps
pm2 logs yieldprosper     # View logs
pm2 monit                 # Live CPU/Memory monitor
pm2 restart yieldprosper  # Restart app
pm2 stop yieldprosper     # Stop app
pm2 delete yieldprosper   # Remove from PM2
```

### Update App
```bash
cd /var/www/yieldprosper
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart yieldprosper
```

### View Logs
```bash
pm2 logs yieldprosper --lines 100
# Or
tail -f /var/www/yieldprosper/logs/out.log
tail -f /var/www/yieldprosper/logs/err.log
```

---

## 🔐 Security Checklist

- [ ] Change default SSH port (edit `/etc/ssh/sshd_config`)
- [ ] Setup UFW firewall:
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Disable root SSH login
- [ ] Use strong JWT_SECRET (32+ chars, random)
- [ ] MongoDB Atlas IP whitelist (add VPS IP)
- [ ] Enable 2FA on GitHub
- [ ] Regular backups (MongoDB Atlas auto-backup)

---

## 🐛 Troubleshooting

### App won't start
```bash
pm2 logs yieldprosper --lines 50
```

### Port 3000 already in use
```bash
sudo lsof -i :3000
pm2 delete yieldprosper
pm2 start ecosystem.config.js
```

### Database connection error
- Check `DATABASE_URL` in `.env`
- Verify MongoDB Atlas IP whitelist
- Test connection:
  ```bash
  npx prisma db push
  ```

### Build fails
```bash
cd /var/www/yieldprosper
rm -rf .next node_modules
npm install
npm run build
```

### Out of memory during build
Add swap:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📞 Support

Issues: https://github.com/haiderhashim97999-creator/ortb/issues
