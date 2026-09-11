"""
SQLite Database module for Daily Health Coach.
Handles schema initialization, CRUD operations, and transaction management.
"""
import sqlite3
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "health_coach.db"))


_db_initialized = False

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pw_hash, salt

def verify_password(password: str, pw_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, pw_hash)

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

def get_connection() -> sqlite3.Connection:
    global _db_initialized
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    if not _db_initialized:
        _db_initialized = True
        init_db()
    return conn


def init_db():
    """Initializes the database schema if tables do not exist."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Targets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS targets (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                water_target_ml INTEGER DEFAULT 2500,
                steps_target INTEGER DEFAULT 10000,
                calories_target INTEGER DEFAULT 2100,
                protein_target_g INTEGER DEFAULT 130,
                carbs_target_g INTEGER DEFAULT 220,
                fat_target_g INTEGER DEFAULT 65,
                sleep_target_hours REAL DEFAULT 8.0,
                current_weight_kg REAL DEFAULT 78.5,
                height_cm REAL DEFAULT 175.0,
                target_weight_kg REAL DEFAULT 72.0,
                starting_weight_kg REAL DEFAULT 80.0,
                age INTEGER DEFAULT 28,
                gender TEXT DEFAULT 'Male',
                fitness_goal TEXT DEFAULT 'Lose Weight',
                activity_level TEXT DEFAULT 'Moderately Active',
                bmr_kcal INTEGER DEFAULT 1720,
                tdee_kcal INTEGER DEFAULT 2400,
                water_reminder_interval_min INTEGER DEFAULT 60,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("INSERT OR IGNORE INTO targets (id) VALUES (1)")

        # Migration safe-checks for targets table
        for col, col_type, default_val in [
            ("current_weight_kg", "REAL", "78.5"),
            ("height_cm", "REAL", "175.0"),
            ("target_weight_kg", "REAL", "72.0"),
            ("starting_weight_kg", "REAL", "80.0"),
            ("age", "INTEGER", "28"),
            ("gender", "TEXT", "'Male'"),
            ("fitness_goal", "TEXT", "'Lose Weight'"),
            ("activity_level", "TEXT", "'Moderately Active'"),
            ("bmr_kcal", "INTEGER", "1720"),
            ("tdee_kcal", "INTEGER", "2400"),
            ("water_reminder_interval_min", "INTEGER", "60")
        ]:
            try:
                cursor.execute(f"ALTER TABLE targets ADD COLUMN {col} {col_type} DEFAULT {default_val}")
            except sqlite3.OperationalError:
                pass

        # Water logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS water_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount_ml INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Food logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS food_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                meal_type TEXT NOT NULL,
                calories INTEGER NOT NULL,
                protein_g REAL DEFAULT 0.0,
                carbs_g REAL DEFAULT 0.0,
                fat_g REAL DEFAULT 0.0,
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Activity logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                duration_min INTEGER NOT NULL,
                calories_burned INTEGER NOT NULL,
                steps INTEGER DEFAULT 0,
                intensity TEXT DEFAULT 'Moderate',
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Habits table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS habits (
                id TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                icon TEXT NOT NULL,
                date TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                streak_count INTEGER DEFAULT 1,
                PRIMARY KEY (id, date)
            )
        """)

        # User profile / streak meta
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_meta (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        cursor.execute("INSERT OR IGNORE INTO user_meta (key, value) VALUES ('current_streak', '5')")
        cursor.execute("INSERT OR IGNORE INTO user_meta (key, value) VALUES ('user_name', 'Alex')")

        # Smartwatches / Wearable Devices
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wearable_devices (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                brand TEXT DEFAULT 'Samsung Galaxy Watch',
                model_name TEXT DEFAULT 'Galaxy Watch 6 Pro',
                provider TEXT DEFAULT 'Google Health Connect / Wear OS',
                is_connected INTEGER DEFAULT 1,
                battery_pct INTEGER DEFAULT 86,
                last_sync_timestamp TEXT DEFAULT '2m ago',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("INSERT OR IGNORE INTO wearable_devices (id) VALUES (1)")

        # Wearable Telemetry (HR, Steps, Sleep, Active Cals)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wearable_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                heart_rate_bpm INTEGER DEFAULT 72,
                resting_hr INTEGER DEFAULT 62,
                hr_zone TEXT DEFAULT 'Resting Zone',
                steps INTEGER DEFAULT 0,
                active_calories INTEGER DEFAULT 0,
                sleep_hours REAL DEFAULT 7.5,
                sleep_quality_pct INTEGER DEFAULT 88,
                battery_pct INTEGER DEFAULT 86,
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Weight Logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weight_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                weight_kg REAL NOT NULL,
                date TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                full_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # User Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Ensure default demo user exists
        cursor.execute("SELECT id FROM users WHERE username = 'demo'")
        if not cursor.fetchone():
            p_hash, p_salt = hash_password("demo123")
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, password_salt, full_name)
                VALUES ('demo', 'demo@dailyhealthcoach.app', ?, ?, 'Demo Athlete')
            """, (p_hash, p_salt))

        conn.commit()


# --- User Authentication CRUD ---
def get_user_by_username_or_email(ident: str) -> Optional[Dict[str, Any]]:
    clean = ident.strip().lower()
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE username = ? OR email = ?", (clean, clean)).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def create_user(username: str, email: str, password: str, full_name: str) -> Dict[str, Any]:
    username_clean = username.strip().lower()
    email_clean = email.strip().lower()
    p_hash, p_salt = hash_password(password)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, password_salt, full_name)
            VALUES (?, ?, ?, ?, ?)
        """, (username_clean, email_clean, p_hash, p_salt, full_name.strip()))
        user_id = cursor.lastrowid
        conn.commit()
        return {
            "id": user_id,
            "username": username_clean,
            "email": email_clean,
            "full_name": full_name.strip(),
            "is_demo": bool(username_clean == "demo")
        }


