# 🛠️ Technologies & Methods — Daily Health Coach

> **Comprehensive Technical Specification: Architecture Stack, Scientific Energetics & Engineering Methodologies**  
> **Repository:** Daily Health Coach  
> **Status:** Production-Grade Reference  
> **Target Platforms:** Web Dashboard (Desktop/Laptop/Tablet) & Android Native / PWA  

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Breakdown](#2-technology-stack-breakdown)
   - [2.1 Backend Core](#21-backend-core)
   - [2.2 Persistence & Database](#22-persistence--database)
   - [2.3 Frontend Presentation & UX](#23-frontend-presentation--ux)
   - [2.4 Mobile, PWA & Packaging](#24-mobile-pwa--packaging)
   - [2.5 Quality Assurance & Testing](#25-quality-assurance--testing)
   - [2.6 Production Server & Deployment](#26-production-server--deployment)
3. [Scientific & Biological Methodologies](#3-scientific--biological-methodologies)
   - [3.1 Mifflin-St Jeor Metabolic Model](#31-mifflin-st-jeor-metabolic-model)
   - [3.2 Adipose Tissue Caloric Density Model (7,700 kcal/kg)](#32-adipose-tissue-caloric-density-model-7700-kcalkg)
   - [3.3 Macronutrient Partitioning Methodology](#33-macronutrient-partitioning-methodology)
   - [3.4 Body Mass Index (BMI) & Quetelet Metrics](#34-body-mass-index-bmi--quetelet-metrics)
4. [Algorithmic & Heuristic Methodologies](#4-algorithmic--heuristic-methodologies)
   - [4.1 4-Pillar Composite Health Score Algorithm](#41-4-pillar-composite-health-score-algorithm)
   - [4.2 3-Pillar Transformation Roadmap Engine](#42-3-pillar-transformation-roadmap-engine)
   - [4.3 Contextual Rule-Based AI Coach System (14+ Rules)](#43-contextual-rule-based-ai-coach-system-14-rules)
   - [4.4 Smartwatch Sensor Telemetry Fusion](#44-smartwatch-sensor-telemetry-fusion)
5. [Software Architecture & UI/UX Methodologies](#5-software-architecture--uiux-methodologies)
   - [5.1 Layered & Separation of Concerns Architecture](#51-layered--separation-of-concerns-architecture)
   - [5.2 Local-First & Zero Cloud Lock-In](#52-local-first--zero-cloud-lock-in)
   - [5.3 Reactive DOM State Management](#53-reactive-dom-state-management)
   - [5.4 Universal Multi-Resolution Auto-Adjustment](#54-universal-multi-resolution-auto-adjustment)
   - [5.5 Synthetic Sensory Feedback (Web Audio & Haptics)](#55-synthetic-sensory-feedback-web-audio--haptics)
6. [Cross-Reference Matrix](#6-cross-reference-matrix)

---

## 1. Executive Summary

**Daily Health Coach** is architected to combine the high computational performance of Python (FastAPI), the reliability of zero-configuration local persistence (SQLite), and the responsive agility of native web standards (Vanilla HTML5, CSS3, ES6+ JS) with zero runtime bloat.

By eliminating heavy JavaScript frameworks (such as React, Angular, or Next.js) and third-party cloud database dependencies, the application achieves:
* **Instant Load Times**: Sub-50ms page renders and minimal asset payloads.
* **100% Data Sovereignty**: All bio-metrics, meals, weigh-ins, and health logs remain strictly on the user's personal hardware.
* **Biological Accuracy**: Nutrition and calorie goals are derived using clinically validated bio-energetic equations rather than arbitrary guesses.

---

## 2. Technology Stack Breakdown

### 2.1 Backend Core

| Technology | Version | Purpose & Architectural Role | Key Implementation File |
| :--- | :--- | :--- | :--- |
| **Python** | `3.10+ / 3.12` | Core server language; executes data modeling, metabolic calculations, database queries, and coaching heuristics. | [`app/main.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/main.py) |
| **FastAPI** | `v0.115+` | High-performance ASGI framework providing structured routing, dependency injection, CORS middleware, and automatic Swagger OpenAPI documentation (`/docs`). | [`app/main.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/main.py) |
| **Pydantic** | `v2.10+` | Data parsing, strict type validation, range enforcement (e.g. weight bounds, calorie limits), and JSON serialization. | [`app/models.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/models.py) |
| **Uvicorn** | `v0.34+` | Production ASGI web server running the asynchronous event loop with reload support and multi-worker execution. | [`run.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/run.py) |
| **Starlette** | Core toolkit | Provides static asset serving (`/static`), CORS middleware policies, and application lifespan events (`@asynccontextmanager`). | [`app/main.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/main.py) |

---

### 2.2 Persistence & Database

| Technology | Purpose & Architectural Role | Key Implementation File |
| :--- | :--- | :--- |
| **SQLite3** | Embedded, serverless relational database engine stored as `health_coach.db`. Zero cloud subscription required, multi-table schema, and single-file portability. | [`app/database.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/database.py) |
| **Programmatic Auto-Migrations** | Non-destructive schema migration engine that inspects existing tables on startup and applies non-breaking `ALTER TABLE ADD COLUMN` operations dynamically. | [`app/database.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/database.py#L57-L75) |
| **Automated Data Seeder** | Realistic multi-day seed engine that generates 7 continuous days of workouts, meals, hydration, habits, and weight logs. | [`app/seed_data.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/seed_data.py) |

---

### 2.3 Frontend Presentation & UX

| Technology | Purpose & Architectural Role | Key Implementation File |
| :--- | :--- | :--- |
| **HTML5** | Semantic layout structure (`<header>`, `<main>`, `<section>`, `<nav>`), SVG circular score ring, modal containers, and accessibility attributes (`aria-label`, `role`). | [`static/index.html`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/index.html) |
| **Vanilla CSS3** | Custom design system using CSS Custom Properties (Tokens), CSS Grid (`repeat(auto-fit, minmax(...))`), Flexbox, Glassmorphism (`backdrop-filter`), and CSS Keyframe animations. | [`static/css/design-system.css`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/css/design-system.css), [`layout.css`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/css/layout.css), [`components.css`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/css/components.css) |
| **Vanilla ES6+ JavaScript** | High-performance reactive controller (`HealthCoachApp`) managing application state, DOM event delegation, modal transitions, and date navigation without heavy frontend libraries. | [`static/js/app.js`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/js/app.js) |
| **HTML5 Canvas API** | Lightweight vector chart visualizer rendering 7-day health trend bars and lines without external charting libraries. | [`static/js/charts.js`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/js/charts.js) |
| **Web Audio API** | Real-time synthetic audio frequency synthesizer generating water drop chimes and habit completion tones in pure code without MP3 downloads. | [`static/js/sound.js`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/js/sound.js) |
| **Navigator Vibrate API** | Hardware haptic vibration for Android mobile devices (`navigator.vibrate([40, 60, 40])`) on user actions. | [`static/js/sound.js`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/js/sound.js#L75-L82) |

---

### 2.4 Mobile, PWA & Packaging

| Technology | Purpose & Architectural Role | Key Implementation File |
| :--- | :--- | :--- |
| **Progressive Web App (PWA)** | Enables direct home-screen installation on Android phones with standalone full-screen mode, splash screens, and app icon. | [`static/manifest.json`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/manifest.json) |
| **Service Worker (`sw.js`)** | Background caching layer providing offline capabilities via Cache-First (static assets) and Network-First (API queries) strategies. | [`static/sw.js`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/sw.js) |
| **Capacitor** | Native Android container bridge configuration to compile the web application into a standalone Android APK. | [`capacitor.config.json`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/capacitor.config.json) |

---

### 2.5 Quality Assurance & Testing

| Technology | Purpose & Architectural Role | Key Implementation File |
| :--- | :--- | :--- |
| **Pytest** | Automated unit & integration testing framework verifying 21 distinct tests across endpoints, coaching logic, habits, and wearables. | [`tests/`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/tests) |
| **Headless Browser Automation** | Multi-resolution layout and responsive modal verification script (`verify_browser.mjs`) checking for zero horizontal scroll and proper dismissal. | [`verify_browser.mjs`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/verify_browser.mjs) |

---

### 2.6 Production Server & Deployment

| Technology | Purpose & Architectural Role | Key Reference |
| :--- | :--- | :--- |
| **systemd** | Linux system service daemon managing process lifecycle, auto-restart on crashes, and background daemon execution. | [`docs/ARCHITECTURE_AND_FLOW.md`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/docs/ARCHITECTURE_AND_FLOW.md#101-bare-metal--vps-deployment-ubuntu--debian) |
| **Nginx** | High-performance reverse proxy handling HTTPS termination, Gzip/Brotli compression, and proxy header forwarding. | [`docs/ARCHITECTURE_AND_FLOW.md`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/docs/ARCHITECTURE_AND_FLOW.md#102-nginx-reverse-proxy-with-ssl-https) |
| **Certbot (Let's Encrypt)** | Automated SSL/TLS certificate management providing free, auto-renewing HTTPS encryption. | [`README.md`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/README.md#option-b-nginx-reverse-proxy-with-ssl-https) |

---

## 3. Scientific & Biological Methodologies

### 3.1 Mifflin-St Jeor Metabolic Model
Rather than guessing calorie burn, the engine applies the **Mifflin-St Jeor formula**, recognized by the American Dietetic Association as the gold standard in clinical dietetics:

$$\text{BMR} = 10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (years)} + s$$

**Biological Sex Constant ($s$):**
* **Biological Male**: $s = +5$
* **Biological Female**: $s = -161$
* **Gender Neutral / Other**: $s = -78$ *(interpolated midpoint)*

**Activity Multiplier to Determine TDEE ($BMR \times M$):**
* **Sedentary ($1.20$)**: Desk job, minimal walking.
* **Lightly Active ($1.375$)**: Light walking / exercise 1–3 days/week.
* **Moderately Active ($1.55$)**: Moderate workouts 3–5 days/week.
* **Very Active ($1.725$)**: Intense athletic training 6–7 days/week.

```
Biological Profile (Age, Sex, Height, Weight)
                 │
                 ▼
        [ Mifflin-St Jeor ]
                 │
                 ▼
          BMR (kcal/day)
                 │
                 ▼  × Activity Multiplier (1.2 - 1.725)
          TDEE (Total Daily Energy Expenditure)
```

---

### 3.2 Adipose Tissue Caloric Density Model (7,700 kcal/kg)
To provide realistic timeline projections:
* $1\text{ kg}$ of human adipose tissue stores approximately **$7,700\text{ kcal}$** of energy.
* A sustainable daily deficit of **$500\text{ kcal}$** produces:
  $$\text{Weekly Fat Loss Rate} = \frac{500 \times 7}{7,700} \approx 0.45\text{ to }0.50\text{ kg/week}$$
* The system computes projected target weeks:
  $$\text{Weeks to Target} = \frac{|\text{Current Weight} - \text{Target Weight}|}{0.5\text{ kg/week}}$$
* The projected date is then dynamically calculated:
  $$\text{Target Date} = \text{Current Date} + (\text{Weeks to Target} \times 7\text{ days})$$

---

### 3.3 Macronutrient Partitioning Methodology
Macronutrients are budgeted using evidence-based sports nutrition principles:
1. **Protein Quota**:
   * **Fat Loss**: $2.0\text{ g/kg}$ of bodyweight *(protects muscle mass during a calorie deficit and increases thermogenesis)*.
   * **Muscle Hypertrophy**: $1.9\text{ g/kg}$ of bodyweight.
   * **Maintenance**: $1.6\text{ g/kg}$ of bodyweight.
2. **Dietary Fat Floor**:
   * Fixed at **$25\%$ of total daily calories** ($\div 9\text{ kcal/g}$) to ensure essential hormone production and vitamin absorption.
3. **Complex Carbohydrate Budget**:
   * Allocated from the remaining calories ($\div 4\text{ kcal/g}$) to fuel daily cognitive energy and glycogen stores.

---

### 3.4 Body Mass Index (BMI) & Quetelet Metrics
Dynamic calculation of BMI:
$$\text{BMI} = \frac{\text{weight (kg)}}{(\text{height (m)})^2}$$
* Categorized as:
  * $<18.5$: Underweight
  * $18.5$ – $24.9$: Normal Weight
  * $25.0$ – $29.9$: Overweight
  * $\ge 30.0$: Obese

---

## 4. Algorithmic & Heuristic Methodologies

### 4.1 4-Pillar Composite Health Score Algorithm
Daily health is evaluated on a normalized **$0$ to $100$ point composite scale**, giving equal weight to 4 essential lifestyle dimensions:

$$\text{Health Score} = S_{\text{Hydration}} + S_{\text{Movement}} + S_{\text{Fuel}} + S_{\text{Habits}}$$

```
┌──────────────────────────────────────────────────────────┐
│              DAILY HEALTH SCORE (100 PTS)                │
├─────────────┬─────────────┬──────────────┬───────────────┤
│  HYDRATION  │  MOVEMENT   │     FUEL     │    HABITS     │
│   (25 pts)  │   (25 pts)  │   (25 pts)   │   (25 pts)    │
│  Water Target│ Step Goal  │ Protein Goal │ Daily Rituals │
│  Achievement│ Achievement │ & Cal Balance│  & Streaks    │
└─────────────┴─────────────┴──────────────┴───────────────┘
```

1. **Hydration Pillar ($0$–$25$ pts):**
   $$S_{\text{Hydration}} = \text{round}\left(\min(1.0, \frac{\text{Water Logged}}{\text{Water Target}}) \times 25\right)$$
2. **Movement Pillar ($0$–$25$ pts):**
   $$S_{\text{Movement}} = \text{round}\left(\min(1.0, \frac{\text{Steps Counted}}{\text{Steps Target}}) \times 25\right)$$
3. **Fuel & Nutrition Pillar ($0$–$25$ pts):**
   $$\text{Protein Ratio} = \min(1.0, \frac{\text{Protein Logged}}{\text{Protein Target}})$$
   $$\text{Calorie Penalty} = 5 \text{ pts if Calories Consumed} > 1.25 \times \text{Calorie Target}$$
   $$S_{\text{Fuel}} = \max(0, \text{round}(\text{Protein Ratio} \times 25) - \text{Calorie Penalty})$$
4. **Micro-Habits Pillar ($0$–$25$ pts):**
   $$S_{\text{Habits}} = \text{round}\left(\frac{\text{Habits Completed}}{\text{Habits Total}} \times 25\right)$$

---

### 4.2 3-Pillar Transformation Roadmap Engine
The roadmap engine eliminates ambiguity by answering three psychological questions:
1. **What Will Do (The Strategic Direction)**:
   * Displays the planned calorie deficit or surplus, daily protein requirement, and calculated target completion date.
2. **How Much Done (The Cumulative Progress)**:
   * Tracks weight shifted from the starting weight, total active days logged in the database, and percentage progress toward the goal weight.
3. **What Can Do (The Immediate Daily Action Checklist)**:
   * Calculates remaining gaps in real-time (water remaining $\rightarrow$ suggested 250ml glasses, protein remaining $\rightarrow$ high-protein snack suggestions, steps remaining $\rightarrow$ estimated walking minutes needed).

---

### 4.3 Contextual Rule-Based AI Coach System (14+ Rules)
The coach operates as an automated expert heuristic system, evaluating contextual variables:
* **Time of Day Rule**: Delivers a Morning Primer before 12 PM, an Afternoon Hydration Alert after 2 PM if water intake is $<50\%$, and an Evening Ritual Review after 7 PM.
* **Dehydration Alert Rule**: Warns the user when dehydration is the likely cause of afternoon fatigue.
* **Protein Gap Analysis**: Suggests Greek yogurt, eggs, or protein shakes when protein targets lag behind calorie consumption.
* **Caloric Surplus Warning**: Warns when consumption exceeds $125\%$ of the budget and recommends an evening walk to burn off the excess.
* **Discipline Streaks**: Reinforces consecutive Zero Fast Food and Sugar-Free days.

---

### 4.4 Smartwatch Sensor Telemetry Fusion
* Ingests sensor data (heart rate, step counts, active calories, sleep) from smartwatch bridges (Google Health Connect, Apple HealthKit, Garmin, Fitbit).
* Classifies heart rate into physiological training zones:
  * $<65\text{ BPM}$: *Resting Zone*
  * $65\text{–}109\text{ BPM}$: *Fat Burn Zone*
  * $110\text{–}149\text{ BPM}$: *Cardio Zone*
  * $\ge 150\text{ BPM}$: *Peak Zone*
* Automatically merges watch steps and active calories into the daily activity ledger.

---

## 5. Software Architecture & UI/UX Methodologies

### 5.1 Layered & Separation of Concerns Architecture
The codebase is structured into four isolated layers:
1. **Presentation Layer**: Client browser, PWA shell, sound engine, and responsive styles.
2. **API Layer**: FastAPI endpoints, CORS handling, and Pydantic validation.
3. **Domain Layer**: Metabolic equations, health score engine, and heuristic coaching rules.
4. **Persistence Layer**: SQLite connection lifecycle and migration handling.

---

### 5.2 Local-First & Zero Cloud Lock-In
* Operates completely offline without requiring cloud accounts or remote servers.
* User data is stored in a standard SQLite file that can be easily backed up or migrated.

---

### 5.3 Reactive DOM State Management
* Centralizes all client data inside the `HealthCoachApp` state object.
* State modifications trigger targeted DOM element updates, avoiding full-page reloads.

---

### 5.4 Universal Multi-Resolution Auto-Adjustment
* **Fluid Layouts**: Uses responsive CSS Grid (`repeat(auto-fit, minmax(280px, 1fr))`) and relative units to adapt across 1080p desktops, 1280×589 laptops, tablets, and mobile phones.
* **Adaptive Modals**: Desktop centered modals automatically transform into **native mobile bottom sheets** on smaller viewports ($<600\text{px}$).
* **3-Way Dismissal**: Modals can be dismissed by tapping the backdrop overlay, pressing the keyboard `Escape` key, or tapping the close button.

---

### 5.5 Synthetic Sensory Feedback (Web Audio & Haptics)
* **Web Audio Synthesis**: Generates clean, pleasant tones via the browser's native audio synthesizer without loading MP3 files:
  * *Water Droplet Chime*: Sine wave sweep from $587.33\text{ Hz}$ to $880.0\text{ Hz}$.
  * *Habit Success Chord*: Ascending pentatonic chord ($523.25\text{ Hz} \rightarrow 659.25\text{ Hz} \rightarrow 783.99\text{ Hz}$).
* **Device Haptics**: Triggers tactile vibration patterns on Android mobile devices via `navigator.vibrate([40, 60, 40])`.

---

## 6. Cross-Reference Matrix

| Topic / Requirement | Implementation File | Documentation Reference |
| :--- | :--- | :--- |
| **Metabolic BMR / TDEE** | [`app/coach.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/coach.py#L258-L330) | [Section 3.1](#31-mifflin-st-jeor-metabolic-model) |
| **4-Pillar Health Score** | [`app/coach.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/coach.py#L15-L75) | [Section 4.1](#41-4-pillar-composite-health-score-algorithm) |
| **Transformation Roadmap** | [`app/coach.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/coach.py#L331-L470) | [Section 4.2](#42-3-pillar-transformation-roadmap-engine) |
| **Database Schema** | [`app/database.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/database.py#L25-L190) | [`docs/ARCHITECTURE_AND_FLOW.md`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/docs/ARCHITECTURE_AND_FLOW.md#5-database-architecture--entity-relationship-diagram-erd) |
| **REST Endpoints** | [`app/main.py`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/app/main.py#L65-L350) | [`docs/ARCHITECTURE_AND_FLOW.md`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/docs/ARCHITECTURE_AND_FLOW.md#7-comprehensive-rest-api-reference) |
| **Responsive Grid & Modals** | [`static/css/layout.css`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/css/layout.css) | [Section 5.4](#54-universal-multi-resolution-auto-adjustment) |
| **Sound & Haptics** | [`static/js/sound.js`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/js/sound.js) | [Section 5.5](#55-synthetic-sensory-feedback-web-audio--haptics) |
| **Android PWA & Offline** | [`static/sw.js`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/sw.js), [`manifest.json`](file:///home/ranjith/.gemini/antigravity-ide/scratch/daily-health-coach/static/manifest.json) | [Section 2.4](#24-mobile-pwa--packaging) |

---

*Daily Health Coach is open-source software released under the MIT License.*  
*Designed for personal sovereignty, biological vitality, and continuous progress.*
