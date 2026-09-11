# Architecture & System Design Document (ADD)
**Document ID:** ARCH-SPEC-DHC-01  
**Project:** Daily Health Coach  
**System:** Smart Health, Nutrition, Habit & Telemetry Platform  
**Revision:** 2.0  

---

## 1. System Architecture Overview

Daily Health Coach uses an **Edge-First Reactive Health Architecture** that preserves all physical wellness data on the user's device while offering optional encrypted cloud backups.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|  +---------------------------+   +----------------------+   +------------------+  |
|  | Modern Health UI (SPA)    |   | Capacitor Mobile Host|   | Terms & Privacy  |  |
|  | Hydration / Habits / Cals |   | Android WKWebView    |   | Gatekeeper       |  |
|  +---------------------------+   +----------------------+   +------------------+  |
|               |                                |                                  |
|  +---------------------------+   +----------------------------------------------+ |
|  | Smartwatch & Sensor Bridge|   | Database Persistence & Startup Sync Engine   | |
|  | Step Count & Heart Rate   |   | (Android/data + Documents + Content Hashing) | |
|  +---------------------------+   +----------------------------------------------+ |
+-----------------------------------------------------------------------------------+
                                         |
                       REST APIs (JSON / Bearer Token)
                                         |
+-----------------------------------------------------------------------------------+
|                              BACKEND CLOUD LAYER                                  |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  | FastAPI Microservice (Python 3.11 ASGI Engine)                               | |
|  | - Calorie & Macronutrient Calculations (/api/nutrition)                      | |
|  | - Daily Health Coach Intelligence Engine (/api/insights)                      | |
|  | - Cloud Health Database Snapshot API (/api/cloud-backup)                     | |
|  | - Healthcheck Diagnostics (/health)                                          | |
|  +------------------------------------------------------------------------------+ |
|                                         |                                         |
|  +------------------------------------------------------------------------------+ |
|  | SQLite Health Store (WAL mode enabled)                                       | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 2. Storage & Persistence Architecture

### 2.1 Multi-Layer Storage Hierarchy
1. **Local State & Real-time Caching:** Partitioned client storage for instant rendering of progress rings, hydration bars, and habit streaks.
2. **Dedicated Primary On-Device Health Database:**
   - Path: `Internal Storage/Android/data/com.dailyhealthcoach.app/files/database_backup.json`
   - Role: Complete schema export of water logs, habit records, nutrition entries, weight history, and target profiles.
3. **Anti-Uninstall Persistent Mirror:**
   - Path: `Internal Storage/Documents/database_backup.json`
   - Role: Permanent health archive that survives complete app uninstallation.
4. **Remote Cloud Backup API:**
   - Endpoint: `POST /api/cloud-backup`
   - Role: Encrypted remote backup for cross-device restoration.

### 2.2 Startup Synchronization & Dynamic Hash Comparison
Upon app launch, `syncFromDatabaseFileOnStartup()` executes:
1. Reads `database_backup.json` from `Directory.External` or falls back to `Directory.Documents`.
2. Computes the 32-bit content hash of the file.
3. If local storage is empty (reinstallation), it auto-loads and restores all health history without user clicks.
4. If local storage exists and the file hash changed (user edited values in mobile file manager), it synchronizes the external edits into active state.

---

## 3. Anti-Uninstall Health Data Preservation Engine

- `android:hasFragileUserData="true"` inside `AndroidManifest.xml` triggers Android's native confirmation dialog: *"Keep app data?"* when uninstalling.
- Public directory mirroring to `Directory.Documents` guarantees data retention even if the user clears private app storage.
