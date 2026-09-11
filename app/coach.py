"""
Daily Health Coach - Smart Coaching & Scoring Heuristic Engine
Written in pure Python to analyze daily habits, deficits, and generate proactive guidance.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
from .models import (
    Targets, CoachTip, DaySummary, WaterLogEntry, FoodLogEntry,
    ActivityLogEntry, HabitItem, WearableDevice, WatchTelemetry,
    TransformationRoadmap, RoadmapActionItem, DateWiseRecord
)
from . import database as db


def calculate_health_score(
    water_ml: int,
    water_target: int,
    steps: int,
    steps_target: int,
    protein_g: float,
    protein_target: int,
    calories_consumed: int,
    calories_target: int,
    habits_completed: int,
    habits_total: int
) -> Dict[str, Any]:
    """
    Computes a balanced, holistic health score (0-100) based on 4 pillar dimensions:
    - Hydration (25%)
    - Movement / Activity (25%)
    - Protein & Fuel (25%)
    - Daily Micro-Habits (25%)
    """
    # 1. Hydration Score (max 25 pts)
    water_ratio = min(1.0, water_ml / max(1, water_target))
    water_score = round(water_ratio * 25)

    # 2. Movement Score (max 25 pts)
    steps_ratio = min(1.0, steps / max(1, steps_target))
    steps_score = round(steps_ratio * 25)

    # 3. Nutrition & Protein Score (max 25 pts)
    protein_ratio = min(1.0, protein_g / max(1, protein_target))
    # Calorie balance check: no penalty if within +/- 15% of target
    cal_diff = abs(calories_consumed - calories_target)
    cal_penalty = 0
    if calories_consumed > (calories_target * 1.25):
        cal_penalty = 5
    fuel_score = max(0, round(protein_ratio * 25) - cal_penalty)

    # 4. Habits Score (max 25 pts)
    habits_ratio = habits_completed / max(1, habits_total)
    habits_score = round(habits_ratio * 25)

    total_score = min(100, water_score + steps_score + fuel_score + habits_score)

    if total_score >= 90:
        grade = "Elite Consistency"
    elif total_score >= 75:
        grade = "On Track & Thriving"
    elif total_score >= 55:
        grade = "Building Momentum"
    else:
        grade = "Needs a Daily Push"

    return {
        "score": total_score,
        "grade": grade,
        "breakdown": {
            "hydration_pts": water_score,
            "movement_pts": steps_score,
            "fuel_pts": fuel_score,
            "habits_pts": habits_score,
        }
    }


def generate_coach_tips(
    water_ml: int,
    water_target: int,
    steps: int,
    steps_target: int,
    protein_g: float,
    protein_target: int,
    calories_consumed: int,
    calories_burned: int,
    calories_target: int,
    habits_completed: int,
    habits_total: int,
    current_hour: int = None,
    telemetry: WatchTelemetry = None
) -> List[CoachTip]:
    """
    Evaluates current metric states and time of day to deliver proactive, friendly advice.
    """
    if current_hour is None:
        current_hour = datetime.now().hour

    tips: List[CoachTip] = []

    # 1. Hydration Insights
    water_pct = (water_ml / max(1, water_target)) * 100
    if water_pct >= 100:
        tips.append(CoachTip(
            id="hydra_achieved",
            category="hydration",
            urgency="achievement",
            title="Hydration Target Smashed!",
            message=f"Outstanding! You've reached {water_ml:,}ml. Your focus, cellular recovery, and energy levels are fully supported.",
            action_suggestion="Maintain gentle sips if thirsty, but the mission is complete.",
            icon="🌊"
        ))
    elif current_hour >= 14 and water_pct < 50:
        gap = water_target - water_ml
        tips.append(CoachTip(
            id="hydra_afternoon_lag",
            category="hydration",
            urgency="high",
            title="Afternoon Energy Deficit Alert",
            message=f"It's past 2 PM and you're at {water_pct:.0f}% of your water goal ({water_ml}ml / {water_target}ml). Mid-day brain fog is 80% dehydration.",
            action_suggestion=f"Drink a large 500ml bottle right now to revive mental stamina.",
            icon="💧"
        ))
    elif water_pct < 30 and current_hour < 12:
        tips.append(CoachTip(
            id="hydra_morning_kick",
            category="hydration",
            urgency="medium",
            title="Morning Hydration Primer",
            message="Your body loses up to 500ml of water while sleeping. Replenish early to wake up your metabolism.",
            action_suggestion="Grab a fresh glass of water with a pinch of mineral salt or lemon.",
            icon="⚡"
        ))

    # 2. Protein & Nutrition Fuel
    protein_pct = (protein_g / max(1, protein_target)) * 100
    net_cals = calories_consumed - calories_burned
    cals_remaining = calories_target - net_cals
    protein_needed = max(0, round(protein_target - protein_g))

    if protein_pct >= 100:
        tips.append(CoachTip(
            id="protein_crushed",
            category="protein",
            urgency="achievement",
            title="Protein Target Complete!",
            message=f"Awesome work! You logged {protein_g:.0f}g protein ({protein_pct:.0f}%). Perfect for lean muscle preservation and metabolic thermogenesis.",
            action_suggestion="Keep meals balanced with dietary fiber and healthy fats.",
            icon="🍗"
        ))
    elif protein_needed > 25 and cals_remaining > 0:
        tips.append(CoachTip(
            id="protein_gap",
            category="protein",
            urgency="medium",
            title=f"Protein Focus: {protein_needed}g Remaining",
            message=f"You have {cals_remaining} kcal remaining in your daily budget and need {protein_needed}g more protein.",
            action_suggestion="Best quick options: Greek yogurt (15-20g), scoop of whey protein (24g), 3 eggs (18g), or canned tuna (28g).",
            icon="🥗"
        ))
    elif calories_consumed > (calories_target * 1.15):
        over = calories_consumed - calories_target
        tips.append(CoachTip(
            id="calorie_surplus",
            category="calories",
            urgency="low",
            title="Calorie Budget Exceeded",
            message=f"You're currently {over} kcal over your baseline target. Don't stress or restrict tomorrow!",
            action_suggestion="Add an easy 20-minute evening stroll to burn 120-150 kcal effortlessly.",
            icon="⚖️"
        ))

    # 3. Movement & Activity
    steps_pct = (steps / max(1, steps_target)) * 100
    if steps_pct >= 100:
        tips.append(CoachTip(
            id="steps_unlocked",
            category="movement",
            urgency="achievement",
            title=f"Daily Step Goal Conquered! ({steps:,})",
            message="10,000+ steps logged today! Non-exercise activity thermogenesis (NEAT) is the #1 driver of long-term leanness and cardiovascular vitality.",
            action_suggestion="Kick your shoes off and do 5 minutes of gentle hamstring and calf stretches.",
            icon="👟"
        ))
    elif current_hour >= 16 and steps_pct < 60:
        steps_left = steps_target - steps
        tips.append(CoachTip(
            id="steps_evening_call",
            category="movement",
            urgency="high",
            title=f"Move Needed: {steps_left:,} Steps to Goal",
            message=f"You're currently at {steps:,} steps ({steps_pct:.0f}%). Evening is the perfect time to disconnect from work and clear your head.",
            action_suggestion="A 25-minute brisk evening walk will comfortably log ~2,500 steps.",
            icon="🚶"
        ))

    # 4. Habits & Rituals
    if habits_completed < habits_total:
        tips.append(CoachTip(
            id="habits_pending",
            category="habit",
            urgency="low",
            title=f"{habits_completed}/{habits_total} Daily Rituals Checked",
            message="Small daily habits compound into massive long-term physical transformations.",
            action_suggestion="Check off your remaining micro-habits before heading to bed.",
            icon="🎯"
        ))
    else:
        tips.append(CoachTip(
            id="habits_all_done",
            category="habit",
            urgency="achievement",
            title="All Micro-Habits Completed!",
            message="Flawless habit consistency today. Your streak is gaining serious momentum.",
            action_suggestion="Celebrate your discipline and get 7-8 hours of high-quality sleep.",
            icon="🔥"
        ))

    # 5. Smartwatch Sensor Insights (Heart Rate & Sleep)
    if telemetry:
        if telemetry.resting_hr and telemetry.resting_hr <= 65:
            tips.append(CoachTip(
                id="watch_hr_recovery",
                category="movement",
                urgency="low",
                title=f"Smartwatch HR: {telemetry.heart_rate_bpm} BPM ({telemetry.hr_zone})",
                message=f"Resting heart rate of {telemetry.resting_hr} BPM indicates strong parasympathetic nervous recovery.",
                action_suggestion="Cardiovascular resilience is in peak range.",
                icon="💓"
            ))
        if telemetry.sleep_hours and telemetry.sleep_hours >= 7.0:
            tips.append(CoachTip(
                id="watch_sleep_prime",
                category="habit",
                urgency="achievement",
                title=f"Watch Sleep Synced: {telemetry.sleep_hours:.1f} Hours",
                message=f"Your smartwatch tracked {telemetry.sleep_quality_pct}% restorative sleep efficiency last night.",
                action_suggestion="Cognitive readiness and muscular glycogen recovery are primed.",
                icon="🌙"
            ))

    # 6. Fast Food & Sweets Discipline Streaks
    tips.append(CoachTip(
        id="streak_clean_eating",
        category="habit",
        urgency="achievement",
        title="Zero Fast Food & No Sweets Streaks Active!",
        message="Keeping deep-fried fast foods and sugary desserts away directly stabilizes blood sugar and stops hunger crashes.",
        action_suggestion="If cravings hit, opt for sparkling water, Greek yogurt with berries, or an apple with almond butter.",
        icon="🛡️"
    ))

    return tips


# --- Metabolism Engine & Transformation Roadmap ---

def calculate_metabolism(
    age: int,
    gender: str,
    height_cm: float,
    weight_kg: float,
    activity_level: str = "Moderately Active",
    fitness_goal: str = "Lose Weight"
) -> Dict[str, Any]:
    """
    Calculates BMR and TDEE using the Mifflin-St Jeor equation and computes
    scientifically tailored calorie, protein, carb, and fat targets.
    """
    gender_lower = gender.lower()
    if "female" in gender_lower or "woman" in gender_lower:
        s = -161
    elif "male" in gender_lower or "man" in gender_lower:
        s = 5
    else:
        s = -78

    bmr = round(10.0 * weight_kg + 6.25 * height_cm - 5.0 * age + s)

    # Activity multiplier
    act_lower = activity_level.lower()
    if "sedentary" in act_lower:
        multiplier = 1.2
    elif "light" in act_lower:
        multiplier = 1.375
    elif "very" in act_lower:
        multiplier = 1.725
    else:
        multiplier = 1.55

    tdee = round(bmr * multiplier)

    # Goal adjustment
    goal_lower = fitness_goal.lower()
    if "lose" in goal_lower:
        deficit = -500
        recommended_calories = max(1200, tdee + deficit)
        recommended_protein = round(2.0 * weight_kg)
        goal_label = "Fat Loss & Muscle Preservation"
    elif "gain" in goal_lower:
        deficit = 350
        recommended_calories = tdee + deficit
        recommended_protein = round(1.9 * weight_kg)
        goal_label = "Lean Muscle Hypertrophy & Clean Bulk"
    else:
        deficit = 0
        recommended_calories = tdee
        recommended_protein = round(1.6 * weight_kg)
        goal_label = "Metabolic Maintenance & Body Recomposition"

    # Recommended Carbs and Fat breakdown
    fat_cals = round(recommended_calories * 0.25)
    recommended_fat = round(fat_cals / 9)
    prot_cals = recommended_protein * 4
    carb_cals = max(0, recommended_calories - prot_cals - fat_cals)
    recommended_carbs = round(carb_cals / 4)

    return {
        "bmr_kcal": bmr,
        "tdee_kcal": tdee,
        "multiplier": multiplier,
        "recommended_calories": recommended_calories,
        "recommended_protein_g": recommended_protein,
        "recommended_carbs_g": recommended_carbs,
        "recommended_fat_g": recommended_fat,
        "deficit_or_surplus_kcal": deficit,
        "goal_label": goal_label
    }


def build_transformation_roadmap(
    summary_dict: dict,
    targets: Targets
) -> TransformationRoadmap:
    """
    Constructs the 3-pillar Transformation Roadmap:
    - What Will Do (Strategic Plan & projections)
    - How Much Is Done (Cumulative progress from starting point)
    - What Can Do (Immediate actionable checklist for remaining targets today)
    """
    meta = calculate_metabolism(
        age=targets.age,
        gender=targets.gender,
        height_cm=targets.height_cm,
        weight_kg=targets.current_weight_kg,
        activity_level=targets.activity_level,
        fitness_goal=targets.fitness_goal
    )

    weight_delta = round(abs(targets.current_weight_kg - targets.target_weight_kg), 1)
    goal_lower = targets.fitness_goal.lower()

    if "lose" in goal_lower:
        rate_kg_week = 0.5
        plan_desc = f"Targeting 500 kcal deficit under TDEE ({meta['tdee_kcal']} kcal) with {targets.protein_target_g}g protein/day for sustainable fat loss (~0.5 kg/week) while preserving lean tissue."
    elif "gain" in goal_lower:
        rate_kg_week = 0.35
        plan_desc = f"Targeting +350 kcal surplus over TDEE ({meta['tdee_kcal']} kcal) with {targets.protein_target_g}g protein/day to fuel hypertrophy and clean muscle gain (~0.35 kg/week)."
    else:
        rate_kg_week = 0.0
        plan_desc = f"Balanced at TDEE ({meta['tdee_kcal']} kcal) with {targets.protein_target_g}g protein/day to maintain weight while improving metabolic conditioning and body tone."

    if rate_kg_week > 0 and weight_delta > 0.1:
        weeks = round(weight_delta / rate_kg_week, 1)
        target_date_dt = datetime.now() + timedelta(weeks=weeks)
        target_date_str = target_date_dt.strftime("%b %d, %Y")
    else:
        weeks = 0.0
        target_date_str = "Target Achieved!"

    # Cumulative progress calculation
    if "lose" in goal_lower:
        weight_shifted = max(0.0, round(targets.starting_weight_kg - targets.current_weight_kg, 1))
        total_target_shift = max(0.1, round(targets.starting_weight_kg - targets.target_weight_kg, 1))
    elif "gain" in goal_lower:
        weight_shifted = max(0.0, round(targets.current_weight_kg - targets.starting_weight_kg, 1))
        total_target_shift = max(0.1, round(targets.target_weight_kg - targets.starting_weight_kg, 1))
    else:
        weight_shifted = round(abs(targets.starting_weight_kg - targets.current_weight_kg), 1)
        total_target_shift = 1.0

    pct_achieved = min(100, max(0, round((weight_shifted / total_target_shift) * 100)))
    total_active_days = db.get_total_active_days()

    how_much_summary = f"Shifted {weight_shifted} kg of {total_target_shift} kg goal across {total_active_days} active tracked days ({pct_achieved}% achieved)."

    # Actionable checklist for today
    actions: List[RoadmapActionItem] = []

    # 1. Hydration
    water_left = targets.water_target_ml - summary_dict.get("water_total_ml", 0)
    if water_left > 0:
        glasses = max(1, round(water_left / 250))
        actions.append(RoadmapActionItem(
            title=f"Drink {water_left:,} ml Water",
            subtitle=f"About {glasses} glasses remaining to hit cellular hydration quota",
            category="hydration",
            done=False,
            icon="💧"
        ))
    else:
        actions.append(RoadmapActionItem(
            title="Hydration Target Completed",
            subtitle=f"{summary_dict.get('water_total_ml', 0):,} ml logged today! Optimum cell recovery",
            category="hydration",
            done=True,
            icon="✅"
        ))

    # 2. Protein
    prot_left = round(targets.protein_target_g - summary_dict.get("protein_total_g", 0), 1)
    if prot_left > 0:
        actions.append(RoadmapActionItem(
            title=f"Fuel Up with {prot_left}g Protein",
            subtitle="Greek yogurt (20g), whey shake (25g), or eggs to preserve lean mass",
            category="protein",
            done=False,
            icon="🍗"
        ))
    else:
        actions.append(RoadmapActionItem(
            title="Protein Target Smashed",
            subtitle=f"{summary_dict.get('protein_total_g', 0)}g logged today! Muscle repair fueled",
            category="protein",
            done=True,
            icon="💪"
        ))

    # 3. Steps / Movement
    steps_left = targets.steps_target - summary_dict.get("steps_total", 0)
    if steps_left > 0:
        walk_mins = max(5, round(steps_left / 100))
        actions.append(RoadmapActionItem(
            title=f"Walk {steps_left:,} Steps (~{walk_mins} min)",
            subtitle="An evening stroll or brisk outdoor walk burns remaining calories",
            category="movement",
            done=False,
            icon="👟"
        ))
    else:
        actions.append(RoadmapActionItem(
            title="Step Goal Achieved",
            subtitle=f"{summary_dict.get('steps_total', 0):,} steps logged today! High active burn",
            category="movement",
            done=True,
            icon="🚶"
        ))

    # 4. Habits checklist
    habits = summary_dict.get("habits", [])
    uncompleted_habits = [h for h in habits if not h.completed]
    for h in uncompleted_habits[:2]:
        actions.append(RoadmapActionItem(
            title=f"Complete '{h.title}'",
            subtitle=f"Maintain your {h.streak_count}-day discipline streak",
            category="habit",
            done=False,
            icon=h.icon
        ))

    return TransformationRoadmap(
        goal_title=meta["goal_label"],
        what_will_do_summary=plan_desc,
        daily_calorie_target=targets.calories_target,
        daily_protein_target=targets.protein_target_g,
        daily_deficit_or_surplus=meta["deficit_or_surplus_kcal"],
        projected_weeks_to_goal=weeks,
        projected_completion_date=target_date_str,
        how_much_done_summary=how_much_summary,
        weight_shifted_kg=weight_shifted,
        goal_achieved_pct=pct_achieved,
        total_days_active=total_active_days,
        what_can_do_actions=actions
    )


def get_detailed_history(days: int = 14) -> List[DateWiseRecord]:
    """
    Aggregates full date-wise tracking data for the past N days.
    """
    targets = Targets(**db.get_targets())
    records: List[DateWiseRecord] = []

    for i in range(days):
        d = datetime.now() - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        if i == 0:
            label = "Today"
        elif i == 1:
            label = "Yesterday"
        else:
            label = d.strftime("%a, %b %d")

        water_logs = db.get_water_logs(d_str)
        food_logs = db.get_food_logs(d_str)
        activity_logs = db.get_activity_logs(d_str)
        habits = db.get_habits(d_str)
        day_weight = db.get_weight_for_date(d_str) or targets.current_weight_kg

        w_tot = sum(w["amount_ml"] for w in water_logs)
        steps_tot = sum(a["steps"] for a in activity_logs)
        cals_consumed = sum(f["calories"] for f in food_logs)
        cals_burned = sum(a["calories_burned"] for a in activity_logs)
        prot_tot = sum(f["protein_g"] for f in food_logs)
        hab_done = sum(1 for h in habits if h["completed"])
        hab_tot = max(1, len(habits))

        score_res = calculate_health_score(
            water_ml=w_tot,
            water_target=targets.water_target_ml,
            steps=steps_tot,
            steps_target=targets.steps_target,
            protein_g=prot_tot,
            protein_target=targets.protein_target_g,
            calories_consumed=cals_consumed,
            calories_target=targets.calories_target,
            habits_completed=hab_done,
            habits_total=hab_tot
        )

        records.append(DateWiseRecord(
            date=d_str,
            label=label,
            weight_kg=round(day_weight, 1),
            protein_g=round(prot_tot, 1),
            calories_consumed=cals_consumed,
            calories_burned=cals_burned,
            net_calories=cals_consumed - cals_burned,
            steps=steps_tot,
            water_ml=w_tot,
            habits_completed=hab_done,
            health_score=score_res["score"]
        ))

    return records


def get_full_day_summary(date_str: str = None) -> DaySummary:
    """
    Assembles a complete, reactive DaySummary for the given date.
    """
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")

    targets_dict = db.get_targets()
    targets = Targets(**targets_dict)

    # Fetch logs
    water_logs = [WaterLogEntry(**w) for w in db.get_water_logs(date_str)]
    food_logs = [FoodLogEntry(**f) for f in db.get_food_logs(date_str)]
    activity_logs = [ActivityLogEntry(**a) for a in db.get_activity_logs(date_str)]
    habits = [HabitItem(**h) for h in db.get_habits(date_str)]

    # Compute totals
    water_total = sum(w.amount_ml for w in water_logs)
    steps_total = sum(a.steps for a in activity_logs)
    active_minutes_total = sum(a.duration_min for a in activity_logs)
    calories_burned = sum(a.calories_burned for a in activity_logs)

    calories_consumed = sum(f.calories for f in food_logs)
    protein_total = sum(f.protein_g for f in food_logs)
    carbs_total = sum(f.carbs_g for f in food_logs)
    fat_total = sum(f.fat_g for f in food_logs)

    habits_completed = sum(1 for h in habits if h.completed)
    habits_total = len(habits)

    streak_days = int(db.get_user_meta("current_streak", "5"))

    # Net and remaining calories
    net_cals = calories_consumed - calories_burned
    calories_remaining = (targets.calories_target + calories_burned) - calories_consumed

    # Percentages
    water_pct = round((water_total / max(1, targets.water_target_ml)) * 100)
    steps_pct = round((steps_total / max(1, targets.steps_target)) * 100)
    protein_pct = round((protein_total / max(1, targets.protein_target_g)) * 100)
    habits_pct = round((habits_completed / max(1, habits_total)) * 100)

    # Score calculation
    score_res = calculate_health_score(
        water_ml=water_total,
        water_target=targets.water_target_ml,
        steps=steps_total,
        steps_target=targets.steps_target,
        protein_g=protein_total,
        protein_target=targets.protein_target_g,
        calories_consumed=calories_consumed,
        calories_target=targets.calories_target,
        habits_completed=habits_completed,
        habits_total=habits_total,
    )

    # Fetch wearable device and telemetry
    wearable = WearableDevice(**db.get_wearable_device())
    latest_telemetry = WatchTelemetry(**db.get_latest_telemetry(date_str))

    # Body Composition & Weight Goal Calculations
    height_m = max(0.8, targets.height_cm / 100.0)
    bmi = round(targets.current_weight_kg / (height_m * height_m), 1)
    if bmi < 18.5:
        bmi_cat = "Underweight"
    elif bmi < 25.0:
        bmi_cat = "Healthy / Normal Weight"
    elif bmi < 30.0:
        bmi_cat = "Overweight (Muscle / Fat)"
    else:
        bmi_cat = "Obese"

    weight_diff = round(targets.current_weight_kg - targets.target_weight_kg, 1)
    weight_prog_pct = max(10, min(100, round((1.0 - max(0, weight_diff) / 15.0) * 100)))

    # Fast Food & Sweet Streaks
    no_fastfood_streak = db.get_habit_streak("habit_no_fastfood", date_str)
    no_sweets_streak = db.get_habit_streak("habit_no_sweets", date_str)

    # Coach tips
    coach_tips = generate_coach_tips(
        water_ml=water_total,
        water_target=targets.water_target_ml,
        steps=steps_total,
        steps_target=targets.steps_target,
        protein_g=protein_total,
        protein_target=targets.protein_target_g,
        calories_consumed=calories_consumed,
        calories_burned=calories_burned,
        calories_target=targets.calories_target,
        habits_completed=habits_completed,
        habits_total=habits_total,
        telemetry=latest_telemetry
    )

    # Transformation Roadmap
    summary_data = {
        "water_total_ml": water_total,
        "steps_total": steps_total,
        "protein_total_g": protein_total,
        "habits": habits
    }
    roadmap = build_transformation_roadmap(summary_data, targets)

    return DaySummary(
        date=date_str,
        health_score=score_res["score"],
        score_grade=score_res["grade"],
        score_breakdown=score_res["breakdown"],
        water_total_ml=water_total,
        water_progress_pct=water_pct,
        steps_total=steps_total,
        steps_progress_pct=steps_pct,
        active_minutes_total=active_minutes_total,
        calories_consumed=calories_consumed,
        calories_burned=calories_burned,
        net_calories=net_cals,
        calories_remaining=calories_remaining,
        protein_total_g=round(protein_total, 1),
        protein_progress_pct=protein_pct,
        carbs_total_g=round(carbs_total, 1),
        fat_total_g=round(fat_total, 1),
        habits_completed=habits_completed,
        habits_total=habits_total,
        habits_progress_pct=habits_pct,
        streak_days=streak_days,
        targets=targets,
        water_logs=water_logs,
        food_logs=food_logs,
        activity_logs=activity_logs,
        habits=habits,
        coach_tips=coach_tips,
        wearable=wearable,
        latest_telemetry=latest_telemetry,
        bmi=bmi,
        bmi_category=bmi_cat,
        weight_to_target_kg=weight_diff,
        weight_progress_pct=weight_prog_pct,
        no_fastfood_streak=no_fastfood_streak,
        no_sweets_streak=no_sweets_streak,
        water_reminder_interval_min=targets.water_reminder_interval_min,
        transformation_roadmap=roadmap
    )
