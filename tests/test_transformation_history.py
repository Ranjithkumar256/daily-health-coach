"""
Tests for Date-wise Tracking, Mifflin-St Jeor Metabolism Engine, and Transformation Roadmap.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import database as db
from app import coach
from app import seed_data
from app.models import Targets

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_clean_db():
    seed_data.seed_database(force=True)



def test_mifflin_st_jeor_metabolism_calculation():
    # Male: 28 yrs, 175cm, 78.5kg, moderately active (multiplier 1.55), lose weight (-500 deficit)
    # BMR = 10 * 78.5 + 6.25 * 175 - 5 * 28 + 5 = 785 + 1093.75 - 140 + 5 = 1743.75 -> 1744
    # TDEE = 1744 * 1.55 = 2703.2 -> 2703
    # Cal target = max(1200, 2703 - 500) = 2203
    # Protein target = 2.0 * 78.5 = 157g
    male_meta = coach.calculate_metabolism(
        age=28,
        gender="Male",
        height_cm=175.0,
        weight_kg=78.5,
        activity_level="Moderately Active",
        fitness_goal="Lose Weight"
    )
    assert male_meta["bmr_kcal"] == 1744
    assert male_meta["tdee_kcal"] == 2703
    assert male_meta["recommended_calories"] == 2203
    assert male_meta["recommended_protein_g"] == 157
    assert male_meta["deficit_or_surplus_kcal"] == -500

    # Female: 30 yrs, 165cm, 65kg, sedentary (multiplier 1.2), gain weight (+350 surplus)
    # BMR = 10 * 65 + 6.25 * 165 - 5 * 30 - 161 = 650 + 1031.25 - 150 - 161 = 1370.25 -> 1370
    # TDEE = 1370 * 1.2 = 1644
    # Cal target = 1644 + 350 = 1994
    # Protein target = 1.9 * 65 = 124g
    female_meta = coach.calculate_metabolism(
        age=30,
        gender="Female",
        height_cm=165.0,
        weight_kg=65.0,
        activity_level="Sedentary",
        fitness_goal="Gain Weight"
    )
    assert female_meta["bmr_kcal"] == 1370
    assert female_meta["tdee_kcal"] == 1644
    assert female_meta["recommended_calories"] == 1994
    assert female_meta["recommended_protein_g"] == 124
    assert female_meta["deficit_or_surplus_kcal"] == 350


def test_metabolism_calculate_api_endpoint():
    res = client.post("/api/metabolism/calculate", json={
        "age": 25,
        "gender": "Male",
        "height_cm": 180.0,
        "current_weight_kg": 80.0,
        "target_weight_kg": 75.0,
        "fitness_goal": "Lose Weight",
        "activity_level": "Moderately Active"
    })
    assert res.status_code == 200
    data = res.json()
    assert "bmr_kcal" in data
    assert "tdee_kcal" in data
    assert "recommended_calories" in data
    assert "recommended_protein_g" in data
    assert data["deficit_or_surplus_kcal"] == -500


def test_transformation_roadmap_in_day_summary():
    res = client.get("/api/today")
    assert res.status_code == 200
    data = res.json()

    assert "transformation_roadmap" in data
    roadmap = data["transformation_roadmap"]
    assert roadmap is not None
    assert "goal_title" in roadmap
    assert "what_will_do_summary" in roadmap
    assert "how_much_done_summary" in roadmap
    assert "what_can_do_actions" in roadmap
    assert len(roadmap["what_can_do_actions"]) >= 3

    # Check roadmap actions structure
    action = roadmap["what_can_do_actions"][0]
    assert "title" in action
    assert "subtitle" in action
    assert "category" in action
    assert "done" in action


def test_detailed_history_endpoint():
    res = client.get("/api/history/detailed?days=14")
    assert res.status_code == 200
    records = res.json()
    assert len(records) == 14

    first = records[0]
    assert first["label"] == "Today"
    assert "weight_kg" in first
    assert "protein_g" in first
    assert "calories_consumed" in first
    assert "calories_burned" in first
    assert "net_calories" in first
    assert "steps" in first
    assert "water_ml" in first
    assert "habits_completed" in first
    assert "health_score" in first


def test_update_targets_with_metabolism_profile():
    res = client.put("/api/targets", json={
        "age": 32,
        "gender": "Female",
        "height_cm": 168.0,
        "current_weight_kg": 70.0,
        "target_weight_kg": 62.0,
        "starting_weight_kg": 76.0,
        "fitness_goal": "Lose Weight",
        "activity_level": "Lightly Active",
        "bmr_kcal": 1400,
        "tdee_kcal": 1925,
        "calories_target": 1425,
        "protein_target_g": 140,
        "steps_target": 9000,
        "water_target_ml": 2800,
        "water_reminder_interval_min": 45
    })
    assert res.status_code == 200
    updated = res.json()
    targets = updated["targets"]
    assert targets["age"] == 32
    assert targets["gender"] == "Female"
    assert targets["fitness_goal"] == "Lose Weight"
    assert targets["starting_weight_kg"] == 76.0
    assert targets["calories_target"] == 1425
    assert targets["water_reminder_interval_min"] == 45
