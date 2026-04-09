"""
Core EV Route Planner.
Orchestrates: geocoding → routing → charging station selection → battery simulation → AI recommendation.
"""
import math
from typing import Optional
from fastapi import HTTPException

from app.services.routing import geocode, get_route
from app.services.charging import fetch_stations_along_route
from app.services.ai_recommendation import generate_route_recommendation
from app.schemas.route import RouteRequest, RouteResult, ChargingStop, RouteStep


def _decode_geometry(geometry) -> list[list[float]]:
    """
    ORS returns geometry as encoded polyline string or GeoJSON coords.
    Try to handle both; fall back to empty list.
    """
    if geometry is None:
        return []
    if isinstance(geometry, list):
        return geometry  # already [[lon, lat], ...]
    # Encoded polyline — decode it
    try:
        import polyline
        decoded = polyline.decode(geometry)
        return [[lon, lat] for lat, lon in decoded]
    except Exception:
        return []


def _sample_waypoints(geometry: list[list[float]], n: int = 10) -> list[tuple[float, float]]:
    """Sample n evenly-spaced [lon, lat] points from route geometry as (lat, lon) tuples."""
    if not geometry:
        return []
    step = max(1, len(geometry) // n)
    sampled = geometry[::step]
    return [(pt[1], pt[0]) for pt in sampled]  # convert to (lat, lon)


def _simulate_battery(
    segments_km: list[float],
    battery_kwh: float,
    battery_pct: float,
    efficiency_wh_per_km: float,
    stations: list[dict],
    station_positions_km: list[float],
) -> tuple[list[dict], float]:
    """
    Simulate battery state along the route.
    Returns (enriched_stations, final_battery_pct).
    
    stations: ordered list of charging stops
    station_positions_km: cumulative km position of each stop
    """
    current_kwh = battery_kwh * (battery_pct / 100)
    total_km = sum(segments_km)
    enriched = []

    prev_km = 0.0
    for i, (station, pos_km) in enumerate(zip(stations, station_positions_km)):
        # Drive to this stop
        drive_km = pos_km - prev_km
        consumed_kwh = drive_km * efficiency_wh_per_km / 1000
        current_kwh = max(0.0, current_kwh - consumed_kwh)
        arrival_pct = round(current_kwh / battery_kwh * 100, 1)

        # Charge to 80% (optimal for battery health & speed)
        target_kwh = battery_kwh * 0.80
        charge_needed_kwh = max(0.0, target_kwh - current_kwh)
        power_kw = station["power_kw"]
        charge_time_min = (charge_needed_kwh / power_kw) * 60 if power_kw > 0 else 0
        cost_eur = charge_needed_kwh * station["cost_per_kwh"]
        current_kwh = min(battery_kwh, current_kwh + charge_needed_kwh)
        after_pct = round(current_kwh / battery_kwh * 100, 1)

        enriched.append({
            **station,
            "distance_from_start_km": round(pos_km, 1),
            "charge_time_min": round(charge_time_min, 1),
            "cost_eur": round(cost_eur, 2),
            "battery_on_arrival_pct": arrival_pct,
            "battery_after_charge_pct": after_pct,
        })
        prev_km = pos_km

    # Drive remaining to destination
    remaining_km = total_km - prev_km
    consumed_kwh = remaining_km * efficiency_wh_per_km / 1000
    current_kwh = max(0.0, current_kwh - consumed_kwh)
    final_pct = round(current_kwh / battery_kwh * 100, 1)

    return enriched, final_pct


def _select_stops(
    stations: list[dict],
    route_waypoints: list[tuple[float, float]],
    total_km: float,
    battery_kwh: float,
    battery_pct: float,
    efficiency_wh_per_km: float,
) -> tuple[list[dict], list[float]]:
    """
    Greedy algorithm: select charging stops needed to complete the route.
    Returns (selected_stations, their_km_positions).
    """
    max_range_km = (battery_kwh * battery_pct / 100) / (efficiency_wh_per_km / 1000)
    full_range_km = battery_kwh / (efficiency_wh_per_km / 1000)
    safe_range_km = full_range_km * 0.85  # keep 15% buffer

    # Map each station to its approximate km position along the route
    # Use simple projection: find the closest waypoint index, then scale by total_km
    if not route_waypoints:
        return [], []

    def station_km_position(station: dict) -> float:
        slat, slon = station["lat"], station["lon"]
        best_idx = 0
        best_d = float("inf")
        for idx, (wlat, wlon) in enumerate(route_waypoints):
            d = math.sqrt((slat - wlat) ** 2 + (slon - wlon) ** 2)
            if d < best_d:
                best_d = d
                best_idx = idx
        return (best_idx / max(1, len(route_waypoints) - 1)) * total_km

    # Annotate stations with km position and sort
    annotated = []
    for s in stations:
        km = station_km_position(s)
        if 2.0 < km < total_km - 2.0:  # not at start/end
            annotated.append((km, s))
    annotated.sort(key=lambda x: x[0])

    # Greedy selection
    selected = []
    selected_km = []
    current_km = 0.0
    current_range = max_range_km

    for km, station in annotated:
        drive_km = km - current_km
        if drive_km <= 0:
            continue

        if current_range - drive_km < safe_range_km * 0.15:
            # Need to stop here
            selected.append(station)
            selected_km.append(km)
            current_range = safe_range_km  # after charging to 80%
            current_km = km

        # Can we reach destination without this stop?
        remaining = total_km - current_km
        if current_range >= remaining + safe_range_km * 0.15:
            break  # no more stops needed

    # Final check: if we still can't reach, force the best available stop
    if not selected:
        remaining = total_km
        if max_range_km < remaining:
            # Pick the station ~70% of our range from start
            ideal_km = max_range_km * 0.7
            best = min(annotated, key=lambda x: abs(x[0] - ideal_km), default=(None, None))
            if best[1] is not None:
                selected = [best[1]]
                selected_km = [best[0]]

    return selected, selected_km


async def plan_route(request: RouteRequest) -> RouteResult:
    """
    Main route planning function.
    """
    # 1. Geocode origin and destination
    origin_coords = await geocode(request.origin)
    if not origin_coords:
        raise HTTPException(status_code=400, detail=f"Could not geocode origin: {request.origin}")

    dest_coords = await geocode(request.destination)
    if not dest_coords:
        raise HTTPException(status_code=400, detail=f"Could not geocode destination: {request.destination}")

    origin_lat, origin_lon = origin_coords
    dest_lat, dest_lon = dest_coords

    # 2. Get initial route (no waypoints yet)
    route_data = await get_route(origin_lat, origin_lon, dest_lat, dest_lon)
    total_km = route_data["distance_km"]
    drive_time_min = route_data["duration_min"]

    # 3. Check if we can make it without stops
    current_kwh = request.battery_capacity_kwh * (request.battery_level_pct / 100)
    max_range_km = current_kwh / (request.efficiency_wh_per_km / 1000)

    # 4. Fetch charging stations along route
    geometry = route_data.get("geometry", [])
    if isinstance(geometry, str):
        # Encoded polyline — try to decode
        coords = _decode_geometry(geometry)
    elif isinstance(geometry, dict) and "coordinates" in geometry:
        coords = geometry["coordinates"]
    else:
        coords = []

    waypoints = _sample_waypoints(coords, n=12)

    # If geometry unavailable, use start/end/midpoint
    if not waypoints:
        mid_lat = (origin_lat + dest_lat) / 2
        mid_lon = (origin_lon + dest_lon) / 2
        waypoints = [(origin_lat, origin_lon), (mid_lat, mid_lon), (dest_lat, dest_lon)]

    stations = []
    selected_stops = []
    selected_km = []
    charging_time_min = 0.0
    estimated_cost_eur = 0.0

    if max_range_km < total_km * 0.9:
        # Need charging — fetch stations
        try:
            stations = await fetch_stations_along_route(
                waypoints,
                search_radius_km=15.0,
                max_power_kw=50.0,
            )
        except Exception:
            stations = []

        if stations:
            selected_stops, selected_km = _select_stops(
                stations,
                waypoints,
                total_km,
                request.battery_capacity_kwh,
                request.battery_level_pct,
                request.efficiency_wh_per_km,
            )

    # 5. Battery simulation
    enriched_stops, arrival_pct = _simulate_battery(
        segments_km=[total_km],
        battery_kwh=request.battery_capacity_kwh,
        battery_pct=request.battery_level_pct,
        efficiency_wh_per_km=request.efficiency_wh_per_km,
        stations=selected_stops,
        station_positions_km=selected_km,
    )

    for stop in enriched_stops:
        charging_time_min += stop["charge_time_min"]
        estimated_cost_eur += stop["cost_eur"]

    # 6. If we have stops, re-route via waypoints
    if selected_stops:
        stop_waypoints = [(s["lat"], s["lon"]) for s in selected_stops]
        try:
            route_data = await get_route(
                origin_lat, origin_lon,
                dest_lat, dest_lon,
                waypoints=stop_waypoints,
            )
        except Exception:
            pass  # keep original route

    # 7. Build route steps
    route_steps = [
        RouteStep(**step) for step in route_data.get("steps", [])
    ]

    # 8. AI recommendation
    ai_text = generate_route_recommendation(
        origin=request.origin,
        destination=request.destination,
        distance_km=total_km,
        drive_time_min=drive_time_min,
        charging_stops=enriched_stops,
        battery_start_pct=request.battery_level_pct,
        battery_arrival_pct=arrival_pct,
        vehicle_model=request.vehicle_model,
        battery_capacity_kwh=request.battery_capacity_kwh,
        estimated_cost_eur=estimated_cost_eur,
    )

    # 9. Build final geometry list
    final_geometry = coords if coords else None

    # 10. Assemble result
    charging_stop_objects = [
        ChargingStop(
            name=s["name"],
            address=s["address"],
            lat=s["lat"],
            lon=s["lon"],
            distance_from_start_km=s["distance_from_start_km"],
            power_kw=s["power_kw"],
            charge_time_min=s["charge_time_min"],
            cost_eur=s["cost_eur"],
            available_connectors=s["available_connectors"],
            total_connectors=s["total_connectors"],
            operator=s["operator"],
            connection_types=s["connection_types"],
            battery_on_arrival_pct=s["battery_on_arrival_pct"],
            battery_after_charge_pct=s["battery_after_charge_pct"],
        )
        for s in enriched_stops
    ]

    return RouteResult(
        origin=request.origin,
        destination=request.destination,
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        destination_lat=dest_lat,
        destination_lon=dest_lon,
        total_distance_km=total_km,
        drive_time_min=drive_time_min,
        charging_time_min=round(charging_time_min, 1),
        total_time_min=round(drive_time_min + charging_time_min, 1),
        arrival_battery_pct=max(0.0, arrival_pct),
        estimated_cost_eur=round(estimated_cost_eur, 2),
        vehicle_model=request.vehicle_model,
        battery_level_pct=request.battery_level_pct,
        battery_capacity_kwh=request.battery_capacity_kwh,
        charging_stops=charging_stop_objects,
        route_steps=route_steps,
        geometry=final_geometry,
        ai_recommendation=ai_text,
    )
