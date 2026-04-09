import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../App.module.css';
import Header from '../components/Header';

const ResultPage = () => {
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
    vehicle_model, battery_level_pct,
    charging_stops, ai_recommendation,
  } = result;

  const fmtHours = (min) => {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <>
      <Header />
      <div className={styles.dashboardBg}>
        <div className={styles.container}>
          <div className={styles.dashboardGrid}>

            {/* LEFT SIDEBAR */}
            <div className={styles.sidebar}>
              <div className={styles.card}>
                <div className={styles.cardTitle}><span className={styles.cardTitleIcon}>📍</span> Route Planning</div>
                <div className={styles.inputLabel}>Starting Point</div>
                <input className={styles.sidebarInput} defaultValue={origin} readOnly />
                <div className={styles.inputLabel}>Destination</div>
                <input className={styles.sidebarInput} defaultValue={destination} readOnly />
                <Link to="/planner" className={styles.btnCalculate} style={{textDecoration:'none',textAlign:'center',display:'block'}}>
                  ⚡ New Route
                </Link>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}><span className={styles.cardTitleIcon}>🚗</span> Vehicle Settings</div>
                <div className={styles.inputLabel}>Model</div>
                <div style={{fontSize:'14px',fontWeight:'600',padding:'8px 0'}}>{vehicle_model}</div>
                <div className={styles.batteryLabel}><span>Battery at Start</span><strong>{battery_level_pct}%</strong></div>
                <div className={styles.batterySliderTrack}>
                  <div className={styles.batterySliderFill} style={{width:`${battery_level_pct}%`}}></div>
                </div>
                <div className={styles.batteryLabel} style={{marginTop:'8px'}}>
                  <span>Arrival Battery</span><strong style={{color: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A'}}>{arrival_battery_pct}%</strong>
                </div>
              </div>
            </div>

            {/* RIGHT MAIN */}
            <div className={styles.mainArea} style={{display:'block',textAlign:'left',padding:0,overflow:'hidden',minHeight:'auto'}}>

              <div className={styles.resultHeader}>
                <span>✨</span> AI-Optimized Route: {charging_stops.length} charging stop{charging_stops.length !== 1 ? 's' : ''} selected
              </div>

              <div className={styles.resultBody}>
                {/* Route summary */}
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
                  <div>
                    <div style={{fontSize:'18px',fontWeight:'700'}}>{origin}</div>
                    <div style={{color:'#6B7280',fontSize:'14px'}}>↓ AI-optimized route</div>
                    <div style={{fontSize:'18px',fontWeight:'700'}}>{destination}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'24px',fontWeight:'700'}}>{total_distance_km.toFixed(0)} km</div>
                    <div style={{color:'#6B7280'}}>{fmtHours(total_time_min)} total</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className={styles.routeStatsRow}>
                  <div className={styles.routeStatCard}>
                    <div style={{fontSize:'12px',color:'#6B7280'}}>⏱️ Drive Time</div>
                    <div style={{fontWeight:'600'}}>{fmtHours(drive_time_min)}</div>
                  </div>
                  <div className={styles.routeStatCard}>
                    <div style={{fontSize:'12px',color:'#6B7280'}}>⚡ Charge Time</div>
                    <div style={{fontWeight:'600'}}>{fmtHours(charging_time_min)}</div>
                  </div>
                  <div className={styles.routeStatCard}>
                    <div style={{fontSize:'12px',color:'#6B7280'}}>🔋 Arrival</div>
                    <div style={{fontWeight:'600',color: arrival_battery_pct < 15 ? '#DC2626' : '#16A34A'}}>{arrival_battery_pct}%</div>
                  </div>
                  <div className={styles.routeStatCard}>
                    <div style={{fontSize:'12px',color:'#6B7280'}}>💰 Est. Cost</div>
                    <div style={{fontWeight:'600'}}>€{estimated_cost_eur.toFixed(2)}</div>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{fontSize:'14px',fontWeight:'600',marginBottom:'10px'}}>Route Overview</div>
                <div className={styles.timelineContainer}>
                  <div className={styles.timelineLine}></div>
                  <div className={styles.timelinePoint} title="Start"></div>
                  {charging_stops.map((_, i) => (
                    <div key={i} className={`${styles.timelinePoint} ${styles.stop}`} title={`Stop ${i+1}`}></div>
                  ))}
                  <div className={`${styles.timelinePoint} ${styles.dest}`} title="End"></div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'#9CA3AF',marginBottom:'30px'}}>
                  <span>Start ({battery_level_pct}%)</span>
                  {charging_stops.map((s, i) => (
                    <span key={i}>{s.distance_from_start_km.toFixed(0)} km</span>
                  ))}
                  <span>Arrival ({arrival_battery_pct}%)</span>
                </div>

                {/* AI Recommendation */}
                <div className={styles.aiBox}>
                  <div style={{fontSize:'20px'}}>🤖</div>
                  <div>
                    <strong>AI Recommendation</strong><br/>
                    {ai_recommendation}
                  </div>
                </div>

                {/* Link to full details */}
                <Link to="/full-route" className={styles.btnCalculate} style={{marginBottom:'40px',textDecoration:'none',display:'block',textAlign:'center'}}>
                  View Full Route Details →
                </Link>

                {/* Charging Stops */}
                {charging_stops.length > 0 && (
                  <>
                    <div style={{fontSize:'14px',fontWeight:'600',marginBottom:'15px'}}>
                      ⚡ Charging Stops <span className={styles.stopTag}>{charging_stops.length} Stop{charging_stops.length !== 1 ? 's' : ''}</span>
                    </div>
                    {charging_stops.map((stop, i) => (
                      <div key={i} className={styles.stopCard}>
                        <div className={styles.stopHeader}>
                          <span>{stop.name}</span>
                          <span>{stop.distance_from_start_km.toFixed(0)} km <span style={{fontSize:'11px',fontWeight:400,color:'#6B7280'}}>from start</span></span>
                        </div>
                        <div className={styles.stopTag}>Stop {i + 1}</div>
                        <div style={{fontSize:'12px',color:'#6B7280',margin:'4px 0'}}>{stop.address}</div>
                        <div style={{marginTop:'10px',fontSize:'13px',display:'flex',gap:'20px',flexWrap:'wrap'}}>
                          <div><strong>{stop.power_kw.toFixed(0)} kW</strong><br/><span style={{color:'#6B7280'}}>Power</span></div>
                          <div><strong>~{stop.charge_time_min.toFixed(0)} min</strong><br/><span style={{color:'#6B7280'}}>Time</span></div>
                          <div><strong>€{stop.cost_eur.toFixed(2)}</strong><br/><span style={{color:'#6B7280'}}>Cost</span></div>
                          <div><strong style={{color:'#16A34A'}}>{stop.available_connectors}/{stop.total_connectors}</strong><br/><span style={{color:'#6B7280'}}>Available</span></div>
                          <div><strong>{stop.battery_on_arrival_pct}% → {stop.battery_after_charge_pct}%</strong><br/><span style={{color:'#6B7280'}}>Battery</span></div>
                        </div>
                        {stop.connection_types.length > 0 && (
                          <div style={{marginTop:'8px',fontSize:'11px',color:'#6B7280'}}>
                            🔌 {stop.connection_types.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {charging_stops.length === 0 && (
                  <div style={{background:'#ECFDF5',border:'1px solid #6EE7B7',borderRadius:'12px',padding:'16px',fontSize:'14px',color:'#065F46'}}>
                    ✅ Great news! Your vehicle has enough range to complete this trip without any charging stops.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultPage;
