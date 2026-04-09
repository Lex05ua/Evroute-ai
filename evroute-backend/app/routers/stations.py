from fastapi import APIRouter, HTTPException
from app.services.charging import fetch_stations_along_route, fetch_stations_in_bbox

router = APIRouter(prefix="/api/stations", tags=["Charging Stations"])


@router.get("/nearby")
async def get_nearby_stations(
    lat: float,
    lon: float,
    radius_km: float = 10.0,
    min_power_kw: float = 22.0,
):
    """Get charging stations near a coordinate point. Useful for the map view."""
    try:
        stations = await fetch_stations_along_route(
            waypoints=[(lat, lon)],
            search_radius_km=min(radius_km, 50),
            max_power_kw=min_power_kw,
        )
        return {"stations": stations, "count": len(stations)}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenChargeMap API error: {str(e)}")


@router.get("/bbox")
async def get_stations_in_bbox(
    lat_min: float,
    lon_min: float,
    lat_max: float,
    lon_max: float,
    min_power_kw: float = 22.0,
):
    """Get charging stations within a bounding box (for map display)."""
    try:
        stations = await fetch_stations_in_bbox(
            lat_min, lon_min, lat_max, lon_max, min_power_kw
        )
        return {"stations": stations, "count": len(stations)}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenChargeMap API error: {str(e)}")
