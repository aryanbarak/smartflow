# DailyFlow Automated Deployment Setup

## Overview

This document describes the automated deployment system for DailyFlow frontend using GitHub Actions.

## Architecture

```
GitHub Push → Actions Workflow → Build dist/ → Upload to EC2 → Atomic Deploy → Reload Nginx
```

**Deployment Strategy:**
- Releases stored in: `/var/www/barakzai.cloud/releases/TIMESTAMP/`
- Active release: `/var/www/barakzai.cloud/dist` → symlink to latest release
- Keeps last 3 releases for rollback
- Atomic symlink swap (zero-downtime)

## One-Time Server Setup

### 1. Copy setup script to server

```bash
# From your local machine
scp scripts/server-setup.sh ec2-user@[EC2_IP]:~/
```

### 2. Run setup on server

```bash
# SSH to server
ssh ec2-user@[EC2_IP]

# Run setup script
sudo bash server-setup.sh
```

This script will:
- ✅ Install rsync
- ✅ Create directory structure
- ✅ Install deployment script
- ✅ Configure sudo permissions
- ✅ Create log file
- ✅ Verify nginx configuration

### 3. Verify nginx configuration

Ensure your nginx config for `barakzai.cloud` has:

```nginx
server {
    listen 443 ssl;
    server_name barakzai.cloud www.barakzai.cloud;
    
    root /var/www/barakzai.cloud/dist;
    index index.html;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

If nginx config needs updating, edit the config and reload:

```bash
sudo nano /etc/nginx/conf.d/barakzai.cloud.conf
sudo nginx -t
sudo systemctl reload nginx
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value | Example |
|------------|-------|---------|
| `SSH_HOST` | EC2 public IP | `18.196.183.4` |
| `SSH_USER` | SSH username | `ec2-user` |
| `SSH_PORT` | SSH port | `22` |
| `SSH_PRIVATE_KEY` | OpenSSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |

### Getting SSH Private Key

If you don't have a dedicated deploy key:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-deploy-dailyflow" -f ~/.ssh/dailyflow_deploy_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/dailyflow_deploy_key.pub ec2-user@[EC2_IP]

# Get private key content (copy entire output including header/footer)
cat ~/.ssh/dailyflow_deploy_key
```

**⚠️ Important:** Copy the entire private key including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all lines...
-----END OPENSSH PRIVATE KEY-----
```

## Workflow Triggers

The deployment runs automatically on:

1. **Push to `main` branch**
   ```bash
   git push origin main
   ```

2. **Manual dispatch** (from GitHub Actions tab)
   - Go to: Repository → Actions → "Deploy DailyFlow to Production"
   - Click: "Run workflow"

## Deployment Process

### What happens during deployment:

1. **Build Phase** (GitHub Actions runner)
   - ✅ Checkout code
   - ✅ Install Node.js 20.x
   - ✅ Run `npm ci`
   - ✅ Run `npm run build`
   - ✅ Verify `dist/index.html` exists

2. **Upload Phase**
   - ✅ Create timestamped release directory on server
   - ✅ Upload `dist/` using rsync (fast, compressed)
   - ✅ Files uploaded to `/var/www/barakzai.cloud/releases/YYYYMMDD_HHMMSS/`

3. **Deploy Phase** (via `/opt/dailyflow-deploy/deploy_dailyflow.sh`)
   - ✅ Set file permissions (root:root, 755/644)
   - ✅ Create temporary symlink
   - ✅ Atomic swap: `/var/www/barakzai.cloud/dist` → new release
   - ✅ Reload nginx (`systemctl reload nginx`)
   - ✅ Cleanup old releases (keep last 3)

4. **Verification Phase**
   - ✅ Wait 2 seconds for nginx reload
   - ✅ Check `https://barakzai.cloud` returns HTTP 200

## Post-Deployment Validation

After first deployment, verify everything works:

### 1. Check deployment status

```bash
# SSH to server
ssh ec2-user@[EC2_IP]

# View deployment logs
sudo tail -50 /var/log/dailyflow-deploy.log

# Check current release
ls -lh /var/www/barakzai.cloud/
# Should show: dist -> releases/YYYYMMDD_HHMMSS

# List all releases
ls -lt /var/www/barakzai.cloud/releases/
```

### 2. Verify nginx

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Check if site is accessible
curl -I https://barakzai.cloud
# Should return: HTTP/1.1 200 OK
```

### 3. Browser tests

- ✅ Visit https://barakzai.cloud
- ✅ Check console for errors (F12)
- ✅ Test AI chat functionality
- ✅ Navigate to different pages
- ✅ Hard refresh (Ctrl+Shift+R) to clear cache

### 4. Check GitHub Actions

- ✅ Go to: Repository → Actions
- ✅ Verify workflow completed successfully (green checkmark)
- ✅ Review workflow logs for any warnings

## Rollback Procedure

If deployment fails or has issues:

### Option 1: Automatic rollback (last working release)

```bash
# SSH to server
ssh ec2-user@[EC2_IP]

