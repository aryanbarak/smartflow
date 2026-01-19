# DailyFlow GitHub Actions Deployment - Quick Start

## ✅ Files Created

1. **`.github/workflows/deploy-dailyflow.yml`**
   - GitHub Actions workflow for automated deployment
   - Triggers on push to `main` or manual dispatch
   - Builds Vite app and deploys to EC2

2. **`scripts/deploy_dailyflow.sh`**
   - Server-side deployment script
   - Install location: `/opt/dailyflow-deploy/deploy_dailyflow.sh`
   - Handles atomic release switching and nginx reload

3. **`scripts/server-setup.sh`**
   - One-time server setup script
   - Creates directories, installs dependencies, configures permissions

4. **`DEPLOYMENT_SETUP.md`**
   - Complete documentation with troubleshooting

## 🚀 Quick Setup (3 Steps)

### Step 1: Server Setup (One Time)

```bash
# Copy script to server
scp scripts/server-setup.sh ec2-user@[YOUR_EC2_IP]:~/

# SSH to server and run
ssh ec2-user@[YOUR_EC2_IP]
sudo bash server-setup.sh
```

### Step 2: Configure GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these 4 secrets:

| Secret Name | Value |
|------------|-------|
| `SSH_HOST` | Your EC2 public IP (e.g., `18.196.183.4`) |
| `SSH_USER` | `ec2-user` |
| `SSH_PORT` | `22` |
| `SSH_PRIVATE_KEY` | Your SSH private key (entire content) |

**To get SSH private key:**
```bash
# Generate new deploy key
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/dailyflow_deploy

# Add to server
ssh-copy-id -i ~/.ssh/dailyflow_deploy.pub ec2-user@[YOUR_EC2_IP]

# Copy private key (include header/footer)
cat ~/.ssh/dailyflow_deploy
```

### Step 3: Commit and Push

```bash
git add .github/workflows/deploy-dailyflow.yml scripts/ DEPLOYMENT_SETUP.md
git commit -m "ci: add GitHub Actions automated deployment"
git push origin main
```

**Done!** Deployment will run automatically.

## 📋 Post-Deployment Checklist

After first deployment:

```bash
# 1. Check GitHub Actions
# Go to: Repository → Actions → View latest workflow run

# 2. Verify on server
ssh ec2-user@[YOUR_EC2_IP]
sudo tail -50 /var/log/dailyflow-deploy.log
ls -lh /var/www/barakzai.cloud/

# 3. Test site
curl -I https://barakzai.cloud
# Should return: HTTP/1.1 200 OK

# 4. Browser test
# Visit: https://barakzai.cloud
# Check: AI functionality works
```

## 🔄 How It Works

```
Push to main → GitHub Actions runs
    ↓
Build: npm ci && npm run build
    ↓
Upload: rsync dist/ to EC2
    ↓
Deploy: Atomic symlink swap
    ↓
Reload: systemctl reload nginx
    ↓
Verify: curl https://barakzai.cloud
```

**Release Strategy:**
- Stored in: `/var/www/barakzai.cloud/releases/YYYYMMDD_HHMMSS/`
- Current: `/var/www/barakzai.cloud/dist` → symlink to latest
- Keeps last 3 releases for rollback

## ⚡ Key Features

- ✅ **Zero-downtime deployment** (atomic symlink swap)
- ✅ **Automatic rollback** (keeps 3 previous releases)
- ✅ **Fast uploads** (rsync with compression)
- ✅ **Safety checks** (verifies build before deploy)
- ✅ **Detailed logging** (`/var/log/dailyflow-deploy.log`)
- ✅ **Manual trigger** (workflow_dispatch)

## 🆘 Quick Troubleshooting

**Deployment fails?**
```bash
# Check GitHub Actions logs
# Repository → Actions → Failed workflow → View logs

# Check server logs
ssh ec2-user@[EC2_IP] "sudo tail -100 /var/log/dailyflow-deploy.log"
```

**Site shows old version?**
```bash
# Hard refresh browser: Ctrl+Shift+R
# Or purge Cloudflare cache
```

**Rollback to previous release?**
```bash
ssh ec2-user@[EC2_IP]
# List releases
ls -lt /var/www/barakzai.cloud/releases/
# Deploy previous
sudo /opt/dailyflow-deploy/deploy_dailyflow.sh /var/www/barakzai.cloud/releases/[PREVIOUS_TIMESTAMP]
```

## 📚 Full Documentation

See **DEPLOYMENT_SETUP.md** for complete documentation including:
- Detailed troubleshooting
- Manual deployment procedure
- Security best practices
- Monitoring and logs

---

**Quick Links:**
- 🌐 Production: https://barakzai.cloud
- 🤖 API: https://api.barakzai.cloud  
- 📊 Actions: https://github.com/[your-username]/dailyflow/actions
