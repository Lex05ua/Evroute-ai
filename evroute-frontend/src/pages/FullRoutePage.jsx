import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../App.module.css';
import RouteMap from '../components/RouteMap.jsx';

const FullRoutePage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('evroute_result');
    if (!raw) { navigate('/planner'); return; }
    setResult(JSON.parse(raw));
  }, []);

  if (!result) return null;

  const {
    origin, destination,
    total_distance_km, drive_time_min, charging_time_min, total_time_min,
    arrival_battery_pct, estimated_cost_eur,
    battery_level_pct, vehicle_model,
    charging_stops = [],
    route_steps = [],
  } = result;

  const fmtHours = (min) => {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const handleStartNavigation = () => {
    const origin_enc = encodeURIComponent(origin);
    const dest_enc = encodeURIComponent(destination);
    const waypoints = charging_stops.map(s => `${s.lat},${s.lon}`).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin_enc}&destination=${dest_enc}&travelmode=driving`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const text = [
      `EVRoute AI — ${origin} → ${destination}`,
      `Distance: ${total_distance_km.toFixed(0)} km`,
      `Drive time: ${fmtHours(drive_time_min)}`,
      `Charging time: ${fmtHours(charging_time_min)}`,
      `Total time: ${fmtHours(total_time_min)}`,
      `Charging stops: ${charging_stops.length}`,
      `Arrival battery: ${arrival_battery_pct}%`,
      `Est. charging cost: €${estimated_cost_eur.toFixed(2)}`,
      charging_stops.length > 0
        ? '\nStops:\n' + charging_stops.map((s, i) => `  Stop ${i + 1}: ${s.name} — ${s.power_kw} kW, ~${s.charge_time_min} min, €${s.cost_eur}`).join('\n')
        : '',
    ].join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
    alert('Route summary copied to clipboard!');
  };

  const directions = route_steps && route_steps.length > 0
    ? route_steps.slice(0, 25)
    : [
        { step_number: 1, instruction: `Start at ${origin}`, distance_km: 0, duration_min: 0 },
        ...charging_stops.map((s, i) => ({
          step_number: i + 2,
          instruction: `⚡ Stop ${i + 1}: Charge at ${s.name} (~${s.charge_time_min} min)`,
          distance_km: s.distance_from_start_km,
          duration_min: s.charge_time_min,
        })),
        { step_number: charging_stops.length + 2, instruction: `Arrive at ${destination}`, distance_km: total_distance_km, duration_min: 0 },
      ];

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', padding: '20px' }}>
      <div className={styles.container}>

        <div className={styles.topBar}>
          <Link to="/result" className={styles.backLink}>← Back to Dashboard</Link>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.actionBtn} onClick={() => window.print()}>Print</button>
            <button className={styles.actionBtn} onClick={handleCopySummary}>Copy Summary</button>
          </div>
        </div>

        <div className={styles.statsContainer}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '5px' }}>Route Details</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>📍 {origin} → 📍 {destination}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{vehicle_model}</div>
          </div>
          <div className={styles.statsBlock}>
            <div className={styles.statsLabel}>Total Distance</div>
            <div className={styles.statsValue}>{total_distance_km.toFixed(0)} km</div>
          </div>
          <div className={styles.statsBlock}>
            <div className={styles.statsLabel}>Drive Time</div>
            <div className={styles.statsValue}>{fmtHours(drive_time_min)}</div>
          </div>
          <div className={styles.statsBlock}>
            <div className={styles.statsLabel}>Charging Time</div>
            <div className={styles.statsValue}>{fmtHours(charging_time_min)}</div>
          </div>
          <div className={styles.statsBlock}>
            <div className={styles.statsLabel}>Arrival Charge</div>
            <div className={styles.statsValue} style={{ color: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A' }}>{arrival_battery_pct}%</div>
          </div>
          <button className={styles.btnGreen} style={{ height: '44px', whiteSpace: 'nowrap' }} onClick={handleStartNavigation}>
            🧭 Open in Google Maps
          </button>
        </div>

        <div className={styles.detailsLayout}>

          <div>
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', fontWeight: 600 }}>🗺️ Route Map</div>
              <RouteMap result={result} height="350px" />
              <div style={{ padding: '8px 16px', fontSize: '11px', color: '#9CA3AF' }}>
                Click on markers for details · Scroll to zoom · Drag to pan
              </div>
            </div>
          </div>

          <div>
            <div className={styles.rightCard}>
              <div className={styles.rightCardTitle}>⚡ Charging Stops</div>
              {charging_stops.length === 0 ? (
                <div style={{ fontSize: '14px', color: '#065F46', background: '#ECFDF5', padding: '12px', borderRadius: '8px' }}>
                  ✅ No stops needed — sufficient range!
                </div>
              ) : charging_stops.map((stop, i) => (
                <div key={i} className={styles.stopCard} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ flex: 1, marginRight: '8px' }}>{stop.name}</span>
                    <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap' }}>Stop {i + 1}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>📍 {stop.address}</div>
                  <div style={{ fontSize: '12px', marginTop: '8px', lineHeight: '1.8' }}>
                    ⚡ <strong>{stop.power_kw.toFixed(0)} kW</strong> &nbsp;·&nbsp;
                    🕒 <strong>~{stop.charge_time_min.toFixed(0)} min</strong> &nbsp;·&nbsp;
                    💰 <strong>€{stop.cost_eur.toFixed(2)}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>🔌 {stop.available_connectors}/{stop.total_connectors} connectors available</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    🔋 {stop.battery_on_arrival_pct}% <span style={{ color: '#9CA3AF' }}>→</span> <span style={{ color: '#16A34A', fontWeight: 600 }}>{stop.battery_after_charge_pct}%</span>
                  </div>
                  {stop.connection_types && stop.connection_types.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{stop.connection_types.join(' · ')}</div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.rightCard}>
              <div className={styles.rightCardTitle}>🔋 Battery Timeline</div>
              <div className={styles.timelineRow}>
                <span>🚗 Start</span>
                <span style={{ fontWeight: 600 }}>{battery_level_pct}%</span>
              </div>
              <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', margin: '4px 0 12px' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: '#16A34A', width: `${battery_level_pct}%` }} />
              </div>
              {charging_stops.map((s, i) => (
                <React.Fragment key={i}>
                  <div className={styles.timelineRow}>
                    <span>📍 Arrive Stop {i + 1}</span>
                    <span style={{ fontWeight: 600, color: s.battery_on_arrival_pct < 15 ? '#DC2626' : '#F59E0B' }}>{s.battery_on_arrival_pct}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', margin: '4px 0 8px' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: s.battery_on_arrival_pct < 15 ? '#DC2626' : '#F59E0B', width: `${s.battery_on_arrival_pct}%` }} />
                  </div>
                  <div className={styles.timelineRow}>
                    <span>⚡ After Stop {i + 1}</span>
                    <span style={{ fontWeight: 600, color: '#16A34A' }}>{s.battery_after_charge_pct}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', margin: '4px 0 12px' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: '#16A34A', width: `${s.battery_after_charge_pct}%` }} />
                  </div>
                </React.Fragment>
              ))}
              <div className={styles.timelineRow}>
                <span>🏁 Arrival</span>
                <span style={{ fontWeight: 600, color: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A' }}>{arrival_battery_pct}%</span>
              </div>
              <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', margin: '4px 0 16px' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A', width: `${arrival_battery_pct}%` }} />
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid #E5E7EB', fontSize: '13px', color: '#6B7280' }}>
                Total charging cost: <strong style={{ color: '#111827' }}>€{estimated_cost_eur.toFixed(2)}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FullRoutePage;