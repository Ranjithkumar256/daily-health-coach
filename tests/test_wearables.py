"""
Tests for Smartwatch and Wearables integration.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import database as db
from app import seed_data

db.init_db()
seed_data.seed_database(force=True)
client = TestClient(app)


def test_wearable_status():
    res = client.get("/api/wearable/status")
    assert res.status_code == 200
    data = res.json()
    assert "device" in data
    assert "telemetry" in data
    assert data["device"]["is_connected"] is True
    assert "battery_pct" in data["device"]
    assert data["telemetry"]["heart_rate_bpm"] > 0


def test_wearable_pairing():
    res = client.post("/api/wearable/pair", json={
        "brand": "Garmin",
        "model_name": "Forerunner 965",
        "provider": "Garmin Connect"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "paired"
    assert data["device"]["brand"] == "Garmin"
    assert data["device"]["model_name"] == "Forerunner 965"


def test_wearable_telemetry_sync():
    # Send watch sensor sync with 8,800 steps, 74 BPM, 380 active cals
    res = client.post("/api/wearable/sync", json={
        "steps": 8800,
        "heart_rate_bpm": 74,
        "active_calories": 380,
        "sleep_hours": 7.8,
        "battery_pct": 82
    })
    assert res.status_code == 200
    day = res.json()
    assert day["latest_telemetry"]["steps"] == 8800
    assert day["latest_telemetry"]["heart_rate_bpm"] == 74
    assert day["steps_total"] >= 8800
    assert day["wearable"]["battery_pct"] == 82


def test_wearable_simulate_pulse():
    before = client.get("/api/today").json()
    steps_before = before["steps_total"]

    res = client.post("/api/wearable/simulate-pulse")
    assert res.status_code == 200
    after = res.json()
    assert after["steps_total"] >= steps_before
