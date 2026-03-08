#!/bin/sh
set -e

echo "🫙 Starting SuperBotijo..."

# Initialize data directory if needed
if [ ! -f /app/data/activities.json ]; then
  echo "📝 Initializing data files..."

  # Copy example files if they don't exist
  [ ! -f /app/data/activities.json ] && [ -f /app/data/activities.example.json ] && \
    cp /app/data/activities.example.json /app/data/activities.json

  [ ! -f /app/data/cron-jobs.json ] && [ -f /app/data/cron-jobs.example.json ] && \
    cp /app/data/cron-jobs.example.json /app/data/cron-jobs.json

  [ ! -f /app/data/notifications.json ] && [ -f /app/data/notifications.example.json ] && \
    cp /app/data/notifications.example.json /app/data/notifications.json

  [ ! -f /app/data/configured-skills.json ] && [ -f /app/data/configured-skills.example.json ] && \
    cp /app/data/configured-skills.example.json /app/data/configured-skills.json

  [ ! -f /app/data/tasks.json ] && [ -f /app/data/tasks.example.json ] && \
    cp /app/data/tasks.example.json /app/data/tasks.json

  echo "✅ Data files initialized"
fi

# Validate required environment variables
if [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ ERROR: ADMIN_PASSWORD environment variable is required"
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "❌ ERROR: AUTH_SECRET environment variable is required"
  exit 1
fi

# Display configuration
echo "📊 Configuration:"
echo "  - OPENCLAW_DIR: ${OPENCLAW_DIR:-/root/.openclaw}"
echo "  - Port: 3000"
echo "  - Node environment: ${NODE_ENV:-production}"

# Start the Next.js server
echo "🚀 Starting Next.js server..."
exec node_modules/.bin/next start -H 0.0.0.0 -p 3000
