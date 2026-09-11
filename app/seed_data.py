"""
Seed data generator for Daily Health Coach.
Populates realistic, engaging sample activity and 7-day trend history.
"""
from datetime import datetime, timedelta
import random
from . import database as db


def seed_database(force: bool = False):
    db.init_db()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Check if data already exists for today
    existing_water = db.get_water_logs(today_str)
    if existing_water and not force:
        return  # already seeded

    if force:
        db.clear_all_data()
        db.init_db()

    # 1. Populate Today's Water Logs
    db.add_water_log(500, "07:30 AM", today_str, "Morning wake-up glass")
    db.add_water_log(350, "10:15 AM", today_str, "Desk hydration mug")
    db.add_water_log(500, "01:00 PM", today_str, "Post-lunch flask")
    db.add_water_log(400, "03:45 PM", today_str, "Afternoon boost")

    # 2. Populate Today's Food Logs (High protein, balanced)
    db.add_food_log(
        name="Greek Yogurt with Berries & Chia",
        meal_type="Breakfast",
        calories=320,
        protein_g=24.0,
        carbs_g=36.0,
        fat_g=8.0,
        timestamp="08:15 AM",
        date=today_str
    )
    db.add_food_log(
        name="Grilled Herb Chicken & Quinoa Salad",
        meal_type="Lunch",
        calories=580,
        protein_g=46.0,
        carbs_g=52.0,
        fat_g=18.0,
        timestamp="01:15 PM",
        date=today_str
    )
    db.add_food_log(
        name="Whey Protein Shake + Almonds",
        meal_type="Snack",
        calories=240,
        protein_g=28.0,
        carbs_g=12.0,
        fat_g=9.0,
        timestamp="04:30 PM",
        date=today_str
    )

    # 3. Populate Today's Activity Logs
    db.add_activity_log(
        name="Morning Brisk Walk & Sunshine",
        duration_min=30,
        calories_burned=160,
        steps=3800,
        intensity="Moderate",
        timestamp="07:45 AM",
        date=today_str
    )
    db.add_activity_log(
        name="Strength Training (Upper Body)",
        duration_min=45,
        calories_burned=290,
        steps=1650,
        intensity="High",
        timestamp="12:15 PM",
        date=today_str
    )
    db.add_activity_log(
        name="Afternoon Office Movement",
        duration_min=20,
        calories_burned=85,
        steps=2150,
        intensity="Low",
        timestamp="03:30 PM",
        date=today_str
    )

    # 4. Habits for today
    db.ensure_habits_for_date(today_str)
    # Check 4 habits as completed
    with db.get_connection() as conn:
        conn.execute("UPDATE habits SET completed = 1 WHERE id IN ('habit_water_kick', 'habit_sunlight', 'habit_steps', 'habit_mind') AND date = ?", (today_str,))
        conn.commit()

    # 5. Populate Past 6 Days for 7-day analytics
    past_days_data = [
        {"days_ago": 6, "water": 2400, "steps": 9200, "cals": 2050, "protein": 125, "habits": 5, "score": 88},
        {"days_ago": 5, "water": 2600, "steps": 10500, "cals": 2180, "protein": 138, "habits": 6, "score": 96},
        {"days_ago": 4, "water": 2100, "steps": 8100, "cals": 1950, "protein": 115, "habits": 4, "score": 78},
        {"days_ago": 3, "water": 2500, "steps": 11200, "cals": 2240, "protein": 132, "habits": 6, "score": 94},
        {"days_ago": 2, "water": 2750, "steps": 10800, "cals": 2100, "protein": 140, "habits": 5, "score": 95},
        {"days_ago": 1, "water": 2300, "steps": 9800, "cals": 2080, "protein": 128, "habits": 5, "score": 89},
    ]

    for d in past_days_data:
        dt = (datetime.now() - timedelta(days=d["days_ago"])).strftime("%Y-%m-%d")
        # Water
        db.add_water_log(d["water"], "08:00 PM", dt, "Daily total hydration")
        # Food
        db.add_food_log("Daily Fuel Log", "Dinner", d["cals"], d["protein"], 210.0, 62.0, "08:00 PM", dt)
        # Activity
        db.add_activity_log("Daily Movement", 60, 420, d["steps"], "Moderate", "06:00 PM", dt)
        # Habits
        db.ensure_habits_for_date(dt)
        with db.get_connection() as conn:
            conn.execute("UPDATE habits SET completed = 1 WHERE date = ?", (dt,))
            conn.commit()

    db.set_user_meta("current_streak", "6")
    db.set_user_meta("user_name", "Alex")
