# Daily Cut 📹 
**A "1 Second Everyday" Clone built with React Native and Expo.**

Daily Cut allows users to record or select exactly one second of video every day, view their daily progress on a calendar grid, and compile those clips into a continuous memory reel.

## 🚀 Features
* **Daily Capture:** Record a video using the system camera or pick one from your gallery.
* **Precise Trimming:** High-quality, frame-accurate native video trimming tailored to exactly 1 second.
* **Calendar View:** A beautiful calendar grid showing thumbnails of your recorded memories.
* **Reel Compilation:** Merge all your daily clips into a single continuous video with sequential playback.
* **Soundtrack Preview:** Add background music while previewing your reel.
* **Streaks & Reminders:** Keep your streak alive with daily local push notifications.
* **Offline First:** Fast, reliable local database using WatermelonDB and SQLite.

## 🛠️ Tech Stack
* **Framework:** React Native / Expo (SDK 54)
* **Database:** WatermelonDB (SQLite)
* **Video Trimming:** `react-native-video-trim` (with custom libx264 software encoder patch)
* **Media & Playback:** `expo-av`, `expo-media-library`, `expo-image`, `expo-camera`
* **State Management:** Zustand
* **Icons:** Lucide React Native

---

## 💻 How to Run Locally

### Prerequisites
Because this app uses custom native modules (like the native video trimmer and WatermelonDB), **you cannot run this in the standard Expo Go app**. You must create a Development Build.

1. Install Node.js (v18 or newer).
2. Install the EAS CLI: 
   ```bash
   npm install -g eas-cli
   ```

### 1. Install Dependencies
Clone the repository and install the NPM packages.
```bash
git clone https://github.com/virajt742-cyber/DailyCut.git
cd DailyCut/one-second-clone
npm install
```
*(Note: `npm install` automatically triggers a postinstall script that patches the video trimmer to use software encoding for maximum Android compatibility).*

### 2. Create a Development Build
To run the app on a physical Android device or emulator, you need to build the native client.

**For Android (APK):**
```bash
npx eas build --profile development --platform android
```
*Wait for the build to finish, download the APK, and install it on your device/emulator.*

### 3. Start the Metro Bundler
Once the Development Client is installed on your device, start the local server:
```bash
npx expo start --dev-client
```
Scan the QR code with your phone's camera (or press `a` to open it on a connected emulator).

---

## ⚠️ Important Notes
* **Video Merge Limitations:** The compilation engine relies on `react-native-video-trim`. If a device's hardware encoder fails during merging, the app employs a graceful fallback that saves the clips individually to the user's camera roll so no data is lost.
* **WatermelonDB:** JSI is disabled in `database/index.ts` to ensure maximum stability on the React Native legacy architecture. 

## 📄 License
This project is for educational and portfolio purposes.
