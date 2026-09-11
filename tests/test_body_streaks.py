"""
Tests for Weight, Height, Target Weight, BMI, and Habit Streaks (No Fast Food, No Sweets).
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import database as db
from app import seed_data

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_clean_db():
    seed_data.seed_database(force=True)



def test_body_metrics_and_bmi():
    res = client.get("/api/today")
    assert res.status_code == 200
    data = res.json()

    # Verify target fields
    targets = data["targets"]
    assert "current_weight_kg" in targets
    assert "height_cm" in targets
    assert "target_weight_kg" in targets
    assert targets["current_weight_kg"] > 0
    assert targets["height_cm"] > 0
    assert targets["target_weight_kg"] > 0

    # Verify BMI and weight progress
    assert "bmi" in data
    assert "bmi_category" in data
    assert "weight_to_target_kg" in data
    assert "no_fastfood_streak" in data
    assert "no_sweets_streak" in data
    assert data["no_fastfood_streak"] >= 1
    assert data["no_sweets_streak"] >= 1


def test_log_weight():
    # Log new weigh-in: 77.8 kg
    res = client.post("/api/weight", json={
        "weight_kg": 77.8,
        "note": "Morning weigh-in"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["targets"]["current_weight_kg"] == 77.8
    # Target is 72.0, so diff should be 77.8 - 72.0 = 5.8 kg
    assert abs(data["weight_to_target_kg"] - 5.8) < 0.01


def test_discipline_habit_toggles():
    before = client.get("/api/today").json()
    init_fastfood = next(h for h in before["habits"] if h["id"] == "habit_no_fastfood")["completed"]
    init_sweets = next(h for h in before["habits"] if h["id"] == "habit_no_sweets")["completed"]

    # Toggle No Fast Food
    res1 = client.post("/api/habits/toggle", json={"habit_id": "habit_no_fastfood"})
    assert res1.status_code == 200
    data1 = res1.json()
    h_fastfood = next(h for h in data1["habits"] if h["id"] == "habit_no_fastfood")
    assert h_fastfood["completed"] != init_fastfood

    # Toggle No Sweets
    res2 = client.post("/api/habits/toggle", json={"habit_id": "habit_no_sweets"})
    assert res2.status_code == 200
    data2 = res2.json()
    h_sweets = next(h for h in data2["habits"] if h["id"] == "habit_no_sweets")
    assert h_sweets["completed"] != init_sweets
