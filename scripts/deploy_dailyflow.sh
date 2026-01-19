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
    # Try to start it
    systemctl start nginx || error_exit "Failed to start nginx"
    log "✅ Nginx started"
fi

# Cleanup old releases
log "🧹 Cleaning up old releases (keeping last $KEEP_RELEASES)..."

# Get list of releases sorted by modification time (newest first)
RELEASES=($(ls -1t "$RELEASES_DIR" 2>/dev/null || true))
RELEASE_COUNT=${#RELEASES[@]}

log "📊 Total releases: $RELEASE_COUNT"

if [ $RELEASE_COUNT -gt $KEEP_RELEASES ]; then
    # Keep the first N releases, delete the rest
    for ((i=$KEEP_RELEASES; i<$RELEASE_COUNT; i++)); do
        OLD_RELEASE="$RELEASES_DIR/${RELEASES[$i]}"
        
        # Safety check: never delete the current release
        if [ "$OLD_RELEASE" = "$RELEASE_DIR" ]; then
            log "⚠️  Skipping current release: ${RELEASES[$i]}"
            continue
        fi
        
        # Safety check: never delete what current symlink points to
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

# Show final state
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "✅ Deployment completed successfully!"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🌐 Site: https://barakzai.cloud"
log "📂 Active release: $(basename "$RELEASE_DIR")"
log "📁 Releases kept: $(ls -1 "$RELEASES_DIR" | wc -l)"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Success
exit 0
