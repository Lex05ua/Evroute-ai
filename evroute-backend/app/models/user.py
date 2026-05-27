from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Vehicle info
    vehicle_model: Mapped[str] = mapped_column(String(100), default="Tesla Model 3")
    battery_capacity_kwh: Mapped[float] = mapped_column(default=75.0)
    efficiency_wh_per_km: Mapped[float] = mapped_column(default=180.0)  # Wh/km

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    routes: Mapped[list["Route"]] = relationship(back_populates="user", cascade="all, delete-orphan")
