from groq import Groq
from app.core.config import settings


def generate_route_recommendation(
    origin: str,
    destination: str,
    distance_km: float,
    drive_time_min: float,
    charging_stops: list[dict],
    battery_start_pct: float,
    battery_arrival_pct: float,
    vehicle_model: str,
    battery_capacity_kwh: float,
    estimated_cost_eur: float,
) -> str:
    n = len(charging_stops)
    total_time_min = drive_time_min + sum(
        s.get("charge_time_min", 0) for s in charging_stops
    )
    hours = int(total_time_min // 60)
    mins = int(total_time_min % 60)
    time_str = f"{hours}h {mins}min" if hours > 0 else f"{mins}min"

    stops_info = ""
    for i, s in enumerate(charging_stops, 1):
        stops_info += (
            f"\nStop {i}: {s.get('name', 'Unknown')}, "
            f"{s.get('power_kw', 0):.0f} kW, "
            f"{s.get('charge_time_min', 0):.0f} min, "
            f"arrive {s.get('battery_on_arrival_pct', 0):.0f}%"
        )

    prompt = (
        f"You are an EV route planning assistant. "
        f"Give exactly 2-3 sentences of practical advice for this trip:\n\n"
        f"Route: {origin} to {destination}, {distance_km:.0f} km\n"
        f"Vehicle: {vehicle_model}, {battery_capacity_kwh:.0f} kWh battery\n"
        f"Battery: start {battery_start_pct:.0f}%, "
        f"arrive {battery_arrival_pct:.0f}%\n"
        f"Total time: {time_str}\n"
        f"Charging stops: {n}{stops_info}\n"
        f"Estimated cost: €{estimated_cost_eur:.2f}\n\n"
        f"Be brief, practical and friendly."
    )

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq AI error: {e}")
        return _fallback(
            origin, destination, distance_km,
            n, battery_arrival_pct, time_str,
            estimated_cost_eur
        )


def _fallback(
    origin, destination, distance_km,
    n, battery_arrival_pct, time_str,
    estimated_cost_eur
) -> str:
    if n == 0:
        return (
            f"Your vehicle has sufficient range to complete "
            f"{origin} to {destination} ({distance_km:.0f} km) "
            f"without any charging stops. "
            f"Total drive time: {time_str}. "
            f"You will arrive with {battery_arrival_pct:.0f}% battery remaining."
        )
    stop_word = "stop" if n == 1 else "stops"
    buffer = "comfortable" if battery_arrival_pct >= 25 else "low"
    return (
        f"Route planned with {n} charging {stop_word} "
        f"for the {distance_km:.0f} km journey "
        f"from {origin} to {destination}. "
        f"Total time including charging: {time_str}. "
        f"Arrival battery level is {buffer} "
        f"({battery_arrival_pct:.0f}%). "
        f"Estimated charging cost: €{estimated_cost_eur:.2f}."
    )

# def generate_route_recommendation(
#     origin: str,
#     destination: str,
#     distance_km: float,
#     drive_time_min: float,
#     charging_stops: list[dict],
#     battery_start_pct: float,
#     battery_arrival_pct: float,
#     vehicle_model: str,
#     battery_capacity_kwh: float,
#     estimated_cost_eur: float,
# ) -> str:
#     n = len(charging_stops)
#     total_time_min = drive_time_min + sum(s.get("charge_time_min", 0) for s in charging_stops)
#     hours = int(total_time_min // 60)
#     mins = int(total_time_min % 60)
#     time_str = f"{hours}h {mins}min" if hours > 0 else f"{mins} min"
#
#     if battery_arrival_pct >= 25:
#         buffer_msg = f"You'll arrive with a comfortable {battery_arrival_pct:.0f}% battery buffer."
#     elif battery_arrival_pct >= 15:
#         buffer_msg = f"You'll arrive with {battery_arrival_pct:.0f}% battery — sufficient but plan ahead."
#     else:
#         buffer_msg = f"Arrival battery is low ({battery_arrival_pct:.0f}%) — consider charging more at stops."
#
#     if n == 0:
#         return (
#             f"Great news — your {vehicle_model} has enough range to complete "
#             f"{origin} → {destination} ({distance_km:.0f} km) without any charging stops. "
#             f"Total drive time: {time_str}. {buffer_msg}"
#         )
#
#     avg_power = sum(s.get("power_kw", 0) for s in charging_stops) / n
#     if avg_power >= 150:
#         power_msg = f"Selected stations offer high-power charging (avg {avg_power:.0f} kW) to minimize waiting time."
#     elif avg_power >= 50:
#         power_msg = f"Charging stations provide medium power (avg {avg_power:.0f} kW) — good balance of speed and availability."
#     else:
#         power_msg = f"Stations offer standard charging ({avg_power:.0f} kW) — plan for longer stops."
#
#     stop_word = "stop" if n == 1 else "stops"
#     cost_msg = f"Estimated total charging cost: €{estimated_cost_eur:.2f}." if estimated_cost_eur > 0 else ""
#
#     return (
#         f"This route is optimized with {n} charging {stop_word} for the "
#         f"{distance_km:.0f} km journey from {origin} to {destination} (total: {time_str}). "
#         f"{power_msg} {buffer_msg} {cost_msg}"
#     ).strip()