def create_session(user_id: int) -> str:
    token = generate_session_token()
    expires_at = (datetime.now() + timedelta(days=30)).isoformat()
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO user_sessions (token, user_id, expires_at)
            VALUES (?, ?, ?)
        """, (token, user_id, expires_at))
        conn.commit()
    return token


def get_session_user(token: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("""
            SELECT u.* FROM users u
            JOIN user_sessions s ON u.id = s.user_id
            WHERE s.token = ? AND s.expires_at > datetime('now')
        """, (token,)).fetchone()
        if not row:
            return None
        user = dict(row)
        user["is_demo"] = bool(user["username"] == "demo")
        return user


def delete_session(token: str):
    with get_connection() as conn:
        conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
        conn.commit()


# --- Targets CRUD ---
def get_targets() -> Dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM targets WHERE id = 1").fetchone()
        if row:
            d = dict(row)
            d.setdefault("current_weight_kg", 78.5)
            d.setdefault("height_cm", 175.0)
            d.setdefault("target_weight_kg", 72.0)
            d.setdefault("starting_weight_kg", 80.0)
            d.setdefault("age", 28)
            d.setdefault("gender", "Male")
            d.setdefault("fitness_goal", "Lose Weight")
            d.setdefault("activity_level", "Moderately Active")
            d.setdefault("bmr_kcal", 1720)
            d.setdefault("tdee_kcal", 2400)
            d.setdefault("water_reminder_interval_min", 60)
            return d
        return {
            "water_target_ml": 2500,
            "steps_target": 10000,
            "calories_target": 2100,
            "protein_target_g": 130,
            "carbs_target_g": 220,
            "fat_target_g": 65,
            "sleep_target_hours": 8.0,
            "current_weight_kg": 78.5,
            "height_cm": 175.0,
            "target_weight_kg": 72.0,
            "starting_weight_kg": 80.0,
            "age": 28,
            "gender": "Male",
            "fitness_goal": "Lose Weight",
            "activity_level": "Moderately Active",
            "bmr_kcal": 1720,
            "tdee_kcal": 2400,
            "water_reminder_interval_min": 60
        }


def update_targets(data: Dict[str, Any]) -> Dict[str, Any]:
    defaults = {
        "water_target_ml": 2500,
        "steps_target": 10000,
        "calories_target": 2100,
        "protein_target_g": 130,
        "carbs_target_g": 220,
        "fat_target_g": 65,
        "sleep_target_hours": 8.0,
        "current_weight_kg": 78.5,
        "height_cm": 175.0,
        "target_weight_kg": 72.0,
        "starting_weight_kg": 80.0,
        "age": 28,
        "gender": "Male",
        "fitness_goal": "Lose Weight",
        "activity_level": "Moderately Active",
        "bmr_kcal": 1720,
        "tdee_kcal": 2400,
        "water_reminder_interval_min": 60
    }
    payload = {**defaults, **data}
    with get_connection() as conn:
        conn.execute("""
            UPDATE targets SET
                water_target_ml = :water_target_ml,
                steps_target = :steps_target,
                calories_target = :calories_target,
                protein_target_g = :protein_target_g,
                carbs_target_g = :carbs_target_g,
                fat_target_g = :fat_target_g,
                sleep_target_hours = :sleep_target_hours,
                current_weight_kg = :current_weight_kg,
                height_cm = :height_cm,
                target_weight_kg = :target_weight_kg,
                starting_weight_kg = :starting_weight_kg,
                age = :age,
                gender = :gender,
                fitness_goal = :fitness_goal,
                activity_level = :activity_level,
                bmr_kcal = :bmr_kcal,
                tdee_kcal = :tdee_kcal,
                water_reminder_interval_min = :water_reminder_interval_min,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """, payload)
        conn.commit()
    return get_targets()


# --- Water CRUD ---
def add_water_log(amount_ml: int, timestamp: str, date: str, note: Optional[str] = None) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO water_logs (amount_ml, timestamp, date, note) VALUES (?, ?, ?, ?)",
            (amount_ml, timestamp, date, note)
        )
        conn.commit()
        return cursor.lastrowid


def get_water_logs(date: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM water_logs WHERE date = ? ORDER BY id DESC", (date,)
        ).fetchall()
        return [dict(r) for r in rows]


def delete_water_log(log_id: int):
    with get_connection() as conn:
        conn.execute("DELETE FROM water_logs WHERE id = ?", (log_id,))
        conn.commit()


# --- Food CRUD ---
def add_food_log(name: str, meal_type: str, calories: int, protein_g: float, carbs_g: float, fat_g: float, timestamp: str, date: str) -> int:
    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO food_logs (name, meal_type, calories, protein_g, carbs_g, fat_g, timestamp, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (name, meal_type, calories, protein_g, carbs_g, fat_g, timestamp, date))
        conn.commit()
        return cursor.lastrowid


def get_food_logs(date: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM food_logs WHERE date = ? ORDER BY id DESC", (date,)
        ).fetchall()
        return [dict(r) for r in rows]


def delete_food_log(log_id: int):
    with get_connection() as conn:
        conn.execute("DELETE FROM food_logs WHERE id = ?", (log_id,))
        conn.commit()


# --- Activity CRUD ---
def add_activity_log(name: str, duration_min: int, calories_burned: int, steps: int, intensity: str, timestamp: str, date: str) -> int:
    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO activity_logs (name, duration_min, calories_burned, steps, intensity, timestamp, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, duration_min, calories_burned, steps, intensity, timestamp, date))
        conn.commit()
        return cursor.lastrowid


def get_activity_logs(date: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM activity_logs WHERE date = ? ORDER BY id DESC", (date,)
        ).fetchall()
        return [dict(r) for r in rows]


def delete_activity_log(log_id: int):
    with get_connection() as conn:
        conn.execute("DELETE FROM activity_logs WHERE id = ?", (log_id,))
        conn.commit()


# --- Habits CRUD ---
DEFAULT_HABITS_DEF = [
    {"id": "habit_no_fastfood", "title": "Zero Fast Food / Clean Eating", "category": "Discipline", "icon": "🚫🍔", "initial_streak": 8},
    {"id": "habit_no_sweets", "title": "Sugar-Free / Zero Sweets", "category": "Discipline", "icon": "🚫🍭", "initial_streak": 5},
    {"id": "habit_water_reminder", "title": "Hydration Reminder Target Hit", "category": "Hydration", "icon": "💧⏰", "initial_streak": 6},
    {"id": "habit_water_kick", "title": "Morning Hydration (500ml)", "category": "Morning", "icon": "💧", "initial_streak": 4},
    {"id": "habit_sunlight", "title": "15-Min Morning Sunlight / Walk", "category": "Morning", "icon": "☀️", "initial_streak": 3},
    {"id": "habit_steps", "title": "Move Every Hour (8k+ Steps)", "category": "Movement", "icon": "🚶‍♂️", "initial_streak": 5},
    {"id": "habit_protein", "title": "Hit Protein Goal in Every Meal", "category": "Fuel", "icon": "🥗", "initial_streak": 4},
    {"id": "habit_mind", "title": "5-Min Breathwork / Reset", "category": "Mind", "icon": "🧘", "initial_streak": 2},
    {"id": "habit_screen", "title": "Screens Off 45m Before Bed", "category": "Night", "icon": "🌙", "initial_streak": 4},
]


def ensure_habits_for_date(date: str):
    """Ensures standard habit checklist exists for the specified date."""
    with get_connection() as conn:
        existing = conn.execute("SELECT id FROM habits WHERE date = ?", (date,)).fetchall()
        existing_ids = {r["id"] for r in existing}
        for h in DEFAULT_HABITS_DEF:
            if h["id"] not in existing_ids:
                init_streak = h.get("initial_streak", 3)
                conn.execute("""
                    INSERT INTO habits (id, title, category, icon, date, completed, streak_count)
                    VALUES (?, ?, ?, ?, ?, 0, ?)
                """, (h["id"], h["title"], h["category"], h["icon"], date, init_streak))
        conn.commit()


def get_habits(date: str) -> List[Dict[str, Any]]:
    ensure_habits_for_date(date)
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM habits WHERE date = ? ORDER BY rowid ASC", (date,)).fetchall()
        return [
            {
                "id": r["id"],
                "title": r["title"],
                "category": r["category"],
                "icon": r["icon"],
                "date": r["date"],
                "completed": bool(r["completed"]),
                "streak_count": r["streak_count"],
            }
            for r in rows
        ]


def toggle_habit(habit_id: str, date: str) -> bool:
    ensure_habits_for_date(date)
    with get_connection() as conn:
        row = conn.execute("SELECT completed, streak_count FROM habits WHERE id = ? AND date = ?", (habit_id, date)).fetchone()
        if not row:
            return False
        new_state = 0 if row["completed"] else 1
        new_streak = row["streak_count"] + 1 if new_state == 1 else max(1, row["streak_count"] - 1)
        conn.execute("UPDATE habits SET completed = ?, streak_count = ? WHERE id = ? AND date = ?", (new_state, new_streak, habit_id, date))
        conn.commit()
        return bool(new_state)


# --- Streak & Meta ---
def get_user_meta(key: str, default: str = "") -> str:
    with get_connection() as conn:
        row = conn.execute("SELECT value FROM user_meta WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else default


def set_user_meta(key: str, value: str):
    with get_connection() as conn:
        conn.execute("INSERT OR REPLACE INTO user_meta (key, value) VALUES (?, ?)", (key, value))
        conn.commit()


def clear_all_data():
    """Resets all logs, targets, and habit states to clean baseline."""
    with get_connection() as conn:
        conn.execute("DELETE FROM water_logs")
        conn.execute("DELETE FROM food_logs")
        conn.execute("DELETE FROM activity_logs")
        conn.execute("DELETE FROM habits")
        conn.execute("DELETE FROM wearable_telemetry")
        conn.execute("DELETE FROM weight_logs")
        conn.execute("""
            UPDATE targets SET
                water_target_ml = 2500,
                steps_target = 10000,
                calories_target = 2100,
                protein_target_g = 130,
                carbs_target_g = 220,
                fat_target_g = 65,
                sleep_target_hours = 8.0,
                current_weight_kg = 78.5,
                height_cm = 175.0,
                target_weight_kg = 72.0,
                starting_weight_kg = 80.0,
                age = 28,
                gender = 'Male',
                fitness_goal = 'Lose Weight',
                activity_level = 'Moderately Active',
                bmr_kcal = 1720,
                tdee_kcal = 2400,
                water_reminder_interval_min = 60
            WHERE id = 1
        """)
        conn.commit()


# --- Wearable & Smartwatch CRUD ---

def get_wearable_device() -> Dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM wearable_devices WHERE id = 1").fetchone()
        if row:
            d = dict(row)
            d["is_connected"] = bool(d["is_connected"])
            return d
        return {
            "id": 1,
            "brand": "Samsung Galaxy Watch",
            "model_name": "Galaxy Watch 6 Pro",
            "provider": "Google Health Connect / Wear OS",
            "is_connected": True,
            "battery_pct": 86,
            "last_sync_timestamp": "Just now"
        }


def pair_wearable_device(brand: str, model_name: str, provider: str = None) -> Dict[str, Any]:
    if not provider:
        if "Apple" in brand:
            provider = "Apple HealthKit"
        elif "Garmin" in brand:
            provider = "Garmin Connect / FIT"
        elif "Fitbit" in brand:
            provider = "Fitbit Web API"
        else:
            provider = "Google Health Connect / Wear OS"

    with get_connection() as conn:
        conn.execute("""
            UPDATE wearable_devices SET
                brand = ?,
                model_name = ?,
                provider = ?,
                is_connected = 1,
                last_sync_timestamp = 'Just now',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """, (brand, model_name, provider))
        conn.commit()
    return get_wearable_device()


def get_latest_telemetry(date: str) -> Dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute("""
            SELECT * FROM wearable_telemetry 
            WHERE date = ? 
            ORDER BY id DESC LIMIT 1
        """, (date,)).fetchone()
        if row:
            return dict(row)
        
        # Default baseline telemetry if none logged yet today
        return {
            "heart_rate_bpm": 72,
            "resting_hr": 62,
            "hr_zone": "Resting Zone",
            "steps": 5400,
            "active_calories": 280,
            "sleep_hours": 7.6,
            "sleep_quality_pct": 89,
            "battery_pct": 86,
            "timestamp": "Just now",
            "date": date
        }


def record_watch_telemetry(
    date: str,
    heart_rate_bpm: Optional[int] = None,
    steps: Optional[int] = None,
    active_calories: Optional[int] = None,
    sleep_hours: Optional[float] = None,
    battery_pct: Optional[int] = None
) -> Dict[str, Any]:
    """
    Saves smartwatch telemetry and merges watch steps & calories into today's activity.
    """
    current_time = datetime.now().strftime("%I:%M %p")
    existing = get_latest_telemetry(date)

    hr = heart_rate_bpm if heart_rate_bpm is not None else existing.get("heart_rate_bpm", 72)
    step_val = steps if steps is not None else existing.get("steps", 0)
    cals = active_calories if active_calories is not None else existing.get("active_calories", 0)
    sleep_val = sleep_hours if sleep_hours is not None else existing.get("sleep_hours", 7.5)
    bat = battery_pct if battery_pct is not None else existing.get("battery_pct", 85)

    # Determine HR zone
    if hr < 65:
        hr_zone = "Resting Zone"
    elif hr < 110:
        hr_zone = "Fat Burn Zone"
    elif hr < 150:
        hr_zone = "Cardio Zone"
    else:
        hr_zone = "Peak Zone"

    with get_connection() as conn:
        conn.execute("""
            INSERT INTO wearable_telemetry 
            (heart_rate_bpm, resting_hr, hr_zone, steps, active_calories, sleep_hours, sleep_quality_pct, battery_pct, timestamp, date)
            VALUES (?, 62, ?, ?, ?, ?, 88, ?, ?, ?)
        """, (hr, hr_zone, step_val, cals, sleep_val, bat, current_time, date))

        # Update wearable device battery & sync time
        conn.execute("""
            UPDATE wearable_devices SET
                battery_pct = ?,
                last_sync_timestamp = 'Just now',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """, (bat,))

        # Sync into activity_logs: Check if "Smartwatch Live Sync" entry exists for this date
        watch_act = conn.execute(
            "SELECT id FROM activity_logs WHERE date = ? AND name LIKE 'Smartwatch %'", (date,)
        ).fetchone()

        if watch_act:
            conn.execute("""
                UPDATE activity_logs SET
                    steps = ?,
                    calories_burned = ?,
                    duration_min = MAX(duration_min, 45),
                    timestamp = ?
                WHERE id = ?
            """, (step_val, cals, current_time, watch_act["id"]))
        elif step_val > 0 or cals > 0:
            conn.execute("""
                INSERT INTO activity_logs (name, duration_min, calories_burned, steps, intensity, timestamp, date)
                VALUES ('Smartwatch Sensor Sync', 45, ?, ?, 'Moderate', ?, ?)
            """, (cals, step_val, current_time, date))

        conn.commit()

    return get_latest_telemetry(date)


# --- Weight & Body Goals CRUD ---

def log_weight(weight_kg: float, date: str, note: Optional[str] = None) -> Dict[str, Any]:
    current_time = datetime.now().strftime("%I:%M %p")
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO weight_logs (weight_kg, date, timestamp, note)
            VALUES (?, ?, ?, ?)
        """, (weight_kg, date, current_time, note))
        conn.execute("""
            UPDATE targets SET current_weight_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1
        """, (weight_kg,))
        conn.commit()
    return get_targets()


