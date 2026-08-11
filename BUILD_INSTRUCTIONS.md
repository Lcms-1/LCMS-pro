# LCMS PRO — Android & Desktop Build Guide

Your code is now configured for both Android (Capacitor) and Desktop
(Electron) packaging. No app logic, UI, or database behavior was changed —
only build configuration was added:

- `capacitor.config.ts` — Android wrapper config
- `electron/main.cjs` — Desktop app launcher
- `package.json` — new build scripts + electron-builder config
- `public/icon.png` — app icon (from your Lightway logo)

**Important: none of this can be compiled on your phone or inside AI Studio.**
You need a Windows, Mac, or Linux computer (borrowed, cybercafé, or your own)
with Node.js installed — OR use GitHub Actions (see bottom of this file),
which builds everything in the cloud for free and needs no computer at all.

---

## 0. One-time setup (on a computer)

1. Install **Node.js LTS** (v20): https://nodejs.org
2. Extract this project ZIP, open a terminal inside the folder, run:
   ```
   npm install
   ```

---

## 1. Android APK

Extra requirement: **Android Studio** (includes the Android SDK) and
**JDK 17+**. Install Android Studio from https://developer.android.com/studio
— it will prompt you to install the SDK and JDK on first launch.

```bash
npx cap add android      # one-time: creates the /android folder
npm run android:apk      # builds app + syncs + compiles debug APK
```

The finished file appears at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
Copy that `.apk` to your phone and install it (enable "Install from unknown
sources" if prompted).

For a signed release build (for Play Store or wider distribution), open the
`android` folder in Android Studio and use **Build > Generate Signed Bundle
/ APK**.

---

## 2. Desktop (Windows / Mac / Linux)

Run the matching command **on that operating system** (Windows builds need
to run on Windows, Mac builds need to run on a Mac — Electron can't
cross-build macOS from Windows/Linux):

```bash
npm run electron:dist
```

Output installers appear in the `release/` folder:
- Windows → `release/LCMS PRO Setup.exe`
- Mac → `release/LCMS PRO.dmg`
- Linux → `release/LCMS PRO.AppImage` and `.deb`

To just test the desktop app without building an installer:
```bash
npm run electron:start
```

---

## 3. Backend connection

The app talks to your backend via `VITE_API_BASE_URL`. Before building,
create a `.env` file (copy `.env.example`) and set it to your hosted Cloud
Run URL so the Android/Desktop apps reach your live server instead of
`localhost`.

---

## 4. No computer? Use GitHub Actions (fully free, builds in the cloud)

1. Create a free GitHub account (github.com) and a new repository from your
   phone browser.
2. Upload this whole project folder to that repo (GitHub's web uploader
   accepts drag-and-drop / file picker from your phone).
3. Ask me for the `.github/workflows/build.yml` file — I'll generate it for
   you. It will automatically build the Android APK, Windows, Mac, and
   Linux installers on every push, and you download the finished files from
   the repo's "Actions" tab — straight to your phone, no computer needed.
