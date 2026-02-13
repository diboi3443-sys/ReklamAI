#!/bin/bash

# verify_project.sh
# Automates the verification process for ReklamAI

echo "🔍 Starting ReklamAI Project Verification"
echo "=========================================="

# 1. Build Verification
echo ""
echo "📦 Step 1: verifying frontend build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# 2. Migration Check (Manual reminder)
echo ""
echo "🗄️  Step 2: Checking migrations..."
echo "⚠️  Ensure you have run the critical migrations:"
echo "   - 20240205000000_fix_key_column_and_video_models.sql"
echo "   - 20240205000002_verify_video_models.sql"
echo "   (You can run these via Supabase Dashboard SQL Editor)"

# 3. Smoke Tests
echo ""
echo "🧪 Step 3: Running smoke tests..."
if [ -f .env.smoke ]; then
    npm run smoke:edge
else
    echo "⚠️  Skipping smoke tests: .env.smoke not found"
    echo "   Copy .env.smoke.example to .env.smoke and fill in credentials to run tests."
fi

echo ""
echo "=========================================="
echo "✨ Verification Complete"
