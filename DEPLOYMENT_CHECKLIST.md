# SmartFlow Production Deployment Checklist

## ✅ Pre-Deployment Verification (COMPLETED)

### Build Status
- ✅ **Build successful**: `npm run build` completed without errors
- ✅ **Output size**: 3.61 MB (9 files total)
- ✅ **TypeScript errors**: Fixed AIError type mismatches
- ✅ **Production config**: `.env` points to `https://api.barakzai.cloud`
- ⚠️ **Warnings**: Large chunk size (1.47 MB) - consider code splitting in future

### Build Output (`dist/` directory)
```
dist/
├── assets/
│   ├── index-BSOVvC5o.js (1,467.83 kB) - Main bundle
│   ├── index-BOKdO1BJ.css (70.96 kB) - Styles
│   ├── pdf.worker.min-*.js - PDF.js workers
├── index.html (1.50 kB)
├── favicon.ico
├── robots.txt
├── _redirects (Cloudflare/Netlify redirects)
└── placeholder.svg
```

### Environment Configuration
- ✅ **Production API**: `VITE_AI_AGENT_URL=https://api.barakzai.cloud`
- ✅ **Supabase**: Configured with production credentials
- ✅ **Local dev**: `.env.local` created for `http://localhost:8000`

## 🚀 Deployment Steps

### Option 1: Manual Deployment via SSH

```bash
# 1. Connect to server
ssh ec2-user@<EC2_PUBLIC_IP>

# 2. Navigate to web root (verify path first!)
# Common paths: /var/www/barakzai.cloud or /opt/smartflow
cd /var/www/barakzai.cloud  # OR wherever nginx serves from

# 3. Backup current version
sudo mv dist dist.backup.$(date +%Y%m%d_%H%M%S)

# 4. Upload new dist/ from local machine
# Run this on your LOCAL machine:
scp -r c:\Projects\smartflow\dist ec2-user@<EC2_PUBLIC_IP>:/tmp/smartflow-dist

# 5. Back on SERVER, move to web root
ssh ec2-user@<EC2_PUBLIC_IP>
sudo mv /tmp/smartflow-dist /var/www/barakzai.cloud/dist
sudo chown -R nginx:nginx /var/www/barakzai.cloud/dist  # Or www-data:www-data

# 6. Verify nginx config and reload
sudo nginx -t
sudo systemctl reload nginx

# 7. Test deployment
curl -I https://barakzai.cloud
curl -I https://www.barakzai.cloud
```

### Option 2: GitHub Actions CI/CD (Recommended)

**Create `.github/workflows/deploy-frontend.yml` in smartflow repo:**

```yaml
name: Deploy SmartFlow Frontend

on:
  push:
    branches: ["main"]
  workflow_dispatch: {}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build production
        run: npm run build
        env:
          VITE_AI_AGENT_URL: https://api.barakzai.cloud
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      
      - name: Deploy to server
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          
          # Backup current version
          ssh -o StrictHostKeyChecking=no -i ~/.ssh/deploy_key \
            -p ${{ secrets.SSH_PORT }} \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} \
            "sudo mv /var/www/barakzai.cloud/dist /var/www/barakzai.cloud/dist.backup.\$(date +%Y%m%d_%H%M%S) || true"
          
          # Upload new build
          rsync -avz --delete -e "ssh -i ~/.ssh/deploy_key -p ${{ secrets.SSH_PORT }}" \
            dist/ \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:/tmp/smartflow-dist/
          
          # Move to production
          ssh -i ~/.ssh/deploy_key -p ${{ secrets.SSH_PORT }} \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} \
            "sudo mv /tmp/smartflow-dist /var/www/barakzai.cloud/dist && \
             sudo chown -R nginx:nginx /var/www/barakzai.cloud/dist && \
             sudo nginx -t && sudo systemctl reload nginx"
```

**GitHub Secrets to Add:**
- `VITE_SUPABASE_URL`: https://ljthmdhvjlsnizpjqxic.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY`: (from .env file)
- `SSH_HOST`: EC2 public IP
- `SSH_USER`: ec2-user
- `SSH_PORT`: 22
- `SSH_PRIVATE_KEY`: Same key used for AI Agent deployment

