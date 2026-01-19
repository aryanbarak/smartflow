#!/usr/bin/env bash
#
# DailyFlow Server Setup Script
# Run this ONCE on the EC2 server to prepare for automated deployments
#
set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 DailyFlow Server Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run with sudo: sudo bash server-setup.sh"
    exit 1
fi

# 1. Install rsync (if not present)
echo "📦 Installing rsync..."
if ! command -v rsync &> /dev/null; then
    yum install -y rsync
    echo "✅ rsync installed"
else
    echo "✅ rsync already installed"
fi

# 2. Create directory structure
echo "📁 Creating directory structure..."
mkdir -p /var/www/barakzai.cloud/releases
mkdir -p /opt/dailyflow-deploy
mkdir -p /var/log

echo "✅ Directories created"

# 3. Set base permissions
echo "🔒 Setting permissions..."
chown -R root:root /var/www/barakzai.cloud
chmod 755 /var/www/barakzai.cloud
chmod 755 /var/www/barakzai.cloud/releases
chmod 755 /opt/dailyflow-deploy

echo "✅ Permissions set"

# 4. Create log file
echo "📝 Creating log file..."
touch /var/log/dailyflow-deploy.log
chown ec2-user:ec2-user /var/log/dailyflow-deploy.log
chmod 644 /var/log/dailyflow-deploy.log

echo "✅ Log file created"

# 5. Check if nginx is installed and running
echo "🔍 Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
elif systemctl is-enabled --quiet nginx; then
    echo "⚠️  Nginx is installed but not running"
    echo "   Starting nginx..."
    systemctl start nginx
    echo "✅ Nginx started"
else
    echo "❌ Nginx is not installed or configured"
    echo "   Please install and configure nginx first"
    exit 1
fi

# 6. Verify nginx config for barakzai.cloud
echo "🔍 Checking nginx configuration..."
if grep -r "barakzai.cloud" /etc/nginx/ &> /dev/null; then
    echo "✅ Nginx config found for barakzai.cloud"
else
    echo "⚠️  No nginx config found for barakzai.cloud"
    echo "   Please ensure nginx is configured to serve from:"
    echo "   /var/www/barakzai.cloud/dist"
fi

# 7. Create deployment script
echo "📄 Installing deployment script..."
cat > /opt/dailyflow-deploy/deploy_dailyflow.sh << 'DEPLOY_SCRIPT'
#!/usr/bin/env bash
#
# DailyFlow Deployment Script
# Location: /opt/dailyflow-deploy/deploy_dailyflow.sh
# Purpose: Atomically switch releases, cleanup old releases, reload nginx
#
set -euo pipefail

# Configuration
RELEASE_DIR="${1:-}"
WWW_ROOT="/var/www/barakzai.cloud"
RELEASES_DIR="$WWW_ROOT/releases"
CURRENT_LINK="$WWW_ROOT/dist"
KEEP_RELEASES=3
LOG_FILE="/var/log/dailyflow-deploy.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "❌ ERROR: $1"
    exit 1
}

# Validate input
if [ -z "$RELEASE_DIR" ]; then
    error_exit "Usage: $0 <release_directory>"
fi

if [ ! -d "$RELEASE_DIR" ]; then
    error_exit "Release directory does not exist: $RELEASE_DIR"
fi

if [ ! -f "$RELEASE_DIR/index.html" ]; then
    error_exit "Invalid release: index.html not found in $RELEASE_DIR"
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🚀 Starting DailyFlow deployment"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "📦 Release: $RELEASE_DIR"

# Set correct permissions
log "🔒 Setting permissions..."
chown -R root:root "$RELEASE_DIR"
find "$RELEASE_DIR" -type d -exec chmod 755 {} \;
find "$RELEASE_DIR" -type f -exec chmod 644 {} \;

# Backup current symlink target (for rollback)
if [ -L "$CURRENT_LINK" ]; then
    PREVIOUS_TARGET=$(readlink "$CURRENT_LINK")
    log "💾 Previous release: $PREVIOUS_TARGET"
else
    PREVIOUS_TARGET=""
    log "ℹ️  No previous release found"
fi

# Create temporary symlink
TEMP_LINK="${CURRENT_LINK}.tmp.$$"
log "🔗 Creating temporary symlink..."
ln -sfn "$RELEASE_DIR" "$TEMP_LINK"

# Atomic swap
log "⚡ Performing atomic swap..."
mv -T "$TEMP_LINK" "$CURRENT_LINK"

