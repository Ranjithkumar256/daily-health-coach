# 📱 Complete Guide: Publishing Daily Health Coach to Google Play Store (Capacitor Android)

This comprehensive guide explains how to convert Daily Health Coach into an **Android App Bundle (.aab)** and publish it to the **Google Play Store**.

---

## 🏗️ 1. Architecture Overview for Play Store

Before building the APK/AAB, understand the client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Mobile Phone (User's Device)               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │   Daily Health Coach Android Shell (Capacitor)      │   │
│   │   HTML / CSS / JavaScript / Charts Engine           │   │
│   └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS API calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Cloud Hosted Production Server               │
│  (e.g., Render.com, Railway.app, DigitalOcean, or AWS)      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │   FastAPI Python Server (run.py / app/main.py)      │   │
│   │   SQLite Database (health_coach.db)                 │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Why `localhost` cannot be used in Play Store:**
> A user downloading your app from Google Play cannot connect to your local computer (`localhost`).
> 1. **For Play Store release**: Deploy your Python FastAPI backend (or Docker container) to any cloud host (e.g., Render, Railway, DigitalOcean, or your VPS).
> 2. **For local phone testing right now**: You can connect to your computer using your local Wi-Fi IP (`http://10.12.0.201:8001`).

---

## 🛠️ 2. Generating the Android Build

All Capacitor and Gradle configuration is set up in `package.json`, `capacitor.config.json`, and `android/app/build.gradle`.

### Step 2.1: Sync Web Assets
Whenever you edit HTML, CSS, or JS in `static/`:
```bash
cd /home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach
npx cap sync android
```

---

## 🔑 3. Release Keystore Details

A production release keystore has already been generated and linked to `android/app/build.gradle`:

* **Keystore File**: `android/dailyhealthcoach-release.keystore`
* **Alias**: `dailyhealthcoach`
* **Store Password**: `HealthCoach@2026`
* **Key Password**: `HealthCoach@2026`
* **Validity**: 10,000 days

> [!IMPORTANT]
> Release builds will be automatically signed using this key. Keep a secure backup of `android/dailyhealthcoach-release.keystore`.

---

## 📦 4. Building the Android Files

Google Play Store strictly requires **`.aab` (Android App Bundle)**, while phones can install **`.apk`** directly.

### One-Click Build Commands:
```bash
cd /home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach

# Build BOTH Debug APK (for phone testing) & Signed Release AAB (for Play Store)
./build_android.sh all

# OR build ONLY the phone testing APK:
./build_android.sh apk

# OR build ONLY the Google Play Store AAB:
./build_android.sh aab
```

### Generated File Locations:
* **Debug APK (for phone testing)**:
  `android/app/build/outputs/apk/debug/app-debug.apk`
* **Signed Release AAB (for Google Play Store)**:
  `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🚀 5. Google Play Console Publishing Steps

1. **Google Play Console Account**:
   - Go to [Google Play Console](https://play.google.com/console).
   - Log in or complete registration ($25 one-time fee).

2. **Create New App**:
   - App Name: `Daily Health Coach`
   - Default language: `English`
   - App or Game: `App`
   - Free or Paid: `Free`

3. **Store Listing Assets**:
   - **App Icon**: $512 \times 512$ PNG
   - **Feature Graphic**: $1024 \times 500$ PNG/JPEG
   - **Phone Screenshots**: At least 4 screenshots (Dashboard, Hydration, Habits, Transformation)
   - **Category**: Health & Fitness
   - **Short Description**: *"Your daily companion for smart hydration, fitness habits, protein, and wellness consistency."*

4. **Upload the Bundle**:
   - In Google Play Console $\rightarrow$ **Production** (or **Internal Testing**) $\rightarrow$ **Create new release**.
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`.
   - Submit for review!
