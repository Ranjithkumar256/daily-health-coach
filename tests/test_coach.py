"""
Unit tests for Python Smart Coach heuristics and Health Score calculations.
"""
import pytest
from app.coach import calculate_health_score, generate_coach_tips


def test_perfect_health_score():
    result = calculate_health_score(
        water_ml=2500,
        water_target=2500,
        steps=10000,
        steps_target=10000,
        protein_g=130.0,
        protein_target=130,
        calories_consumed=2100,
        calories_target=2100,
        habits_completed=6,
        habits_total=6
    )
    assert result["score"] == 100
    assert result["grade"] == "Elite Consistency"
    assert result["breakdown"]["hydration_pts"] == 25
    assert result["breakdown"]["movement_pts"] == 25
    assert result["breakdown"]["fuel_pts"] == 25
    assert result["breakdown"]["habits_pts"] == 25


def test_partial_health_score():
    result = calculate_health_score(
        water_ml=1250,      # 50% = 12.5 pts -> 13
        water_target=2500,
        steps=5000,         # 50% = 12.5 pts -> 13
        steps_target=10000,
        protein_g=65.0,     # 50% = 12.5 pts -> 13
        protein_target=130,
        calories_consumed=2000,
        calories_target=2100,
        habits_completed=3, # 50% = 12.5 pts -> 13
        habits_total=6
    )
    assert 48 <= result["score"] <= 54
    assert result["grade"] in ["Building Momentum", "Needs a Daily Push"]


def test_coach_tips_hydration_deficit():
    tips = generate_coach_tips(
        water_ml=600,
        water_target=2500,
        steps=3000,
        steps_target=10000,
        protein_g=40.0,
        protein_target=130,
        calories_consumed=1200,
        calories_burned=100,
        calories_target=2100,
        habits_completed=2,
        habits_total=6,
        current_hour=15  # 3 PM
    )
    # Should flag afternoon hydration deficit
    categories = [t.category for t in tips]
    assert "hydration" in categories
    afternoon_tip = next(t for t in tips if t.id == "hydra_afternoon_lag")
    assert afternoon_tip.urgency == "high"


def test_coach_tips_protein_achievement():
    tips = generate_coach_tips(
        water_ml=2500,
        water_target=2500,
        steps=10000,
        steps_target=10000,
        protein_g=135.0,
        protein_target=130,
        calories_consumed=2050,
        calories_burned=400,
        calories_target=2100,
        habits_completed=6,
        habits_total=6,
        current_hour=19  # 7 PM
    )
    categories = [t.category for t in tips]
    assert "protein" in categories
    protein_tip = next(t for t in tips if t.id == "protein_crushed")
    assert protein_tip.urgency == "achievement"
