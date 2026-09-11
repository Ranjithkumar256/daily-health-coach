# 🌿 Daily Health Coach

An all-in-one lifestyle, fitness, and nutrition application + dashboard built with **Python (FastAPI & SQLite)** at the core. It serves both a responsive **Web Dashboard** and an installable **Android Application** (PWA + Capacitor), designed to run locally, on any home server, or on any cloud VPS.

> 📖 **Comprehensive Project Documentation**:
> - 🏛️ **Architecture & Flow**: [`docs/ARCHITECTURE_AND_FLOW.md`](docs/ARCHITECTURE_AND_FLOW.md) *(Full system topology, Mermaid sequence diagrams, DB ERD, REST API)*
> - 🛠️ **Technologies & Methods**: [`docs/TECHNOLOGIES_AND_METHODS.md`](docs/TECHNOLOGIES_AND_METHODS.md) *(Stack breakdown, Mifflin-St Jeor math, 4-pillar score, PWA & UX)*

---

## 🌟 What Is Built (Current Features)

1. **Science-Backed Metabolism Engine (Mifflin-St Jeor)**:
   - Bio-profile factors: Age, Biological Gender, Height (cm), Current Weight, Starting Weight, Target Weight, Activity Multipliers (1.2 to 1.9), and Fitness Objective (Fat Loss, Aggressive Deficit, Maintenance, Muscle Gain).
   - Live auto-calculation of BMR, TDEE, daily calorie budget, and optimal protein intake (g).
2. **3-Pillar Transformation Roadmap**:
   - **What Will Do (The Strategy)**: Daily calorie deficit/surplus, target protein, and projected completion date based on 7,700 kcal/kg fat.
   - **How Much Done (Shift & Adherence)**: Exact kg shifted from start, percentage achieved toward target weight, visual progress bar, and active tracked days.
   - **What Can Do (Actionable Checklist)**: Dynamic checklist calculating immediate gaps for today (water cup with quick `+250ml` button, protein snack suggestions, steps walk timer, and uncompleted habits).
3. **Date-Wise Tracking & History Explorer**:
   - Date Navigator toolbar with `◀ Prev`, `<input type="date">`, `Next ▶`, and reactive `📍 Jump to Today`.
   - Comprehensive historical analytics table tracking **Date**, **Weight**, **Protein**, **Cals In**, **Burned**, **Net Cals**, **Steps**, **Water**, **Habits**, and **Health Score**, with a one-click `Load Day` button on every row.
4. **Discipline & Health Streaks**:
   - **Zero Fast Food Streak (🚫🍔)** & **Sugar-Free / Zero Sweets Streak (🚫🍭)** with active flame counters.
5. **Smart Water Reminder System**:
   - Configurable alert intervals (30m, 45m, 60m, 90m, 120m) with live countdown badge, audio water droplet chime, and Android vibration.
6. **Body Composition & Target Weight**:
   - Weight, Height, Target Weight, dynamic BMI badge, and one-tap weigh-in logger (`+ Log Weight`).
7. **Connected Smartwatch Live Telemetry**:
   - Simulated sensor pairing for Samsung Galaxy Watch, Apple Watch, Garmin, and Fitbit with real-time heart rate BPM, steps, and calorie sync.
8. **Universal Multi-Resolution Auto-Adjustment**:
   - Auto-adjusts seamlessly across all screens: Full HD desktops, 1280×589 laptops, tablets (768×1024), and Android mobiles (360×740, 390×844).
   - Modals support **Backdrop Click Dismiss**, **Escape Key Dismiss**, **Touch-Optimized Close Button**, and **Mobile Bottom-Sheet Mode**.

---

## 🚀 How to Setup on a New System or Server

### Prerequisites
- **Python 3.10+** (Python 3.10, 3.11, or 3.12)
- **Git**
- **pip** and `python3-venv`

---

### Step 1: Clone or Copy the Repository
```bash
git clone <your-repo-url> daily-health-coach
cd daily-health-coach
```

---

