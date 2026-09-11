"""
Data models for Daily Health Coach.
Using Pydantic v2 for type validation and schema serialization.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class Targets(BaseModel):
    water_target_ml: int = Field(default=2500, description="Daily hydration target in ml")
    steps_target: int = Field(default=10000, description="Daily steps target")
    calories_target: int = Field(default=2100, description="Daily calorie budget")
    protein_target_g: int = Field(default=130, description="Daily protein target in grams")
    carbs_target_g: int = Field(default=220, description="Daily carbs target in grams")
    fat_target_g: int = Field(default=65, description="Daily fat target in grams")
    sleep_target_hours: float = Field(default=8.0, description="Daily sleep target in hours")
    current_weight_kg: float = Field(default=78.5, ge=20.0, le=300.0, description="Person current weight in kg")
    height_cm: float = Field(default=175.0, ge=80.0, le=250.0, description="Person height in cm")
    target_weight_kg: float = Field(default=72.0, ge=20.0, le=300.0, description="Person target weight in kg")
    starting_weight_kg: float = Field(default=80.0, ge=20.0, le=300.0, description="Starting body weight in kg")
    age: int = Field(default=28, ge=10, le=120, description="Age in years")
    gender: str = Field(default="Male", description="Male, Female, Other")
    fitness_goal: str = Field(default="Lose Weight", description="Lose Weight, Gain Weight, Maintain")
    activity_level: str = Field(default="Moderately Active", description="Sedentary, Lightly Active, Moderately Active, Very Active")
    bmr_kcal: int = Field(default=1720, description="Basal Metabolic Rate")
    tdee_kcal: int = Field(default=2400, description="Total Daily Energy Expenditure")
    water_reminder_interval_min: int = Field(default=60, ge=15, le=240, description="Water reminder interval in minutes")


class WaterLogCreate(BaseModel):
    amount_ml: int = Field(..., gt=0, le=3000, description="Amount in ml")
    timestamp: Optional[str] = Field(default=None, description="Time of log e.g. 10:30 AM")
    date: Optional[str] = Field(default=None, description="Date YYYY-MM-DD")
    note: Optional[str] = Field(default=None)


class WaterLogEntry(WaterLogCreate):
    id: int


class FoodLogCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    meal_type: str = Field(default="Snack", description="Breakfast, Lunch, Dinner, Snack")
    calories: int = Field(..., ge=0, le=5000)
    protein_g: float = Field(default=0.0, ge=0)
    carbs_g: float = Field(default=0.0, ge=0)
    fat_g: float = Field(default=0.0, ge=0)
    timestamp: Optional[str] = Field(default=None)
    date: Optional[str] = Field(default=None)


class FoodLogEntry(FoodLogCreate):
    id: int


class ActivityLogCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    duration_min: int = Field(..., ge=1, le=480)
    calories_burned: int = Field(default=0, ge=0)
    steps: int = Field(default=0, ge=0)
    intensity: str = Field(default="Moderate", description="Low, Moderate, High")
    timestamp: Optional[str] = Field(default=None)
    date: Optional[str] = Field(default=None)


class ActivityLogEntry(ActivityLogCreate):
    id: int


class WeightLogCreate(BaseModel):
    weight_kg: float = Field(..., ge=20.0, le=300.0, description="Weight in kilograms")
    date: Optional[str] = Field(default=None, description="Date YYYY-MM-DD")
    timestamp: Optional[str] = Field(default=None, description="Time of weigh-in")
    note: Optional[str] = Field(default=None)


class WeightLogEntry(WeightLogCreate):
    id: int


class HabitToggleRequest(BaseModel):
    habit_id: str
    date: Optional[str] = None


class HabitItem(BaseModel):
    id: str
    title: str
    category: str
    icon: str
    completed: bool = False
    streak_count: int = 1
    date: str


class CoachTip(BaseModel):
    id: str
    category: str  # hydration, protein, calories, movement, habit, celebration
    urgency: str   # high, medium, low, achievement
    title: str
    message: str
    action_suggestion: Optional[str] = None
    icon: str = "💡"


class DaySummary(BaseModel):
    date: str
    health_score: int
    score_grade: str
    score_breakdown: dict
    water_total_ml: int
    water_progress_pct: int
    steps_total: int
    steps_progress_pct: int
    active_minutes_total: int
    calories_consumed: int
    calories_burned: int
    net_calories: int
    calories_remaining: int
    protein_total_g: float
    protein_progress_pct: int
    carbs_total_g: float
    fat_total_g: float
    habits_completed: int
    habits_total: int
    habits_progress_pct: int
    streak_days: int
    targets: Targets
    water_logs: List[WaterLogEntry]
    food_logs: List[FoodLogEntry]
    activity_logs: List[ActivityLogEntry]
    habits: List[HabitItem]
    coach_tips: List[CoachTip]
    wearable: Optional["WearableDevice"] = None
    latest_telemetry: Optional["WatchTelemetry"] = None
    bmi: float = 25.6
    bmi_category: str = "Normal Weight"
    weight_to_target_kg: float = 6.5
    weight_progress_pct: int = 65
    no_fastfood_streak: int = 8
    no_sweets_streak: int = 5
    water_reminder_interval_min: int = 60
    transformation_roadmap: Optional["TransformationRoadmap"] = None


class RoadmapActionItem(BaseModel):
    title: str
    subtitle: str
    category: str
    done: bool = False
    icon: str = "🎯"


class TransformationRoadmap(BaseModel):
    goal_title: str = "Fat Loss & Lean Muscle Preservation"
    what_will_do_summary: str
    daily_calorie_target: int
    daily_protein_target: int
    daily_deficit_or_surplus: int
    projected_weeks_to_goal: float
    projected_completion_date: str
    how_much_done_summary: str
    weight_shifted_kg: float
    goal_achieved_pct: int
    total_days_active: int
    what_can_do_actions: List[RoadmapActionItem]


class DateWiseRecord(BaseModel):
    date: str
    label: str
    weight_kg: float
    protein_g: float
    calories_consumed: int
    calories_burned: int
    net_calories: int
    steps: int
    water_ml: int
    habits_completed: int
    health_score: int


class MetabolismCalcRequest(BaseModel):
    age: int = Field(default=28, ge=10, le=120)
    gender: str = Field(default="Male")
    height_cm: float = Field(default=175.0, ge=80.0, le=250.0)
    current_weight_kg: float = Field(default=78.5, ge=20.0, le=300.0)
    target_weight_kg: float = Field(default=72.0, ge=20.0, le=300.0)
    fitness_goal: str = Field(default="Lose Weight")
    activity_level: str = Field(default="Moderately Active")


class WearableDevice(BaseModel):
    id: int = 1
    brand: str = "Samsung Galaxy Watch"
    model_name: str = "Galaxy Watch 6 Pro"
    provider: str = "Google Health Connect / Wear OS"
    is_connected: bool = True
    battery_pct: int = 86
    last_sync_timestamp: str = "Just now"


class WatchTelemetry(BaseModel):
    heart_rate_bpm: int = Field(default=72, ge=40, le=220)
    resting_hr: int = Field(default=62, ge=40, le=120)
    hr_zone: str = Field(default="Resting Zone")
    steps: int = Field(default=0, ge=0)
    active_calories: int = Field(default=0, ge=0)
    sleep_hours: float = Field(default=7.5, ge=0, le=24)
    sleep_quality_pct: int = Field(default=88, ge=0, le=100)
    battery_pct: int = Field(default=86, ge=0, le=100)
    timestamp: str = "Just now"


class WearableSyncRequest(BaseModel):
    steps: Optional[int] = Field(default=None, ge=0)
    heart_rate_bpm: Optional[int] = Field(default=None, ge=40, le=220)
    active_calories: Optional[int] = Field(default=None, ge=0)
    sleep_hours: Optional[float] = Field(default=None, ge=0, le=24)
    battery_pct: Optional[int] = Field(default=None, ge=0, le=100)
    date: Optional[str] = None


class WearablePairRequest(BaseModel):
    brand: str = Field(..., min_length=1)
    model_name: str = Field(..., min_length=1)
    provider: Optional[str] = "Health Connect"


class HistoryDay(BaseModel):
    date: str
    label: str
    health_score: int
    steps: int
    water_ml: int
    calories: int
    protein_g: float
    habits_completed: int


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6)
    full_name: str = Field(default="User", max_length=100)


class UserLogin(BaseModel):
    username_or_email: Optional[str] = None
    username: Optional[str] = None
    password: str

    def get_identifier(self) -> str:
        return (self.username_or_email or self.username or "").strip().lower()


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_demo: bool = False
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: UserResponse
    message: str = "Success"
