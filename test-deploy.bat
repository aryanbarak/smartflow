@echo off
cd /d "C:\Projects\dailyflow"

echo ========================================
echo Testing Automated Deployment
echo ========================================
echo.

echo Step 1: Adding README changes...
git add README.md

echo.
echo Step 2: Committing...
git commit -m "docs: update README with deployment info - test auto-deploy"

echo.
echo Step 3: Pushing to GitHub (will trigger deployment)...
git push origin main

echo.
echo ========================================
echo PUSHED TO GITHUB!
echo ========================================
echo.
echo Next: Watch the deployment at:
echo https://github.com/[your-username]/dailyflow/actions
echo.
echo The workflow will:
echo 1. Build the app with Vite
echo 2. Upload to EC2 via rsync
echo 3. Deploy with atomic symlink
echo 4. Reload nginx
echo 5. Verify https://barakzai.cloud
echo.
echo Expected time: 2-3 minutes
echo.
pause