### Step 2: Create and Activate Virtual Environment
**On Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt):**
```cmd
python -m venv venv
.\venv\Scripts\activate.bat
```

---

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

---

### Step 4: Run the Server
You can launch using the pre-configured runner:
```bash
python run.py
```
Or directly with Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Why `0.0.0.0`?**
> Binding to `0.0.0.0` allows your desktop, laptop, AND any mobile phone connected to the same Wi-Fi network to access the server!

Open your browser:
- **Web App**: `http://localhost:8000`
- **API Swagger Docs**: `http://localhost:8000/docs`

---

### Step 5: Run Automated Tests
```bash
pytest tests/ -v
```
All 21 unit and integration tests will execute and pass.

---

## 🖥️ Server Production Deployment (Linux / VPS)

### Option A: Using systemd Service (Recommended for Ubuntu/Debian)
Create a systemd service file:
```bash
sudo nano /etc/systemd/system/daily-health-coach.service
```

Paste the following configuration:
```ini
[Unit]
Description=Daily Health Coach FastAPI Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/daily-health-coach
ExecStart=/var/www/daily-health-coach/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=5
Environment=PORT=8000
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable daily-health-coach
sudo systemctl start daily-health-coach
```

---

### Option B: Nginx Reverse Proxy with SSL (HTTPS)
To access your server via a custom domain with SSL:
```nginx
server {
    server_name health.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Install free SSL with Certbot:
```bash
sudo certbot --nginx -d health.yourdomain.com
```

---

## 📱 How to Check & Install on an Android Mobile

### Step 1: Find Your Computer / Server IP
**On Linux:**
```bash
hostname -I | awk '{print $1}'
# Example output: 192.168.1.50
```

**On Windows:**
```powershell
ipconfig
# Look for IPv4 Address: 192.168.1.x
```

**On macOS:**
```bash
ipconfig getifaddr en0
```

---

### Step 2: Open on Android Phone
1. Connect your Android phone to the **same Wi-Fi network** as your computer or server.
2. Open **Google Chrome** on your Android phone.
3. Type the URL into Chrome:
   ```
   http://192.168.1.x:8000
   ```
   *(Replace `192.168.1.x` with your computer's actual IP).*

---

### Step 3: Install as a Native Android App (PWA)
1. You will see an **`📲 Install Android App`** button at the top, or a bottom banner.
2. Alternatively, tap the **three dots menu (`⋮`)** in Chrome and select **`Add to Home screen`** or **`Install app`**.
3. Tap **Install**.
4. The **Daily Health Coach** icon will appear on your Android home screen and app drawer!
5. When opened from the home screen:
   - It runs in **standalone full-screen mode** with no browser address bar.
   - Offline caching is powered by the included Service Worker (`sw.js`).
   - Modals open as native bottom sheets.
   - Haptic vibration and audio feedback trigger when logging water, workouts, or checking habits.

---

### Step 4: Instant Android Simulator (Desktop Quick-Check)
If you don't have an Android device nearby:
1. Open `http://localhost:8000` on your desktop.
2. Click the **`📱 Android App View`** button in the top navigation bar.
3. An interactive Android smartphone shell with status bar, speaker notch, and touch navigation will appear directly on your screen.

---

## 🧪 Interactive API Documentation

Visit **`http://localhost:8000/docs`** to test all endpoints:
- `GET /api/today?date=YYYY-MM-DD`: Complete day summary, roadmap, scores, and coach tips.
- `GET /api/history/detailed?days=14`: Historical daily records table.
- `POST /api/metabolism/calculate`: Mifflin-St Jeor metabolic calculation.
- `POST /api/targets`: Update biological profile & goals.
- `POST /api/water`: Add water intake (ml).
- `POST /api/food`: Log meals, calories, and protein.
- `POST /api/activity`: Record workouts and steps.
- `POST /api/habits/toggle`: Check off daily discipline streaks and rituals.
- `POST /api/weight`: Log morning body weigh-in.
- `POST /api/wearable/sync`: Synchronize smartwatch telemetry.

---

## 📜 License
MIT License. 100% Open Source, Local-First, and Privacy-Focused.
