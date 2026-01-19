@echo off
cd /d "C:\Projects\dailyflow"
echo Adding deployment files to git...
git add .github/workflows/deploy-dailyflow.yml
git add scripts/deploy_dailyflow.sh
git add scripts/server-setup.sh
git add DEPLOYMENT_SETUP.md
git add DEPLOYMENT_QUICKSTART.md

echo.
echo Checking git status...
git status

echo.
echo Committing changes...
git commit -m "ci: add GitHub Actions automated deployment for DailyFlow"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DEPLOYMENT FILES PUSHED TO GITHUB!
echo ========================================
echo.
echo Next Steps:
echo 1. Run server setup: scp scripts/server-setup.sh ec2-user@[YOUR_EC2_IP]:~/
echo 2. Add GitHub Secrets: SSH_HOST, SSH_USER, SSH_PORT, SSH_PRIVATE_KEY
echo 3. Watch Actions run: https://github.com/[your-username]/dailyflow/actions
echo.
pause
