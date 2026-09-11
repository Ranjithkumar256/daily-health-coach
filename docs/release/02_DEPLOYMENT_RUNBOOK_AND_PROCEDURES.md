# Release Deployment Runbook & Operational Procedures
**Document ID:** SOP-DEP-DHC-01  
**Project:** Daily Health Coach  
**Applicable Version:** v1.2.0  
**Target Environments:** Production (Docker Hub, Cloud Host, Google Play Store)  
**Standard Maintenance Window:** Sunday 02:00 - 04:00 UTC (Estimated Downtime: < 60 seconds)  

---

## 1. Pre-Deployment Checklist & Prerequisites

- [x] Host Server: Linux Ubuntu 22.04 / 24.04 LTS with Docker Engine 24.0+ and Compose v2.20+.
- [x] Port `8001` open and unblocked by host firewall.
- [x] Android SDK Build-Tools `34.0.0` and Java JDK 17 installed for native builds.
- [x] Google Play Console Developer Account configured with Daily Health Coach app entry.
- [x] Health SQLite database backed up prior to container recreation.

---

## 2. Deployment Procedure: Docker Microservices

### Step 2.1: Pull Latest Production Container
```bash
docker pull ranjith256/daily-health-coach:latest
```

### Step 2.2: Backup Existing Database
```bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/daily-health-coach/backups
docker cp daily-health-coach-app:/app/health_coach.db /opt/daily-health-coach/backups/health_${BACKUP_DATE}.db 2>/dev/null || true
```

### Step 2.3: Zero-Downtime Container Restart
```bash
docker stop daily-health-coach-app 2>/dev/null || true
docker rm daily-health-coach-app 2>/dev/null || true

docker run -d \
  --name daily-health-coach-app \
  --restart unless-stopped \
  -p 8001:8001 \
  -v dhc_data:/app/data \
  -e ENVIRONMENT=production \
  -e PORT=8001 \
  --health-cmd="curl -f http://localhost:8001/health || exit 1" \
  --health-interval=30s \
  --health-timeout=5s \
  --health-retries=3 \
  ranjith256/daily-health-coach:latest
```

### Step 2.4: Validate Container Health
```bash
sleep 5
docker ps --filter "name=daily-health-coach-app"
curl -s http://localhost:8001/health | jq .
```
Expected output: `{"status": "healthy", "service": "daily-health-coach", "version": "1.2.0"}`

---

## 3. Deployment Procedure: Android Google Play Store

### Step 3.1: Build Release Bundle
```bash
cd /home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

### Step 3.2: Play Console Track Promotion
1. Open **Google Play Console** > **Daily Health Coach** (`com.dailyhealthcoach.app`).
2. Upload `app-release.aab` to **Internal Testing Track**.
3. Conduct Smoke Tests on real devices (Pedometer, Hydration, Habit Streaks).
4. Promote from **Internal Testing** -> **Production Track** (Staged Rollout: 20%, 50%, 100%).

---

## 4. Post-Deployment Verification & Smoke Tests

Run the following automated smoke test script immediately post-deployment:

```bash
cd /home/ranjith/.gemini/antigravity-ide/scratch/expenditure-monitor
node test_all_scenarios_comprehensive.mjs
```

Verify:
1. Terms Consent dialog renders and enforces agreement checkbox.
2. Health logs and habits export to `Android/data/com.dailyhealthcoach.app/files/database_backup.json`.
3. Startup sync loads data on empty install and synchronizes external file edits.
4. `/api/cloud-backup` returns HTTP 200 OK for DailyHealthCoach.

---

## 5. Rollback & Emergency Contingency Plan

### Container Rollback
```bash
docker stop daily-health-coach-app
docker run -d --name daily-health-coach-app --restart unless-stopped -p 8001:8001 \
  ranjith256/daily-health-coach:previous_stable
docker cp /opt/daily-health-coach/backups/health_${BACKUP_DATE}.db daily-health-coach-app:/app/health_coach.db
docker restart daily-health-coach-app
```
