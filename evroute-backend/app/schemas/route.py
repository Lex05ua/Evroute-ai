from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RouteRequest(BaseModel):
    origin: str = Field(..., description="Starting city or address")
    destination: str = Field(..., description="Destination city or address")
    battery_level_pct: float = Field(default=80.0, ge=5, le=100)
    vehicle_model: str = Field(default="Tesla Model 3")
    battery_capacity_kwh: float = Field(default=75.0, gt=0)
    efficiency_wh_per_km: float = Field(default=180.0, gt=0)


class ChargingStop(BaseModel):
    name: str
    address: str
    lat: float
    lon: float
    distance_from_start_km: float
    power_kw: float
    charge_time_min: float
    cost_eur: float
    available_connectors: int
    total_connectors: int
    operator: str
    connection_types: list[str]
    battery_on_arrival_pct: float
    battery_after_charge_pct: float


class RouteStep(BaseModel):
    step_number: int
    instruction: str
    distance_km: float
    duration_min: float


class RouteResult(BaseModel):
    origin: str
    destination: str
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float

    total_distance_km: float
    drive_time_min: float
    charging_time_min: float
    total_time_min: float
    arrival_battery_pct: float
    estimated_cost_eur: float

    vehicle_model: str
    battery_level_pct: float
    battery_capacity_kwh: float

    charging_stops: list[ChargingStop]
    route_steps: list[RouteStep]
    geometry: Optional[list[list[float]]] = None  # [[lon, lat], ...]
    ai_recommendation: str

    route_id: Optional[int] = None


class RouteHistoryItem(BaseModel):
    id: int
    origin: str
    destination: str
    total_distance_km: Optional[float]
    total_duration_min: Optional[float]
    charging_time_min: Optional[float]
    arrival_battery_pct: Optional[float]
    estimated_cost_eur: Optional[float]
    vehicle_model: Optional[str]
    status: str
    created_at: datetime
    charging_stops_count: int = 0

    model_config = {"from_attributes": True}
