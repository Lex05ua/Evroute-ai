import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (emoji, color) => new L.DivIcon({
  html: `<div style="background:${color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const startIcon    = makeIcon('🚗', '#16A34A');
const endIcon      = makeIcon('🏁', '#DC2626');
const chargingIcon = makeIcon('⚡', '#2563EB');

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

const RouteMap = ({ result, height = '420px' }) => {
  if (!result) return null;

  const {
    origin, destination,
    origin_lat, origin_lon,
    destination_lat, destination_lon,
    charging_stops = [],
    geometry,
    arrival_battery_pct,
    battery_level_pct,
  } = result;

  let routeLine = [];
  if (geometry && Array.isArray(geometry) && geometry.length > 1) {
    routeLine = geometry.map(pt => [pt[1], pt[0]]);
  } else {
    routeLine = [
      [origin_lat, origin_lon],
      ...charging_stops.map(s => [s.lat, s.lon]),
      [destination_lat, destination_lon],
    ];
  }

  const allPoints = [
    [origin_lat, origin_lon],
    ...charging_stops.map(s => [s.lat, s.lon]),
    [destination_lat, destination_lon],
  ];

  const center = [
    (origin_lat + destination_lat) / 2,
    (origin_lon + destination_lon) / 2,
  ];

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />
        {routeLine.length > 1 && (
          <Polyline positions={routeLine} color="#2563EB" weight={5} opacity={0.8} />
        )}
        <Marker position={[origin_lat, origin_lon]} icon={startIcon}>
          <Popup>
            <div style={{ minWidth: '160px' }}>
              <strong>🚗 Start</strong><br />
              <span style={{ fontSize: '13px' }}>{origin}</span><br />
              <span style={{ fontSize: '12px', color: '#16A34A' }}>Battery: <strong>{battery_level_pct}%</strong></span>
            </div>
          </Popup>
        </Marker>
        {charging_stops.map((stop, i) => (
          <Marker key={i} position={[stop.lat, stop.lon]} icon={chargingIcon}>
            <Popup>
              <div style={{ minWidth: '210px', fontSize: '13px' }}>
                <strong>⚡ Stop {i + 1}</strong><br />
                <strong>{stop.name}</strong><br />
                <span style={{ fontSize: '11px', color: '#6B7280' }}>{stop.address}</span>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                🔋 Arrive: <strong>{stop.battery_on_arrival_pct}%</strong> → After: <strong style={{ color: '#16A34A' }}>{stop.battery_after_charge_pct}%</strong><br />
                ⚡ Power: <strong>{stop.power_kw} kW</strong><br />
                🕒 Charge time: <strong>~{stop.charge_time_min} min</strong><br />
                💰 Cost: <strong>€{stop.cost_eur}</strong><br />
                🔌 {stop.available_connectors}/{stop.total_connectors} connectors available
              </div>
            </Popup>
          </Marker>
        ))}
        <Marker position={[destination_lat, destination_lon]} icon={endIcon}>
          <Popup>
            <div style={{ minWidth: '160px' }}>
              <strong>🏁 Destination</strong><br />
              <span style={{ fontSize: '13px' }}>{destination}</span><br />
              <span style={{ fontSize: '12px', color: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A' }}>
                Arrival battery: <strong>{arrival_battery_pct}%</strong>
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default RouteMap;