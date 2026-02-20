#!/bin/bash
# iOS Build Fix Script
# Fixes "No such file or directory" errors in Xcode DerivedData

set -e

echo "🔧 Fixing iOS build issues..."

# 1. Clean DerivedData for this project
echo "📦 Cleaning DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/UNTIL-*

# 2. Clean build folders in project
echo "🧹 Cleaning project build folders..."
cd "$(dirname "$0")"
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock

# 3. Clean CocoaPods cache (optional but helps)
echo "🗑️  Cleaning CocoaPods cache..."
pod cache clean --all 2>/dev/null || echo "⚠️  pod cache clean failed (may need sudo)"

# 4. Reinstall pods
echo "📚 Reinstalling CocoaPods dependencies..."
cd ios
pod install

# 5. Verify DerivedData directory exists and has correct permissions
echo "✅ Verifying DerivedData permissions..."
mkdir -p ~/Library/Developer/Xcode/DerivedData
chmod 755 ~/Library/Developer/Xcode/DerivedData

echo ""
echo "✨ Done! Try building again with: yarn ios"
echo ""
echo "If issues persist, check:"
echo "  1. Disk space: df -h ~"
echo "  2. Permissions: ls -ld ~/Library/Developer/Xcode/DerivedData"
echo "  3. Xcode version: xcodebuild -version"