# Verify symlink
ACTUAL_TARGET=$(readlink "$CURRENT_LINK")
if [ "$ACTUAL_TARGET" != "$RELEASE_DIR" ]; then
    error_exit "Symlink verification failed: expected $RELEASE_DIR, got $ACTUAL_TARGET"
fi

log "✅ Symlink updated: $CURRENT_LINK -> $RELEASE_DIR"

# Reload nginx
log "🔄 Reloading nginx..."
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
    log "✅ Nginx reloaded successfully"
else
    log "⚠️  Warning: nginx service is not running"
    systemctl start nginx || error_exit "Failed to start nginx"
    log "✅ Nginx started"
fi

# Cleanup old releases
log "🧹 Cleaning up old releases (keeping last $KEEP_RELEASES)..."
RELEASES=($(ls -1t "$RELEASES_DIR" 2>/dev/null || true))
RELEASE_COUNT=${#RELEASES[@]}
log "📊 Total releases: $RELEASE_COUNT"

if [ $RELEASE_COUNT -gt $KEEP_RELEASES ]; then
    for ((i=$KEEP_RELEASES; i<$RELEASE_COUNT; i++)); do
        OLD_RELEASE="$RELEASES_DIR/${RELEASES[$i]}"
        
        if [ "$OLD_RELEASE" = "$RELEASE_DIR" ]; then
            log "⚠️  Skipping current release: ${RELEASES[$i]}"
            continue
        fi
        
        if [ -n "$PREVIOUS_TARGET" ] && [ "$OLD_RELEASE" = "$PREVIOUS_TARGET" ]; then
            log "💾 Keeping previous release: ${RELEASES[$i]}"
            continue
        fi
        
        log "🗑️  Deleting old release: ${RELEASES[$i]}"
        rm -rf "$OLD_RELEASE"
    done
else
    log "ℹ️  No cleanup needed (releases: $RELEASE_COUNT, keep: $KEEP_RELEASES)"
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "✅ Deployment completed successfully!"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🌐 Site: https://barakzai.cloud"
log "📂 Active release: $(basename "$RELEASE_DIR")"
log "📁 Releases kept: $(ls -1 "$RELEASES_DIR" | wc -l)"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
DEPLOY_SCRIPT

chmod +x /opt/dailyflow-deploy/deploy_dailyflow.sh
echo "✅ Deployment script installed"

# 8. Setup sudo permissions for ec2-user
echo "🔐 Configuring sudo permissions..."
cat > /etc/sudoers.d/dailyflow-deploy << 'SUDOERS'
# Allow ec2-user to run deployment commands without password
ec2-user ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/barakzai.cloud/releases/*
ec2-user ALL=(ALL) NOPASSWD: /usr/bin/rsync * /var/www/barakzai.cloud/releases/*
ec2-user ALL=(ALL) NOPASSWD: /bin/rm -rf /tmp/dailyflow-upload
ec2-user ALL=(ALL) NOPASSWD: /opt/dailyflow-deploy/deploy_dailyflow.sh
ec2-user ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
ec2-user ALL=(ALL) NOPASSWD: /bin/systemctl start nginx
ec2-user ALL=(ALL) NOPASSWD: /bin/systemctl status nginx
SUDOERS

chmod 440 /etc/sudoers.d/dailyflow-deploy
visudo -c || {
    echo "❌ Sudoers syntax error!"
    rm /etc/sudoers.d/dailyflow-deploy
    exit 1
}
echo "✅ Sudo permissions configured"

# 9. Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Server setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Directory structure:"
echo "   /var/www/barakzai.cloud/releases/  - Release storage"
echo "   /var/www/barakzai.cloud/dist/      - Symlink to current release"
echo "   /opt/dailyflow-deploy/             - Deployment scripts"
echo "   /var/log/dailyflow-deploy.log      - Deployment logs"
echo ""
echo "🔧 Next steps:"
echo "   1. Add GitHub Secrets to your dailyflow repository:"
echo "      - SSH_HOST: EC2 public IP"
echo "      - SSH_USER: ec2-user"
echo "      - SSH_PORT: 22"
echo "      - SSH_PRIVATE_KEY: Your deploy SSH private key"
echo ""
echo "   2. Ensure nginx is configured to serve from:"
echo "      /var/www/barakzai.cloud/dist"
echo ""
echo "   3. Push to main branch to trigger deployment"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
