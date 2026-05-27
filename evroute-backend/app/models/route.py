from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Route info
    origin: Mapped[str] = mapped_column(String(255))
    destination: Mapped[str] = mapped_column(String(255))
    origin_lat: Mapped[float] = mapped_column(Float, nullable=True)
    origin_lon: Mapped[float] = mapped_column(Float, nullable=True)
    destination_lat: Mapped[float] = mapped_column(Float, nullable=True)
    destination_lon: Mapped[float] = mapped_column(Float, nullable=True)

    # Stats
    total_distance_km: Mapped[float] = mapped_column(Float, nullable=True)
    total_duration_min: Mapped[float] = mapped_column(Float, nullable=True)
    charging_time_min: Mapped[float] = mapped_column(Float, nullable=True)
    arrival_battery_pct: Mapped[float] = mapped_column(Float, nullable=True)
    estimated_cost_eur: Mapped[float] = mapped_column(Float, nullable=True)


    vehicle_model: Mapped[str] = mapped_column(String(100), nullable=True)
    battery_level_pct: Mapped[float] = mapped_column(Float, nullable=True)
    battery_capacity_kwh: Mapped[float] = mapped_column(Float, nullable=True)


    charging_stops: Mapped[dict] = mapped_column(JSON, nullable=True)
    ai_recommendation: Mapped[str] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="planned")  # planned | completed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="routes")