def get_weight_logs() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM weight_logs ORDER BY date DESC, id DESC LIMIT 30").fetchall()
        return [dict(r) for r in rows]


def get_habit_streak(habit_id: str, date: str) -> int:
    with get_connection() as conn:
        row = conn.execute("SELECT streak_count FROM habits WHERE id = ? AND date = ?", (habit_id, date)).fetchone()
        return row["streak_count"] if row else 1


def get_weight_for_date(date: str) -> Optional[float]:
    """Returns the most recent weight logged on or before the given date."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT weight_kg FROM weight_logs WHERE date <= ? ORDER BY date DESC, id DESC LIMIT 1",
            (date,)
        ).fetchone()
        return float(row["weight_kg"]) if row else None


def get_total_active_days() -> int:
    """Returns total number of unique days the user logged any activity/food/water/habit."""
    with get_connection() as conn:
        row = conn.execute("""
            SELECT COUNT(DISTINCT d) as cnt FROM (
                SELECT date as d FROM water_logs
                UNION
                SELECT date as d FROM food_logs
                UNION
                SELECT date as d FROM activity_logs
                UNION
                SELECT date as d FROM habits WHERE completed = 1
                UNION
                SELECT date as d FROM weight_logs
            )
        """).fetchone()
        return max(1, int(row["cnt"]) if row and row["cnt"] else 1)

