"""
Core EV Route Planner.
"""
import math
from fastapi import HTTPException

from app.services.routing import geocode, get_route
from app.services.charging import fetch_stations_along_route
from app.services.ai_recommendation import generate_route_recommendation
from app.schemas.route import RouteRequest, RouteResult, ChargingStop, RouteStep


def _decode_geometry(geometry) -> list[list[float]]:
    if geometry is None:
        return []
    if isinstance(geometry, list):
        return geometry
    try:
        import polyline
        decoded = polyline.decode(geometry)
        return [[lon, lat] for lat, lon in decoded]
    except Exception:
        return []


def _sample_waypoints(geometry: list[list[float]], n: int = 20) -> list[tuple[float, float]]:
    if not geometry:
        return []
    step = max(1, len(geometry) // n)
    sampled = geometry[::step]
    # Всегда добавляем первую и последнюю точку
    result = [(pt[1], pt[0]) for pt in sampled]
    first = (geometry[0][1], geometry[0][0])
    last = (geometry[-1][1], geometry[-1][0])
    if result[0] != first:
        result.insert(0, first)
    if result[-1] != last:
        result.append(last)
    return result


def _simulate_battery(
    total_km: float,
    battery_kwh: float,
    battery_pct: float,
    efficiency_wh_per_km: float,
    stations: list[dict],
    station_positions_km: list[float],
) -> tuple[list[dict], float]:
    current_kwh = battery_kwh * (battery_pct / 100)
    enriched = []
    prev_km = 0.0

    for station, pos_km in zip(stations, station_positions_km):
        drive_km = pos_km - prev_km
        consumed_kwh = drive_km * efficiency_wh_per_km / 1000
        current_kwh = max(0.0, current_kwh - consumed_kwh)
        arrival_pct = round(current_kwh / battery_kwh * 100, 1)

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

    current_kwh = battery_kwh * (battery_pct / 100)
    max_range_km = current_kwh / (efficiency_wh_per_km / 1000)
    full_range_km = battery_kwh / (efficiency_wh_per_km / 1000)
    safe_range_km = full_range_km * 0.80
    min_buffer_km = full_range_km * 0.15

    # Назначаем каждой станции позицию вдоль маршрута
    # Используем ближайшую точку waypoint
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

    # Аннотируем и сортируем
    annotated = []
    for s in stations:
        km = station_km_position(s)
        if 5.0 < km < total_km - 5.0:
            annotated.append((km, s))
    annotated.sort(key=lambda x: x[0])

    print(f"DEBUG annotated stations: {len(annotated)}")
    for km, s in annotated[:5]:
        print(f"  km={km:.0f} | {s['name']}")

    selected = []
    selected_km = []
    current_pos_km = 0.0
    current_range = max_range_km

    for _ in range(10):  # максимум 10 остановок
        remaining = total_km - current_pos_km

        # Можем доехать до финиша?
        if current_range >= remaining + min_buffer_km:
            print(f"DEBUG: can reach destination, range={current_range:.0f}km remaining={remaining:.0f}km")
            break

        # Ищем все станции которые мы можем достичь
        # с учётом минимального буфера
        reachable = [
            (km, s) for km, s in annotated
            if current_pos_km + 5 < km <= current_pos_km + current_range - min_buffer_km
        ]

        if not reachable:
            # Буфер недостижим — берём просто всё что достижимо
            reachable = [
                (km, s) for km, s in annotated
                if current_pos_km + 5 < km <= current_pos_km + current_range
            ]

        if not reachable:
            print(f"DEBUG: no reachable stations from pos={current_pos_km:.0f}km range={current_range:.0f}km")
            break

        # Берём самую дальнюю достижимую станцию
        km, best = reachable[-1]

        selected.append(best)
        selected_km.append(km)
        current_range = safe_range_km  # после зарядки до 80%
        current_pos_km = km
        print(f"DEBUG: selected stop at {km:.0f}km: {best['name']}")

    return selected, selected_km

async def plan_route(request: RouteRequest) -> RouteResult:
    # 1. Геокодинг
    origin_coords = await geocode(request.origin)
    if not origin_coords:
        raise HTTPException(status_code=400, detail=f"Could not geocode origin: {request.origin}")

    dest_coords = await geocode(request.destination)
    if not dest_coords:
        raise HTTPException(status_code=400, detail=f"Could not geocode destination: {request.destination}")

    origin_lat, origin_lon = origin_coords
    dest_lat, dest_lon = dest_coords

    # 2. Маршрут
    route_data = await get_route(origin_lat, origin_lon, dest_lat, dest_lon)
    total_km = route_data["distance_km"]
    drive_time_min = route_data["duration_min"]

    # 3. Запас хода
    current_kwh = request.battery_capacity_kwh * (request.battery_level_pct / 100)
    max_range_km = current_kwh / (request.efficiency_wh_per_km / 1000)

    full_range_km = request.battery_capacity_kwh / (request.efficiency_wh_per_km / 1000)
    min_buffer_km = full_range_km * 0.15

    # 4. Геометрия
    geometry = route_data.get("geometry", [])
    print(f"DEBUG geometry type: {type(geometry)}, value preview: {str(geometry)[:100]}")

    if isinstance(geometry, str) and geometry:
        # Encoded polyline от ORS — декодируем
        try:
            import polyline as polyline_lib
            decoded = polyline_lib.decode(geometry)
            coords = [[lon, lat] for lat, lon in decoded]
            print(f"DEBUG decoded polyline: {len(coords)} points")
        except Exception as e:
            print(f"DEBUG polyline decode error: {e}")
            coords = []
    elif isinstance(geometry, dict) and "coordinates" in geometry:
        coords = geometry["coordinates"]
        print(f"DEBUG geojson coords: {len(coords)} points")
    elif isinstance(geometry, list) and geometry:
        coords = geometry
        print(f"DEBUG list coords: {len(coords)} points")
    else:
        coords = []
        print(f"DEBUG: no geometry available")

    waypoints = _sample_waypoints(coords, n=20)
    print(f"DEBUG geometry points: {len(coords)}, waypoints: {len(waypoints)}")
    if waypoints:
        print(f"  first waypoint: {waypoints[0]}")
        print(f"  middle waypoint: {waypoints[len(waypoints) // 2]}")
        print(f"  last waypoint: {waypoints[-1]}")
    if not waypoints:
        mid_lat = (origin_lat + dest_lat) / 2
        mid_lon = (origin_lon + dest_lon) / 2
        waypoints = [(origin_lat, origin_lon), (mid_lat, mid_lon), (dest_lat, dest_lon)]

    # 5. Нужны ли остановки?
    # ИСПРАВЛЕНИЕ: проверяем реальный запас хода vs расстояние + буфер
    need_charging = max_range_km < (total_km + min_buffer_km)
    print(
        f"DEBUG: battery={request.battery_level_pct}%, range={max_range_km:.0f}km, distance={total_km:.0f}km, need_charging={need_charging}")

    selected_stops = []
    selected_km = []

    if need_charging:
        try:
            stations = await fetch_stations_along_route(
                waypoints,
                search_radius_km=25.0,  # увеличили радиус
                max_power_kw=22.0,
            )
            print(f"DEBUG stations found: {len(stations)}")
        except Exception as e:
            print(f"DEBUG stations error: {e}")
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
            print(f"DEBUG selected stops: {len(selected_stops)} at km positions: {selected_km}")
        else:
            print("DEBUG: no stations found at all!")

    # 6. Симуляция батареи
    enriched_stops, arrival_pct = _simulate_battery(
        total_km=total_km,
        battery_kwh=request.battery_capacity_kwh,
        battery_pct=request.battery_level_pct,
        efficiency_wh_per_km=request.efficiency_wh_per_km,
        stations=selected_stops,
        station_positions_km=selected_km,
    )

    charging_time_min = sum(s["charge_time_min"] for s in enriched_stops)
    estimated_cost_eur = sum(s["cost_eur"] for s in enriched_stops)

    # 7. Перестроить маршрут через остановки
    if enriched_stops:
        stop_waypoints = [(s["lat"], s["lon"]) for s in enriched_stops]
        try:
            route_data = await get_route(
                origin_lat, origin_lon,
                dest_lat, dest_lon,
                waypoints=stop_waypoints,
            )
        except Exception:
            pass

    # 8. Шаги маршрута
    route_steps = [RouteStep(**step) for step in route_data.get("steps", [])]

    # 9. AI рекомендация
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

    # 10. Результат
    final_geometry = coords if coords else None

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