# List releases (sorted newest first)
ls -lt /var/www/barakzai.cloud/releases/

# Find the previous working release (second in list)
PREVIOUS_RELEASE=/var/www/barakzai.cloud/releases/YYYYMMDD_HHMMSS

# Deploy previous release
sudo /opt/dailyflow-deploy/deploy_dailyflow.sh $PREVIOUS_RELEASE
```

### Option 2: Git-based rollback

```bash
# Find last known good commit
git log --oneline -10

# Checkout that commit
git checkout [COMMIT_HASH]

# Push to trigger new deployment
git push origin HEAD:main --force
```

## Monitoring & Logs

### Deployment logs

```bash
# Real-time monitoring
ssh ec2-user@[EC2_IP] "sudo tail -f /var/log/dailyflow-deploy.log"

# View last deployment
ssh ec2-user@[EC2_IP] "sudo tail -100 /var/log/dailyflow-deploy.log"
```

### Nginx logs

```bash
# Access log
ssh ec2-user@[EC2_IP] "sudo tail -f /var/log/nginx/access.log"

# Error log
ssh ec2-user@[EC2_IP] "sudo tail -f /var/log/nginx/error.log"
```

## Troubleshooting

### Issue: Workflow fails at "Upload build artifacts"

**Cause:** SSH connection or permissions issue

**Fix:**
```bash
# Test SSH connection
ssh -i ~/.ssh/dailyflow_deploy_key ec2-user@[EC2_IP]

# Verify server directories exist
ls -la /var/www/barakzai.cloud/releases/

# Check sudo permissions
sudo cat /etc/sudoers.d/dailyflow-deploy
```

### Issue: Deployment succeeds but site shows old version

**Cause:** Browser cache or Cloudflare cache

**Fix:**
```bash
# Hard refresh browser (Ctrl+Shift+R)

# Or purge Cloudflare cache:
# Cloudflare Dashboard → Caching → Purge Everything
```

### Issue: Site shows 404 or nginx error

**Cause:** Nginx config or symlink issue

**Fix:**
```bash
# Check symlink
ls -lh /var/www/barakzai.cloud/dist

# Verify files exist
ls -lh /var/www/barakzai.cloud/dist/index.html

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Issue: Permission denied errors

**Cause:** File permissions incorrect

**Fix:**
```bash
# Fix permissions on all releases
sudo chown -R root:root /var/www/barakzai.cloud/releases/
sudo find /var/www/barakzai.cloud/releases/ -type d -exec chmod 755 {} \;
sudo find /var/www/barakzai.cloud/releases/ -type f -exec chmod 644 {} \;

# Reload nginx
sudo systemctl reload nginx
```

## Manual Deployment (Emergency)

If GitHub Actions is unavailable:

```bash
# 1. Build locally
npm run build

# 2. Create release directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ssh ec2-user@[EC2_IP] "sudo mkdir -p /var/www/barakzai.cloud/releases/${TIMESTAMP}"

# 3. Upload
rsync -avz --delete dist/ ec2-user@[EC2_IP]:/tmp/dailyflow-upload/
ssh ec2-user@[EC2_IP] "sudo rsync -a /tmp/dailyflow-upload/ /var/www/barakzai.cloud/releases/${TIMESTAMP}/"

# 4. Deploy
ssh ec2-user@[EC2_IP] "sudo /opt/dailyflow-deploy/deploy_dailyflow.sh /var/www/barakzai.cloud/releases/${TIMESTAMP}"

# 5. Cleanup
ssh ec2-user@[EC2_IP] "sudo rm -rf /tmp/dailyflow-upload"
```

## Best Practices

1. **Test locally before pushing**
   - Run `npm run build` locally
   - Test with `npm run preview`
   - Check for console errors

2. **Monitor deployments**
   - Watch GitHub Actions progress
   - Check logs after deployment
   - Verify site immediately

3. **Keep releases clean**
   - Old releases auto-delete (keeps 3)
   - Manual cleanup if needed: `sudo rm -rf /var/www/barakzai.cloud/releases/YYYYMMDD_HHMMSS`

4. **Security**
   - Never commit SSH private keys
   - Rotate deploy keys periodically
   - Use separate deploy key (not personal key)

## Files Created

- `.github/workflows/deploy-dailyflow.yml` - GitHub Actions workflow
- `scripts/deploy_dailyflow.sh` - Server-side deployment script (installed to `/opt/dailyflow-deploy/`)
- `scripts/server-setup.sh` - One-time server setup script
- `DEPLOYMENT_SETUP.md` - This documentation

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Check server logs: `/var/log/dailyflow-deploy.log`
3. Verify nginx config and status
4. Test SSH connection manually
5. Review this documentation

---

**Last Updated:** January 19, 2026  
**Production URL:** https://barakzai.cloud  
**API URL:** https://api.barakzai.cloud
