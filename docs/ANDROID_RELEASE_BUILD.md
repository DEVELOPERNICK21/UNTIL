# Android release build — signed AAB & APK for Play Store

This doc explains how to sign your app for the Play Store and **never lose your keystore** (losing it means you can’t update the same app again).

---

## Why the keystore matters

- **Every release build** (AAB or APK) for Play Store **must** be signed with the **same** keystore.
- Google Play uses that signature to know updates are from you. If you lose the keystore:
  - You **cannot** publish updates to the existing app.
  - You would have to publish a **new** app (new package name) and lose installs/reviews.
- So: **generate the keystore once, then back it up and never lose it.**

---

## One-time setup (do this once per app)

### 1. Generate the release keystore

Run this in a terminal (from any directory). You’ll be asked for passwords and a few details; **remember the passwords** and store them safely.

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore until-release.keystore \
  -alias until \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

- **Validity 10000 days** (~27 years) so the key doesn’t expire during the app’s lifetime.
- You’ll be prompted for:
  - **Keystore password** (remember this → `storePassword`)
  - **Key password** (can be same as keystore → `keyPassword`)
  - Name, org, city, etc. (can be generic if you prefer)

**Suggested:** Create the keystore inside the project so the path is simple, then back it up elsewhere:

```bash
cd /path/to/UNTIL/android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore until-release.keystore \
  -alias until \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

This creates `android/app/until-release.keystore`. It is **gitignored**; it will **not** be committed.

### 2. Create `keystore.properties`

Copy the example and fill in your real values:

```bash
cd android/app
cp keystore.properties.example keystore.properties
```

Edit `keystore.properties` (never commit this file):

```properties
storeFile=until-release.keystore
storePassword=YOUR_ACTUAL_STORE_PASSWORD
keyAlias=until
keyPassword=YOUR_ACTUAL_KEY_PASSWORD
```

- **storeFile** — Path relative to `android/app/`. If you put the keystore in `android/app/`, use `until-release.keystore`.
- **storePassword** / **keyPassword** — The passwords you set when running `keytool`.
- **keyAlias** — The alias you used (`until`).

### 3. Back up the keystore and passwords (critical)

Do **not** rely only on your machine. If the disk dies or the repo is re-cloned, you need the keystore and passwords elsewhere.

1. **Back up the keystore file**  
   Copy `android/app/until-release.keystore` to at least one safe place, e.g.:
   - Encrypted cloud storage (Google Drive, Dropbox, iCloud)
   - Password manager that supports file attachments (e.g. 1Password)
   - Secure backup drive

2. **Back up the passwords**  
   Store `storePassword`, `keyPassword`, and `keyAlias` in a password manager or secure note. If you lose them, the keystore file alone is not enough.

3. **Optional: back up `keystore.properties`**  
   You can also store a copy of `keystore.properties` (with real passwords) in the same secure place so you can restore signing on a new machine without forgetting anything.

**Checklist:** Before you consider setup “done,” confirm:
- [ ] Keystore file is in at least one backup location
- [ ] Passwords and alias are recorded somewhere safe
- [ ] You can restore both on another computer if needed

---

## Building release AAB and APK

After the one-time setup, use these commands from the **project root** (where `package.json` is).

### AAB (recommended for Play Store)

Google Play prefers the Android App Bundle (AAB); it’s what you upload to the Play Console.

```bash
npm run android:release-aab
# or
yarn android:release-aab
```

**Output:**  
`android/app/build/outputs/bundle/release/app-release.aab`

Upload this file in Play Console: **Release** → **Production** (or testing track) → **Create new release** → upload the AAB.

### APK (for direct install or other stores)

If you need a single APK (e.g. for sideloading or another store):

```bash
npm run android:release-apk
# or
yarn android:release-apk
```

**Output:**  
`android/app/build/outputs/apk/release/app-release.apk`

### Build from Android directory (optional)

You can also run Gradle directly:

```bash
cd android
./gradlew bundleRelease    # AAB
./gradlew assembleRelease  # APK
```

Output paths are the same as above.

---

## If you run release without a keystore

If you run `bundleRelease` or `assembleRelease` (or the npm scripts) **before** creating `keystore.properties` and the keystore, the build will **fail on purpose** with a message like:

```text
Release keystore not configured.
1. Copy android/app/keystore.properties.example to android/app/keystore.properties
2. Generate a keystore (see docs/ANDROID_RELEASE_BUILD.md) and set storeFile, passwords, keyAlias in keystore.properties
3. Back up the keystore file and passwords securely.
```

Follow the one-time setup above, then build again.

---

## Summary

| Step | Action |
|------|--------|
| **Once** | Generate `until-release.keystore` with `keytool` |
| **Once** | Create `android/app/keystore.properties` from the example and set passwords + path |
| **Once** | Back up the keystore file and passwords somewhere safe |
| **Every release** | Run `npm run android:release-aab` (or `assembleRelease` for APK) and upload the AAB to Play Console |

The keystore and `keystore.properties` are **not** in git. Only you have them; keep backups so you never lose the ability to update Until: Days left on the Play Store.

---

## App size: why the release APK is large (and how to keep downloads small)

**Why your `app-release.apk` is big**

1. **Universal APK = all CPU architectures**  
   `assembleRelease` builds one APK that includes **arm64-v8a**, **armeabi-v7a**, **x86**, and **x86_64**. So the file is roughly 4× the size of a single-architecture build. That’s normal for a “universal” APK.

2. **R8 and resource shrinking are now enabled**  
   Release builds use:
   - **minifyEnabled** (R8) to shrink and obfuscate Java/Kotlin code.
   - **shrinkResources** to remove unused drawables and other resources.  
   Rebuild with `./gradlew assembleRelease` or `bundleRelease` to get the smaller size.

**What users actually download from Play Store**

- For **Play Store**, upload the **AAB** (`npm run android:release-aab`), not the APK.
- Google Play then serves **split APKs** per device (one ABI, one language, etc.). So each user downloads a **much smaller** file (often 50–60% smaller than the universal APK you see locally).

**Summary**

| Build | What you get | Typical use |
|-------|----------------|-------------|
| `app-release.aab` | Bundle; Play Store splits it per device | **Use this for Play Store** → smaller user downloads |
| `app-release.apk` | One APK with all ABIs (~4× one ABI) | Testing, or direct install; not for store upload |

So the large **APK** on disk is expected. For store distribution, use the **AAB**; user download size will be smaller.
