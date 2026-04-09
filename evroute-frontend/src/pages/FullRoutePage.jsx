import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../App.module.css';

const FullRoutePage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('evroute_result');
    if (!raw) { navigate('/planner'); return; }
    setResult(JSON.parse(raw));
  }, []);

  if (!result) return null;

  const { origin, destination, total_distance_km, drive_time_min, charging_time_min,
          arrival_battery_pct, charging_stops, route_steps, battery_level_pct,
          estimated_cost_eur } = result;

  const fmtHours = (min) => {
    const h = Math.floor(min / 60); const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <div style={{background:'#F9FAFB',minHeight:'100vh',padding:'20px'}}>
      <div className={styles.container}>

        <div className={styles.topBar}>
          <Link to="/result" className={styles.backLink}>← Back to Dashboard</Link>
          <div>
            <button className={styles.actionBtn} onClick={() => window.print()}>Print</button>
            <button className={styles.actionBtn} onClick={() => {
              const text = `EVRoute AI — ${origin} → ${destination}\nDistance: ${total_distance_km.toFixed(0)} km\nDrive time: ${fmtHours(drive_time_min)}\nCharging stops: ${charging_stops.length}\nArrival battery: ${arrival_battery_pct}%\nEst. cost: €${estimated_cost_eur.toFixed(2)}`;
              navigator.clipboard?.writeText(text);
            }}>Copy Summary</button>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsContainer}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,marginBottom:'5px'}}>Route Details</div>
            <div style={{fontSize:'13px',color:'#6B7280'}}>📍 {origin} → 📍 {destination}</div>
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
            <div className={styles.statsValue} style={{color: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A'}}>{arrival_battery_pct}%</div>
          </div>
          <button className={styles.btnGreen} style={{height:'44px',whiteSpace:'nowrap'}}
            onClick={() => alert('Navigation feature coming soon!')}>
            Start Navigation
          </button>
        </div>

        <div className={styles.detailsLayout}>

          {/* LEFT — Turn by turn */}
          <div>
            <div className={styles.card} style={{padding:0,overflow:'hidden',marginBottom:'24px'}}>
              <div style={{padding:'20px',borderBottom:'1px solid #E5E7EB',fontWeight:600}}>Route Map</div>
              <div style={{width:'100%',height:'300px',background:'linear-gradient(135deg,#EFF6FF 0%,#ECFDF5 100%)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
                <div style={{fontSize:'48px'}}>🗺️</div>
                <div style={{fontSize:'14px',color:'#6B7280',textAlign:'center'}}>
                  {origin} → {destination}<br/>
                  <span style={{fontSize:'12px'}}>{total_distance_km.toFixed(0)} km · {charging_stops.length} stop{charging_stops.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Turn-by-Turn Directions</div>
              <div className={styles.turnList}>
                {route_steps && route_steps.length > 0 ? (
                  route_steps.slice(0, 20).map((step, i) => (
                    <div key={i} className={styles.turnItem}>
                      <div className={styles.turnNumber}>{step.step_number}</div>
                      <div>
                        <div className={styles.turnText}>{step.instruction}</div>
                        <div className={styles.turnMeta}>{step.distance_km.toFixed(1)} km · {step.duration_min.toFixed(0)} min</div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback if no steps (short route or API limitation)
                  [
                    { n:1, text:`Start at ${origin}`, meta:'0 km' },
                    ...charging_stops.map((s, i) => ({ n: i+2, text:`Stop at ${s.name}`, meta:`${s.distance_from_start_km.toFixed(0)} km from start` })),
                    { n: charging_stops.length + 2, text:`Arrive at ${destination}`, meta:`${total_distance_km.toFixed(0)} km` },
                  ].map((step, i) => (
                    <div key={i} className={styles.turnItem}>
                      <div className={styles.turnNumber}>{step.n}</div>
                      <div>
                        <div className={styles.turnText}>{step.text}</div>
                        <div className={styles.turnMeta}>{step.meta}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Charging stops + Battery timeline */}
          <div>
            <div className={styles.rightCard}>
              <div className={styles.rightCardTitle}>Charging Stops</div>
              {charging_stops.length === 0 ? (
                <div style={{fontSize:'14px',color:'#6B7280',padding:'12px 0'}}>✅ No stops needed — sufficient range!</div>
              ) : charging_stops.map((stop, i) => (
                <div key={i} className={styles.stopCard} style={{marginBottom:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',fontWeight:600}}>
                    <span>{stop.name}</span>
                    <span style={{background:'#DBEAFE',color:'#2563EB',padding:'2px 6px',borderRadius:'4px',fontSize:'11px'}}>Stop {i+1}</span>
                  </div>
                  <div style={{fontSize:'12px',color:'#6B7280',marginTop:'5px'}}>📍 {stop.address}</div>
                  <div style={{fontSize:'12px',marginTop:'8px'}}>⚡ {stop.power_kw.toFixed(0)} kW · 🕒 ~{stop.charge_time_min.toFixed(0)} min · 💰 €{stop.cost_eur.toFixed(2)}</div>
                  <div style={{fontSize:'12px',color:'#16A34A',marginTop:'4px'}}>{stop.available_connectors}/{stop.total_connectors} connectors available</div>
                  <div style={{fontSize:'11px',color:'#6B7280',marginTop:'4px'}}>🔋 {stop.battery_on_arrival_pct}% → {stop.battery_after_charge_pct}%</div>
                </div>
              ))}
            </div>

            <div className={styles.rightCard}>
              <div className={styles.rightCardTitle}>Battery Timeline</div>
              <div className={styles.timelineRow}>
                <span>🔋 Start</span><span style={{fontWeight:600}}>{battery_level_pct}%</span>
              </div>
              {charging_stops.map((s, i) => (
                <React.Fragment key={i}>
                  <div className={styles.timelineRow}>
                    <span>📍 Arrive Stop {i+1}</span><span style={{color:'#DC2626',fontWeight:600}}>{s.battery_on_arrival_pct}%</span>
                  </div>
                  <div className={styles.timelineRow}>
                    <span>⚡ After Stop {i+1}</span><span style={{color:'#16A34A',fontWeight:600}}>{s.battery_after_charge_pct}%</span>
                  </div>
                </React.Fragment>
              ))}
              <div className={styles.timelineRow}>
                <span>📍 Arrival</span>
                <span style={{fontWeight:600,color: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A'}}>{arrival_battery_pct}%</span>
              </div>
              <div style={{marginTop:'16px',paddingTop:'16px',borderTop:'1px solid #E5E7EB',fontSize:'13px',color:'#6B7280'}}>
                Total charging cost: <strong style={{color:'#111827'}}>€{estimated_cost_eur.toFixed(2)}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FullRoutePage;
