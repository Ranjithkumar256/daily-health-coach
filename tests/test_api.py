"""
Integration tests for FastAPI endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import database as db
from app import seed_data

db.init_db()
seed_data.seed_database(force=True)
client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["app"] == "Daily Health Coach"


def test_get_today_summary():
    res = client.get("/api/today")
    assert res.status_code == 200
    data = res.json()
    assert "health_score" in data
    assert "water_total_ml" in data
    assert "protein_total_g" in data
    assert "coach_tips" in data
    assert isinstance(data["coach_tips"], list)


def test_water_logging_flow():
    # Log 250ml
    log_payload = {
        "amount_ml": 250,
        "note": "Test cup",
        "timestamp": "11:00 AM"
    }
    res = client.post("/api/water", json=log_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["water_total_ml"] >= 250

    # Retrieve last log id and delete it
    last_id = data["water_logs"][0]["id"]
    del_res = client.delete(f"/api/water/{last_id}")
    assert del_res.status_code == 200


def test_habit_toggle_flow():
    summary = client.get("/api/today").json()
    first_habit = summary["habits"][0]
    initial_completed = first_habit["completed"]

    toggle_res = client.post("/api/habits/toggle", json={"habit_id": first_habit["id"]})
    assert toggle_res.status_code == 200
    updated_habit = toggle_res.json()["habits"][0]
    assert updated_habit["completed"] != initial_completed


def test_history_endpoint():
    res = client.get("/api/history")
    assert res.status_code == 200
    history = res.json()
    assert len(history) == 7
    assert history[-1]["label"] == "Today"
