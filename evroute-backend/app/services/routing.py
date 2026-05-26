import httpx
from typing import Optional
from app.core.config import settings


ORS_BASE = "https://api.openrouteservice.org"


async def geocode(address: str) -> Optional[tuple[float, float]]:
    """
    Convert address string to (lat, lon).
    Returns None if not found.
    """
    if not settings.OPENROUTESERVICE_API_KEY:
        raise ValueError("OPENROUTESERVICE_API_KEY is not set in .env")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{ORS_BASE}/geocode/search",
            params={
                "api_key": settings.OPENROUTESERVICE_API_KEY,
                "text": address,
                "size": 1,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    features = data.get("features", [])
    if not features:
        return None

    coords = features[0]["geometry"]["coordinates"]  # [lon, lat]
    return coords[1], coords[0]  # (lat, lon)


async def get_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    waypoints: Optional[list[tuple[float, float]]] = None,
) -> dict:
    """
    Get driving route between two points, optionally via waypoints.
    Returns dict with distance_m, duration_s, steps, geometry.
    waypoints: list of (lat, lon) intermediate stops.
    """
    if not settings.OPENROUTESERVICE_API_KEY:
        raise ValueError("OPENROUTESERVICE_API_KEY is not set in .env")

    # ORS expects [lon, lat] order
    coordinates = [[origin_lon, origin_lat]]
    if waypoints:
        for lat, lon in waypoints:
            coordinates.append([lon, lat])
    coordinates.append([dest_lon, dest_lat])

    payload = {
        "coordinates": coordinates,
        "instructions": True,
        "units": "km",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            f"{ORS_BASE}/v2/directions/driving-car/json",
            json=payload,
            headers={"Authorization": settings.OPENROUTESERVICE_API_KEY},
        )
        resp.raise_for_status()
        data = resp.json()

    route = data["routes"][0]
    summary = route["summary"]
    segments = route.get("segments", [])

    steps = []
    step_num = 1
    for segment in segments:
        for step in segment.get("steps", []):
            steps.append({
                "step_number": step_num,
                "instruction": step.get("instruction", ""),
                "distance_km": round(step.get("distance", 0) / 1000, 2),
                "duration_min": round(step.get("duration", 0) / 60, 1),
            })
            step_num += 1

    geometry = route.get("geometry")

    return {
        "distance_m": summary["distance"] * 1000,
        "distance_km": round(summary["distance"], 2),
        "duration_s": summary["duration"],
        "duration_min": round(summary["duration"] / 60, 1),
        "steps": steps,
        "geometry": geometry,
    }
