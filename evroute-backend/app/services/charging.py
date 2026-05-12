"""
OpenChargeMap API integration.
Free API key: https://openchargemap.org/site/develop/api
Docs: https://openchargemap.org/site/develop
"""
import httpx
import math
from typing import Optional
from app.core.config import settings

OCM_BASE = "https://api.openchargemap.io/v3"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon points."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _point_on_segment(
    lat: float, lon: float,
    lat1: float, lon1: float,
    lat2: float, lon2: float,
    tolerance_km: float = 5.0,
) -> Optional[float]:
    """
    Check if (lat, lon) is within tolerance_km of the segment (lat1,lon1)-(lat2,lon2).
    Returns distance from start of segment (lat1,lon1) if within tolerance, else None.
    """
    # Simple approach: check distance to both endpoints and midpoints
    d1 = _haversine_km(lat, lon, lat1, lon1)
    d2 = _haversine_km(lat, lon, lat2, lon2)
    total = _haversine_km(lat1, lon1, lat2, lon2)

    # Point is "on" segment if d1 + d2 ≈ total (within tolerance)
    if abs(d1 + d2 - total) <= tolerance_km:
        return d1  # distance from segment start
    return None


async def fetch_stations_along_route(
    waypoints: list[tuple[float, float]],
    search_radius_km: float = 10.0,
    max_power_kw: float = 22.0,
) -> list[dict]:
    if not settings.OPENCHARGEMAP_API_KEY:
        raise ValueError("OPENCHARGEMAP_API_KEY is not set in .env")

    seen_ids = set()
    stations = []

    # Ищем около КАЖДОЙ точки маршрута, не пропускаем ни одну
    async with httpx.AsyncClient(timeout=15) as client:
        for lat, lon in waypoints:
            try:
                resp = await client.get(
                    f"{OCM_BASE}/poi/",
                    params={
                        "key": settings.OPENCHARGEMAP_API_KEY,
                        "latitude": lat,
                        "longitude": lon,
                        "distance": search_radius_km,
                        "distanceunit": "km",
                        "maxresults": 30,
                        "compact": True,
                        "verbose": False,
                        "minpowerkw": max_power_kw,
                        "statustypeid": 50,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                print(f"DEBUG OCM error at {lat:.2f},{lon:.2f}: {e}")
                continue

            for s in data:
                sid = s.get("ID")
                if sid in seen_ids:
                    continue
                seen_ids.add(sid)

                addr_info = s.get("AddressInfo", {})
                connections = s.get("Connections", [])

                power_kw = 0.0
                connection_types = []
                for conn in connections:
                    kw = conn.get("PowerKW") or 0
                    if kw > power_kw:
                        power_kw = kw
                    ct = conn.get("ConnectionType", {})
                    title = ct.get("Title", "")
                    if title and title not in connection_types:
                        connection_types.append(title)

                if power_kw < max_power_kw:
                    continue

                avail = s.get("NumberOfPoints") or len(connections)

                stations.append({
                    "id": sid,
                    "name": addr_info.get("Title", "Charging Station"),
                    "address": (
                        f"{addr_info.get('AddressLine1', '')}, "
                        f"{addr_info.get('Town', '')}, "
                        f"{addr_info.get('Country', {}).get('Title', '')}"
                    ).strip(", "),
                    "lat": addr_info.get("Latitude", lat),
                    "lon": addr_info.get("Longitude", lon),
                    "power_kw": power_kw,
                    "total_connectors": avail,
                    "available_connectors": max(1, avail - 1),
                    "operator": (s.get("OperatorInfo") or {}).get("Title", "Unknown"),
                    "connection_types": connection_types,
                    "cost_per_kwh": 0.28,
                    "is_operational": True,
                })

    return stations

async def fetch_stations_in_bbox(
    lat_min: float, lon_min: float,
    lat_max: float, lon_max: float,
    min_power_kw: float = 22.0,
) -> list[dict]:
    """Fetch stations within a bounding box (for map display)."""
    center_lat = (lat_min + lat_max) / 2
    center_lon = (lon_min + lon_max) / 2
    radius = _haversine_km(lat_min, lon_min, lat_max, lon_max) / 2 + 5

    return await fetch_stations_along_route(
        [(center_lat, center_lon)],
        search_radius_km=min(radius, 50),
        max_power_kw=min_power_kw,
    )