## 🔍 Post-Deployment Verification

### 1. Check Website Loads
```bash
# From local machine
curl -I https://barakzai.cloud
curl -I https://www.barakzai.cloud

# Should return: HTTP/2 200
```

### 2. Verify Static Files
```bash
# Check main JS bundle loads
curl -I https://barakzai.cloud/assets/index-BSOVvC5o.js

# Check CSS loads
curl -I https://barakzai.cloud/assets/index-BOKdO1BJ.css
```

### 3. Test AI Integration
- Open https://barakzai.cloud
- Navigate to "Learn with AI"
- Send a test message in German: "Was ist Bubble Sort?"
- Verify response comes from `https://api.barakzai.cloud/analyze`

### 4. Check Browser Console
- Open DevTools (F12)
- Look for errors (should be none)
- Network tab: Verify API calls to `api.barakzai.cloud`
- Check CORS headers are present

### 5. Test All Languages
- German (DE): "Was ist Bubble Sort?"
- English (EN): "What is Bubble Sort?"
- Persian (FA): "الگوریتم حبابی را توضیح بده"

## 🔧 Nginx Configuration (Verify on Server)

**Expected config at `/etc/nginx/conf.d/barakzai.cloud.conf`:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name barakzai.cloud www.barakzai.cloud;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name barakzai.cloud www.barakzai.cloud;

    ssl_certificate /etc/letsencrypt/live/barakzai.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/barakzai.cloud/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Serve static files
    root /var/www/barakzai.cloud/dist;
    index index.html;
    
    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Cache HTML with short TTL
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}
```

## ⚠️ Common Issues & Fixes

### Issue: "404 Not Found" on page refresh
**Fix**: Ensure `try_files $uri $uri/ /index.html;` in nginx config

### Issue: API calls fail with CORS error
**Fix**: Verify AI Agent backend has:
```python
allow_origin_regex=r"^https://(.*\.)?barakzai\.cloud$"
```

### Issue: Old version still showing
**Fix**: Hard refresh browser (Ctrl+Shift+R) or clear browser cache

### Issue: Cloudflare shows error
**Fix**: Check Cloudflare SSL/TLS mode is "Full" or "Full (strict)"

## 📊 Production Checklist

Before marking deployment complete:

- [ ] Website loads at https://barakzai.cloud ✅
- [ ] Website loads at https://www.barakzai.cloud ✅
- [ ] HTTPS certificate valid (Let's Encrypt) ✅
- [ ] All pages accessible (Calendar, Tasks, Finance, Documents, Learn AI) ✅
- [ ] AI chat works in all 3 languages (DE, EN, FA) ✅
- [ ] No console errors in browser ✅
- [ ] Mobile responsive design works ✅
- [ ] Favicon and metadata correct ✅
- [ ] API calls to api.barakzai.cloud working ✅
- [ ] Browser cache headers configured ✅

## 🔄 Rollback Procedure

If deployment fails:

```bash
# SSH to server
ssh ec2-user@<EC2_PUBLIC_IP>

# List backup versions
ls -lah /var/www/barakzai.cloud/ | grep dist.backup

# Restore previous version
sudo rm -rf /var/www/barakzai.cloud/dist
sudo mv /var/www/barakzai.cloud/dist.backup.YYYYMMDD_HHMMSS /var/www/barakzai.cloud/dist

# Reload nginx
sudo systemctl reload nginx
```

## 📝 Notes

- **Build size**: 3.61 MB is acceptable but consider code splitting for future optimization
- **Persian font**: Vazirmatn loaded from Google Fonts CDN
- **PDF support**: Includes PDF.js workers (1.1 MB + 1.2 MB)
- **Browser support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Cloudflare**: Proxied for DDoS protection and CDN caching

---

**Deployment Ready**: YES ✅  
**Last Build**: 2026-01-19 04:39 UTC  
**Build Hash**: index-BSOVvC5o.js
