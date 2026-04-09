from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.route import Route
from app.schemas.route import RouteRequest, RouteResult, RouteHistoryItem
from app.services.planner import plan_route

router = APIRouter(prefix="/api/routes", tags=["Routes"])


@router.post("/plan", response_model=RouteResult)
async def calculate_route(
    request: RouteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Plan an EV route with charging stops and AI recommendation.
    Requires authentication. Saves the route to history automatically.
    """
    result = await plan_route(request)

    # Save to history if user is authenticated
    if current_user:
        route = Route(
            user_id=current_user.id,
            origin=result.origin,
            destination=result.destination,
            origin_lat=result.origin_lat,
            origin_lon=result.origin_lon,
            destination_lat=result.destination_lat,
            destination_lon=result.destination_lon,
            total_distance_km=result.total_distance_km,
            total_duration_min=result.total_time_min,
            charging_time_min=result.charging_time_min,
            arrival_battery_pct=result.arrival_battery_pct,
            estimated_cost_eur=result.estimated_cost_eur,
            vehicle_model=result.vehicle_model,
            battery_level_pct=result.battery_level_pct,
            battery_capacity_kwh=result.battery_capacity_kwh,
            charging_stops=[s.model_dump() for s in result.charging_stops],
            ai_recommendation=result.ai_recommendation,
            status="planned",
        )
        db.add(route)
        await db.commit()
        await db.refresh(route)
        result.route_id = route.id

    return result


@router.post("/plan/guest", response_model=RouteResult)
async def calculate_route_guest(request: RouteRequest):
    """
    Plan a route without authentication (no history saved).
    Useful for demo/landing page usage.
    """
    return await plan_route(request)


@router.get("/history", response_model=list[RouteHistoryItem])
async def get_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's route history, newest first."""
    result = await db.execute(
        select(Route)
        .where(Route.user_id == current_user.id)
        .order_by(desc(Route.created_at))
        .limit(limit)
        .offset(offset)
    )
    routes = result.scalars().all()

    items = []
    for r in routes:
        stops = r.charging_stops or []
        items.append(
            RouteHistoryItem(
                id=r.id,
                origin=r.origin,
                destination=r.destination,
                total_distance_km=r.total_distance_km,
                total_duration_min=r.total_duration_min,
                charging_time_min=r.charging_time_min,
                arrival_battery_pct=r.arrival_battery_pct,
                estimated_cost_eur=r.estimated_cost_eur,
                vehicle_model=r.vehicle_model,
                status=r.status,
                created_at=r.created_at,
                charging_stops_count=len(stops),
            )
        )
    return items


@router.get("/history/{route_id}", response_model=RouteResult)
async def get_route_detail(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full details of a saved route."""
    result = await db.execute(
        select(Route).where(Route.id == route_id, Route.user_id == current_user.id)
    )
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    from app.schemas.route import ChargingStop, RouteStep
    stops = [ChargingStop(**s) for s in (route.charging_stops or [])]

    return RouteResult(
        origin=route.origin,
        destination=route.destination,
        origin_lat=route.origin_lat or 0,
        origin_lon=route.origin_lon or 0,
        destination_lat=route.destination_lat or 0,
        destination_lon=route.destination_lon or 0,
        total_distance_km=route.total_distance_km or 0,
        drive_time_min=(route.total_duration_min or 0) - (route.charging_time_min or 0),
        charging_time_min=route.charging_time_min or 0,
        total_time_min=route.total_duration_min or 0,
        arrival_battery_pct=route.arrival_battery_pct or 0,
        estimated_cost_eur=route.estimated_cost_eur or 0,
        vehicle_model=route.vehicle_model or "",
        battery_level_pct=route.battery_level_pct or 80,
        battery_capacity_kwh=route.battery_capacity_kwh or 75,
        charging_stops=stops,
        route_steps=[],
        ai_recommendation=route.ai_recommendation or "",
        route_id=route.id,
    )


@router.patch("/history/{route_id}/complete")
async def mark_completed(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a route as completed."""
    result = await db.execute(
        select(Route).where(Route.id == route_id, Route.user_id == current_user.id)
    )
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    route.status = "completed"
    await db.commit()
    return {"message": "Route marked as completed"}


@router.delete("/history/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a route from history."""
    result = await db.execute(
        select(Route).where(Route.id == route_id, Route.user_id == current_user.id)
    )
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    await db.delete(route)
    await db.commit()
