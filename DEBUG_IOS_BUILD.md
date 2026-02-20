# iOS Build Debugging Guide

## Understanding the Error

### Error Pattern
```
error unable to write file '/Users/admin/Library/Developer/Xcode/DerivedData/...': 
No such file or directory (2)
```

### What "No such file or directory (2)" Means
- **Error Code 2** = `ENOENT` (Error NO ENTry)
- The **parent directory** doesn't exist
- Xcode tries to write a file but can't create the directory structure

### Why This Happens
1. **Corrupted DerivedData**: Previous build was interrupted
2. **Missing directories**: Parent folders weren't created
3. **Permissions**: Can't create directories in DerivedData
4. **Disk space**: No space to create directories
5. **Concurrent builds**: Multiple builds interfering

---

## Terminal Debugging Commands

### 1. Check Disk Space
```bash
# Check available disk space
df -h ~

# Check DerivedData size (might be huge)
du -sh ~/Library/Developer/Xcode/DerivedData
```

### 2. Check Permissions
```bash
# Check DerivedData permissions
ls -ld ~/Library/Developer/Xcode/DerivedData

# Should show: drwxr-xr-x (755)
# If wrong, fix with:
chmod 755 ~/Library/Developer/Xcode/DerivedData
```

### 3. Check if Directory Exists
```bash
# Check the exact failing directory
ls -la ~/Library/Developer/Xcode/DerivedData/UNTIL-gxvjvdvuyspczbcfeiacyynfwefs/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/

# If missing, check parent directories
ls -la ~/Library/Developer/Xcode/DerivedData/UNTIL-gxvjvdvuyspczbcfeiacyynfwefs/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/
```

### 4. Check Xcode Version & Build Settings
```bash
# Xcode version
xcodebuild -version

# Active developer directory
xcode-select -p

# List available simulators
xcrun simctl list devices
```

### 5. Check Build Logs in Detail
```bash
# Build with verbose output
cd ios
xcodebuild -workspace UNTIL.xcworkspace \
  -scheme UNTIL \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  clean build \
  2>&1 | tee build.log

# Search for specific errors
grep -i "unable to write" build.log
grep -i "no such file" build.log
```

### 6. Check CocoaPods Status
```bash
cd ios

# Check pod installation
pod --version
pod repo list

# Verify Podfile
cat Podfile

# Check if pods are installed correctly
ls -la Pods/
```

### 7. Check for Locked Files
```bash
# Check if any build files are locked
lsof ~/Library/Developer/Xcode/DerivedData/UNTIL-*/Build/**/* 2>/dev/null | head -20

# Kill any Xcode processes holding files
killall Xcode 2>/dev/null || echo "No Xcode running"
```

---

## Step-by-Step Fix Process

### Method 1: Quick Clean (Most Common Fix)
```bash
# 1. Clean DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/UNTIL-*

# 2. Clean project
cd ios
rm -rf build Pods Podfile.lock

# 3. Reinstall pods
pod install

# 4. Rebuild
cd ..
yarn ios
```

### Method 2: Full Clean (If Method 1 Fails)
```bash
# 1. Close Xcode completely
killall Xcode

# 2. Clean everything
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ios/build ios/Pods ios/Podfile.lock

# 3. Clean CocoaPods cache
pod cache clean --all

# 4. Reinstall pods
cd ios
pod install --repo-update

# 5. Rebuild
cd ..
yarn ios
```

### Method 3: Fix Permissions (If Permission Errors)
```bash
# Fix DerivedData permissions
sudo chown -R $(whoami) ~/Library/Developer/Xcode/DerivedData
chmod -R 755 ~/Library/Developer/Xcode/DerivedData

# Fix project permissions
cd ios
sudo chown -R $(whoami) .
chmod -R 755 .
```

### Method 4: Check Disk Space (If Out of Space)
```bash
# Check space
df -h ~

# If low on space, clean DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean Xcode caches
rm -rf ~/Library/Caches/com.apple.dt.Xcode
rm -rf ~/Library/Developer/Xcode/Archives
```

---

## Advanced Debugging

### Enable Verbose Build Logging
```bash
# Set environment variable for detailed logs
export XCODE_BUILD_VERBOSE=1

# Or use xcodebuild directly with more flags
cd ios
xcodebuild -workspace UNTIL.xcworkspace \
  -scheme UNTIL \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  -showBuildSettings \
  clean build 2>&1 | tee verbose-build.log
```

### Check Specific Build Phase
```bash
# Build only hermes-engine target to isolate issue
cd ios
xcodebuild -workspace UNTIL.xcworkspace \
  -target hermes-engine \
  -configuration Debug \
  clean build
```

### Monitor File System During Build
```bash
# Watch DerivedData directory during build (in separate terminal)
watch -n 1 'ls -la ~/Library/Developer/Xcode/DerivedData/UNTIL-*/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/ 2>/dev/null | head -20'
```

---

## Common Issues & Solutions

### Issue: "Missing CFBundleExecutable in Info.plist"
**Solution**: Check widget extension Info.plist
```bash
# Check widget Info.plist
cat ios/UNTILWidgets/Info.plist | grep -A 2 CFBundleExecutable

# Should have:
# <key>CFBundleExecutable</key>
# <string>$(EXECUTABLE_NAME)</string>
```

### Issue: "Signing requires development team"
**Solution**: Set team in Xcode or via command line
```bash
# Open Xcode to set signing
open ios/UNTIL.xcworkspace

# Or set via xcodebuild (replace TEAM_ID)
xcodebuild -workspace ios/UNTIL.xcworkspace \
  -scheme UNTIL \
  -configuration Debug \
  CODE_SIGN_IDENTITY="Apple Development" \
  DEVELOPMENT_TEAM="YOUR_TEAM_ID"
```

### Issue: Pods Build Failing
**Solution**: Update CocoaPods and pods
```bash
# Update CocoaPods
sudo gem install cocoapods

# Update pod repo
pod repo update

# Reinstall pods
cd ios
pod deintegrate
pod install
```

---

## Prevention Tips

1. **Always clean before major changes**
   ```bash
   rm -rf ios/build ios/Pods
   pod install
   ```

2. **Don't interrupt builds** - Let Xcode finish

3. **Keep disk space free** - DerivedData can be huge

4. **Use Xcode for first build** - Then CLI builds work better

5. **Check for concurrent builds** - Only one build at a time

---

## Quick Reference Commands

```bash
# Quick clean
rm -rf ~/Library/Developer/Xcode/DerivedData/UNTIL-* && cd ios && rm -rf build Pods && pod install && cd .. && yarn ios

# Check what's failing
grep -i "error\|warning" build.log | tail -20

# Find largest DerivedData projects
du -sh ~/Library/Developer/Xcode/DerivedData/* | sort -h | tail -10

# Kill all Xcode processes
killall Xcode && sleep 2 && yarn ios
```
