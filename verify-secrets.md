# ✅ GitHub Secrets Verification Checklist

## Secrets که باید تنظیم شده باشند:

### 1. SSH_HOST
- **مقدار**: IP عمومی EC2 شما
- **فرمت**: `18.196.183.4` یا مشابه
- **بررسی**: آیا IP درست است؟
- ✅ تنظیم شده

### 2. SSH_USER  
- **مقدار**: `ec2-user`
- **بررسی**: دقیقاً `ec2-user` بدون فاصله
- ✅ تنظیم شده

### 3. SSH_PORT
- **مقدار**: `22`
- **بررسی**: عدد ۲۲ بدون کوتیشن
- ✅ تنظیم شده

### 4. SSH_PRIVATE_KEY
- **مقدار**: کل محتوای private key شامل:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ... content ...
  -----END OPENSSH PRIVATE KEY-----
  ```
- **بررسی**: 
  - آیا header و footer موجود است؟
  - آیا فاصله اضافی یا newline اضافی ندارد؟
  - آیا این کلید در سرور authorized_keys موجود است؟
- ✅ تنظیم شده

---

## 🧪 تست سریع Secrets

برای تست اینکه secrets درست کار می‌کنند:

### روش ۱: Manual Workflow Dispatch
```
1. برو به: https://github.com/[username]/dailyflow/actions
2. کلیک روی "Deploy DailyFlow to Production"
3. کلیک "Run workflow" → "Run workflow"
4. منتظر بمان تا workflow اجرا شود
```

### روش ۲: Push تست
```bash
# یک تغییر ساده بساز
cd C:\Projects\dailyflow
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin main
```

---

## ⚠️ نکات مهم قبل از اولین Deploy:

### 1. آیا سرور آماده است؟
```bash
# اول باید server-setup.sh را روی سرور اجرا کنی:
scp scripts/server-setup.sh ec2-user@[YOUR_EC2_IP]:~/
ssh ec2-user@[YOUR_EC2_IP]
sudo bash server-setup.sh
```

**اگر این کار را نکرده‌ای، deployment fail می‌شود!**

### 2. بررسی SSH Connection
قبل از deploy، تست کن که SSH کار می‌کند:
```bash
ssh ec2-user@[YOUR_EC2_IP] "echo 'SSH works!'"
```

### 3. بررسی Nginx روی سرور
```bash
ssh ec2-user@[YOUR_EC2_IP]
sudo systemctl status nginx
# باید active (running) باشد
```

---

## 📋 مراحل اجرای اولین Deployment:

### مرحله ۱: Server Setup (اگر هنوز انجام نشده)
```bash
# کپی کردن اسکریپت به سرور
scp scripts/server-setup.sh ec2-user@[EC2_IP]:~/

# اجرای اسکریپت
ssh ec2-user@[EC2_IP]
sudo bash server-setup.sh
exit
```

### مرحله ۲: Push کردن فایل‌های Deployment
```bash
cd C:\Projects\dailyflow
git add .github scripts DEPLOYMENT_*.md
git commit -m "ci: add GitHub Actions deployment"
git push origin main
```

### مرحله ۳: مشاهده اجرای Workflow
```
1. برو به: https://github.com/[username]/dailyflow/actions
2. آخرین workflow را باز کن
3. لاگ‌ها را مشاهده کن
```

### مرحله ۴: تست سایت
```bash
# تست از command line
curl -I https://barakzai.cloud

# یا در browser:
# https://barakzai.cloud
```

---

## 🔍 چک‌لیست نهایی:

- [ ] **Secrets اضافه شده**: 4 secret در GitHub
- [ ] **Server setup اجرا شده**: اسکریپت روی EC2 اجرا شده
- [ ] **SSH تست شده**: اتصال SSH کار می‌کند
- [ ] **Nginx فعال است**: `systemctl status nginx` → active
- [ ] **Files pushed**: فایل‌های deployment در GitHub هستند
- [ ] **Workflow enabled**: در Actions فعال است

---

## 🚨 Troubleshooting سریع:

### اگر "Permission denied" دیدی:
```bash
# بررسی کن که کلید درست در authorized_keys باشد
ssh ec2-user@[EC2_IP] "cat ~/.ssh/authorized_keys"
```

### اگر "rsync: command not found" دیدی:
```bash
# server-setup.sh را اجرا کن که rsync را نصب می‌کند
```

### اگر "nginx: command not found" دیدی:
```bash
# nginx باید از قبل نصب باشد (با Docker)
ssh ec2-user@[EC2_IP]
docker ps | grep nginx
```

### اگر deployment موفق بود اما سایت update نشد:
```bash
# Hard refresh در browser: Ctrl + Shift + R
# یا بررسی symlink:
ssh ec2-user@[EC2_IP]
ls -lh /var/www/barakzai.cloud/dist
```

---

## ✅ بعد از اولین Deploy موفق:

1. **تگ بزن**:
   ```bash
   git tag -a v1.0.0-auto-deploy -m "First automated deployment"
   git push origin v1.0.0-auto-deploy
   ```

2. **لاگ‌ها را چک کن**:
   ```bash
   ssh ec2-user@[EC2_IP]
   sudo tail -50 /var/log/dailyflow-deploy.log
   ```

3. **Rollback تست کن** (اختیاری):
   ```bash
   ssh ec2-user@[EC2_IP]
   ls -lt /var/www/barakzai.cloud/releases/
   # انتخاب یک release قدیمی
   sudo /opt/dailyflow-deploy/deploy_dailyflow.sh /var/www/barakzai.cloud/releases/[OLD_TIMESTAMP]
   ```

---

**همه چیز آماده است! 🚀**

فقط مطمئن شو که server-setup.sh را روی سرور اجرا کرده‌ای، بعد می‌توانی push کنی.
