from fastapi import APIRouter, HTTPException
from app.services.routing import geocode

router = APIRouter(prefix="/api/geocode", tags=["Geocoding"])


@router.get("/search")
async def search_location(q: str):
    """
    Geocode an address string to lat/lon.
    Used for autocomplete in the frontend planner.
    """
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Query too short")
    try:
        result = await geocode(q)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Location not found: {q}")
        lat, lon = result
        return {"query": q, "lat": lat, "lon": lon}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoding error: {str(e)}")
