"""
Daily Health Coach - FastAPI Application Server
Provides REST API endpoints and serves the Web & Android PWA application.
"""
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import database as db
from . import coach
from . import seed_data
from .models import (
    Targets,
    WaterLogCreate,
    FoodLogCreate,
    ActivityLogCreate,
    HabitToggleRequest,
    DaySummary,
    HistoryDay,
    DateWiseRecord,
    MetabolismCalcRequest,
    WearableDevice,
    WatchTelemetry,
    WearableSyncRequest,
    WearablePairRequest,
    WeightLogCreate,
    WeightLogEntry
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and seed sample data
    db.init_db()
    seed_data.seed_database(force=False)
    yield


app = FastAPI(
    title="Daily Health Coach API",
    version="1.0.0",
    description="Python FastAPI backend powering the Daily Health Coach Web Dashboard and Android Application.",
    lifespan=lifespan
)

# CORS enabled for hybrid/mobile development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API Routes ---

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat(), "app": "Daily Health Coach"}


@app.get("/api/today", response_model=DaySummary)
def get_today_summary(date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format")):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    return coach.get_full_day_summary(target_date)


@app.post("/api/water", response_model=DaySummary)
def log_water(entry: WaterLogCreate):
    target_date = entry.date or datetime.now().strftime("%Y-%m-%d")
    timestamp = entry.timestamp or datetime.now().strftime("%I:%M %p")
    db.add_water_log(
        amount_ml=entry.amount_ml,
        timestamp=timestamp,
        date=target_date,
        note=entry.note
    )
    return coach.get_full_day_summary(target_date)


@app.delete("/api/water/{log_id}", response_model=DaySummary)
def remove_water(log_id: int, date: Optional[str] = None):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    db.delete_water_log(log_id)
    return coach.get_full_day_summary(target_date)


@app.post("/api/food", response_model=DaySummary)
def log_food(entry: FoodLogCreate):
    target_date = entry.date or datetime.now().strftime("%Y-%m-%d")
    timestamp = entry.timestamp or datetime.now().strftime("%I:%M %p")
    db.add_food_log(
        name=entry.name,
        meal_type=entry.meal_type,
        calories=entry.calories,
        protein_g=entry.protein_g,
        carbs_g=entry.carbs_g,
        fat_g=entry.fat_g,
        timestamp=timestamp,
        date=target_date
    )
    return coach.get_full_day_summary(target_date)


@app.delete("/api/food/{log_id}", response_model=DaySummary)
def remove_food(log_id: int, date: Optional[str] = None):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    db.delete_food_log(log_id)
    return coach.get_full_day_summary(target_date)


@app.post("/api/activity", response_model=DaySummary)
def log_activity(entry: ActivityLogCreate):
    target_date = entry.date or datetime.now().strftime("%Y-%m-%d")
    timestamp = entry.timestamp or datetime.now().strftime("%I:%M %p")
    db.add_activity_log(
        name=entry.name,
        duration_min=entry.duration_min,
        calories_burned=entry.calories_burned,
        steps=entry.steps,
        intensity=entry.intensity,
        timestamp=timestamp,
        date=target_date
    )
    return coach.get_full_day_summary(target_date)


@app.delete("/api/activity/{log_id}", response_model=DaySummary)
def remove_activity(log_id: int, date: Optional[str] = None):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    db.delete_activity_log(log_id)
    return coach.get_full_day_summary(target_date)


@app.post("/api/habits/toggle", response_model=DaySummary)
def toggle_habit(req: HabitToggleRequest):
    target_date = req.date or datetime.now().strftime("%Y-%m-%d")
    db.toggle_habit(req.habit_id, target_date)
    return coach.get_full_day_summary(target_date)


@app.get("/api/targets", response_model=Targets)
def get_targets():
    return Targets(**db.get_targets())


@app.put("/api/targets", response_model=DaySummary)
def update_targets(targets: Targets, date: Optional[str] = None):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    db.update_targets(targets.model_dump())
    return coach.get_full_day_summary(target_date)


@app.get("/api/history", response_model=List[HistoryDay])
def get_weekly_history():
    """Returns 7-day trend history for steps, water, calories, and health scores."""
    targets = Targets(**db.get_targets())
    history: List[HistoryDay] = []
    
    for i in range(6, -1, -1):
        d = datetime.now() - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        label = "Today" if i == 0 else d.strftime("%a")

        water_logs = db.get_water_logs(d_str)
        food_logs = db.get_food_logs(d_str)
        activity_logs = db.get_activity_logs(d_str)
        habits = db.get_habits(d_str)

        w_tot = sum(w["amount_ml"] for w in water_logs)
        steps_tot = sum(a["steps"] for a in activity_logs)
        cals_tot = sum(f["calories"] for f in food_logs)
        prot_tot = sum(f["protein_g"] for f in food_logs)
        hab_done = sum(1 for h in habits if h["completed"])
        hab_tot = max(1, len(habits))

        score_res = coach.calculate_health_score(
            water_ml=w_tot,
            water_target=targets.water_target_ml,
            steps=steps_tot,
            steps_target=targets.steps_target,
            protein_g=prot_tot,
            protein_target=targets.protein_target_g,
            calories_consumed=cals_tot,
            calories_target=targets.calories_target,
            habits_completed=hab_done,
            habits_total=hab_tot
        )

        history.append(HistoryDay(
            date=d_str,
            label=label,
            health_score=score_res["score"],
            steps=steps_tot,
            water_ml=w_tot,
            calories=cals_tot,
            protein_g=round(prot_tot, 1),
            habits_completed=hab_done
        ))

    return history


@app.get("/api/history/detailed", response_model=List[DateWiseRecord])
def get_detailed_history(days: int = Query(default=14, ge=1, le=90)):
    """Returns comprehensive date-wise records for historical tracking and analysis."""
    return coach.get_detailed_history(days=days)


@app.post("/api/metabolism/calculate")
def calculate_metabolism(req: MetabolismCalcRequest):
    """Calculates personalized BMR, TDEE, and recommended macro targets."""
    return coach.calculate_metabolism(
        age=req.age,
        gender=req.gender,
        height_cm=req.height_cm,
        weight_kg=req.current_weight_kg,
        activity_level=req.activity_level,
        fitness_goal=req.fitness_goal
    )


@app.post("/api/seed", response_model=DaySummary)
def reset_to_seed():
    """Forces reset and re-seeds with rich sample data."""
    seed_data.seed_database(force=True)
    today_str = datetime.now().strftime("%Y-%m-%d")
    return coach.get_full_day_summary(today_str)


# --- Smartwatch & Wearables Endpoints ---

@app.get("/api/wearable/status")
def get_wearable_status(date: Optional[str] = None):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    device = db.get_wearable_device()
    telemetry = db.get_latest_telemetry(target_date)
    return {
        "device": device,
        "telemetry": telemetry
    }


@app.post("/api/wearable/sync", response_model=DaySummary)
def sync_wearable(req: WearableSyncRequest):
    """
    Ingests smartwatch sensor telemetry (steps, heart rate, active calories, sleep)
    compatible with Wear OS / Health Connect, Apple HealthKit, and Garmin.
    """
    target_date = req.date or datetime.now().strftime("%Y-%m-%d")
    db.record_watch_telemetry(
        date=target_date,
        heart_rate_bpm=req.heart_rate_bpm,
        steps=req.steps,
        active_calories=req.active_calories,
        sleep_hours=req.sleep_hours,
        battery_pct=req.battery_pct
    )
    return coach.get_full_day_summary(target_date)


@app.post("/api/wearable/pair")
def pair_wearable(req: WearablePairRequest):
    """
    Switches active paired smartwatch model and ecosystem provider.
    """
    updated_device = db.pair_wearable_device(req.brand, req.model_name, req.provider)
    return {"status": "paired", "device": updated_device}


@app.post("/api/wearable/simulate-pulse", response_model=DaySummary)
def simulate_watch_pulse(date: Optional[str] = None):
    """
    Generates a realistic live telemetry update (pedometer increment + HR pulse)
    so the user can immediately test watch data reflection.
    """
    import random
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    current_telemetry = db.get_latest_telemetry(target_date)

    # Realistic random step bump and heart rate fluctuation
    new_steps = current_telemetry.get("steps", 5000) + random.randint(150, 420)
    new_cals = current_telemetry.get("active_calories", 200) + random.randint(12, 28)
    new_hr = random.randint(68, 88)
    new_battery = max(15, current_telemetry.get("battery_pct", 86) - random.choice([0, 0, 1]))

    db.record_watch_telemetry(
        date=target_date,
        heart_rate_bpm=new_hr,
        steps=new_steps,
        active_calories=new_cals,
        battery_pct=new_battery
    )
    return coach.get_full_day_summary(target_date)


# --- Weight & Body Goals Endpoints ---

@app.post("/api/weight", response_model=DaySummary)
def log_weight(entry: WeightLogCreate):
    target_date = entry.date or datetime.now().strftime("%Y-%m-%d")
    db.log_weight(entry.weight_kg, target_date, entry.note)
    return coach.get_full_day_summary(target_date)


@app.get("/api/weight/history")
def get_weight_history():
    return db.get_weight_logs()


# --- Static and PWA Handlers ---

@app.get("/manifest.json")
def get_manifest():
    manifest_path = os.path.join(STATIC_DIR, "manifest.json")
    if os.path.exists(manifest_path):
        return FileResponse(manifest_path, media_type="application/manifest+json")
    raise HTTPException(status_code=404, detail="Manifest not found")


@app.get("/sw.js")
def get_service_worker():
    sw_path = os.path.join(STATIC_DIR, "sw.js")
    if os.path.exists(sw_path):
        response = FileResponse(sw_path, media_type="application/javascript")
        response.headers["Service-Worker-Allowed"] = "/"
        return response
    raise HTTPException(status_code=404, detail="Service worker not found")


# Mount static assets directory
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Mount subdirectories for relative path support from /
for sub in ["css", "js", "assets"]:
    sub_dir = os.path.join(STATIC_DIR, sub)
    if os.path.exists(sub_dir):
        app.mount(f"/{sub}", StaticFiles(directory=sub_dir), name=f"static_{sub}")


@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend index.html is being prepared"}
