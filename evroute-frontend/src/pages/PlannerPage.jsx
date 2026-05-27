import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../App.module.css';
import Header from '../components/Header';
import { planRoute } from '../api';
import { useAuth } from '../AuthContext';

const VEHICLES = [
  { label: 'Tesla Model 3', battery: 75, efficiency: 150 },
  { label: 'Tesla Model Y', battery: 75, efficiency: 160 },
  { label: 'Audi e-tron', battery: 95, efficiency: 220 },
  { label: 'Porsche Taycan', battery: 93, efficiency: 200 },
  { label: 'VW ID.4', battery: 77, efficiency: 170 },
  { label: 'BMW iX3', battery: 74, efficiency: 175 },
];

const PlannerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const profileVehicleIdx = VEHICLES.findIndex(v => v.label === user?.vehicle_model);
  const [vehicleIdx, setVehicleIdx] = useState(profileVehicleIdx >= 0 ? profileVehicleIdx : 0);
  const [batteryPct, setBatteryPct] = useState(80);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Обновляем авто когда меняются данные пользователя
  useEffect(() => {
    if (user?.vehicle_model) {
      const idx = VEHICLES.findIndex(v => v.label === user.vehicle_model);
      if (idx >= 0) setVehicleIdx(idx);
    }
  }, [user]);

  const selectedVehicle = VEHICLES[vehicleIdx];


  const batteryKwh = (user?.vehicle_model === selectedVehicle.label && user?.battery_capacity_kwh)
    ? user.battery_capacity_kwh
    : selectedVehicle.battery;
  const efficiency = (user?.vehicle_model === selectedVehicle.label && user?.efficiency_wh_per_km)
    ? user.efficiency_wh_per_km
    : selectedVehicle.efficiency;

  const rangeKm = Math.round((batteryKwh * batteryPct / 100) / (efficiency / 1000));

  const handleCalculate = async () => {
    setError('');
    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both origin and destination.');
      return;
    }
    setLoading(true);
    try {
      const result = await planRoute({
        origin: origin.trim(),
        destination: destination.trim(),
        battery_level_pct: batteryPct,
        vehicle_model: selectedVehicle.label,
        battery_capacity_kwh: batteryKwh,
        efficiency_wh_per_km: efficiency,
      });
      sessionStorage.setItem('evroute_result', JSON.stringify(result));
      navigate('/result');
    } catch (e) {
      setError(e.message || 'Route calculation failed. Check your API keys.');
    } finally {
      setLoading(false);
    }
  };

  const quickRoute = (o, d) => { setOrigin(o); setDestination(d); };

  return (
    <>
      <Header />
      <div className={styles.dashboardBg}>
        <div className={styles.container}>
          <div className={styles.dashboardGrid}>


            <div className={styles.sidebar}>

              {/* Route Planning */}
              <div className={styles.card}>
                <div className={styles.cardTitle}>
                  <span className={styles.cardTitleIcon}>📍</span> Route Planning
                </div>

                {error && (
                  <div style={{
                    background: '#FEF2F2', color: '#DC2626',
                    padding: '10px 14px', borderRadius: '8px',
                    marginBottom: '12px', fontSize: '13px',
                  }}>
                    {error}
                  </div>
                )}

                <label className={styles.inputLabel}>Starting Point</label>
                <input
                  className={styles.sidebarInput}
                  placeholder="Enter origin city or address"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                />

                <label className={styles.inputLabel}>Destination</label>
                <input
                  className={styles.sidebarInput}
                  placeholder="Enter destination city or address"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCalculate()}
                />

                <button
                  onClick={handleCalculate}
                  className={styles.btnCalculate}
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
                >
                  {loading ? '⏳ Calculating…' : '⚡ Calculate Route'}
                </button>

                <div style={{ marginTop: '24px' }}>
                  <div className={styles.inputLabel} style={{ color: '#6B7280', marginBottom: '12px' }}>
                    Quick Routes
                  </div>
                  <div
                    style={{ fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', color: '#2563EB' }}
                    onClick={() => quickRoute('Bratislava', 'Vienna')}
                  >
                    Bratislava → Vienna
                  </div>
                  <div
                    style={{ fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', color: '#2563EB' }}
                    onClick={() => quickRoute('Bratislava', 'Košice')}
                  >
                    Bratislava → Košice
                  </div>
                  <div
                    style={{ fontSize: '13px', padding: '8px 0', cursor: 'pointer', color: '#2563EB' }}
                    onClick={() => quickRoute('Prague', 'Brno')}
                  >
                    Prague → Brno
                  </div>
                </div>
              </div>

              {/* Vehicle Settings */}
              <div className={styles.card}>
                <div className={styles.cardTitle}>
                  <span className={styles.cardTitleIcon}>🚗</span> Vehicle Settings
                </div>

                <div className={styles.inputLabel}>Vehicle Model</div>
                <select
                  className={styles.vehicleSelect}
                  value={vehicleIdx}
                  onChange={e => setVehicleIdx(Number(e.target.value))}
                >
                  {VEHICLES.map((v, i) => (
                    <option key={i} value={i}>{v.label}</option>
                  ))}
                </select>

                <div className={styles.statsGrid}>
                  <div className={`${styles.statBox} ${styles.statBoxBlue}`}>
                    <div className={`${styles.statLabel} ${styles.statLabelBlue}`}>
                      <span>🔋</span> Battery
                    </div>
                    <div className={styles.statValue}>{batteryKwh} kWh</div>
                  </div>
                  <div className={`${styles.statBox} ${styles.statBoxGreen}`}>
                    <div className={`${styles.statLabel} ${styles.statLabelGreen}`}>
                      <span>⚡</span> Efficiency
                    </div>
                    <div className={styles.statValue}>{efficiency} Wh/km</div>
                  </div>
                </div>


                {user?.vehicle_model === selectedVehicle.label && (
                  <div style={{
                    fontSize: '11px', color: '#16A34A', marginBottom: '8px',
                    background: '#ECFDF5', padding: '6px 10px', borderRadius: '6px',
                  }}>
                    ✓ Using your profile settings
                  </div>
                )}

                <div className={styles.batteryLabel}>
                  <span>Current Battery Level</span>
                  <strong>{batteryPct}%</strong>
                </div>
                <input
                  type="range" min="5" max="100" value={batteryPct}
                  onChange={e => setBatteryPct(Number(e.target.value))}
                  style={{ width: '100%', margin: '8px 0', accentColor: '#2563EB' }}
                />
                <div className={styles.rangeLabels}>
                  <span>Est. Range</span>
                  <span style={{ color: rangeKm < 100 ? '#DC2626' : '#374151' }}>~{rangeKm} km</span>
                </div>

                <div className={styles.chargeStatus}>
                  <span style={{ color: '#6B7280' }}>Charge Status</span>
                  <span className={styles.statusReady} style={{
                    color: batteryPct < 20 ? '#DC2626' : batteryPct < 50 ? '#F59E0B' : '#16A34A',
                  }}>
                    {batteryPct < 20 ? '⚠️ Very Low' : batteryPct < 50 ? 'Low Battery' : 'Ready to Drive'}
                  </span>
                </div>
                <div className={styles.chargeBar}>
                  <div
                    className={styles.chargeBarFill}
                    style={{
                      width: `${batteryPct}%`,
                      background: batteryPct < 20 ? '#DC2626' : batteryPct < 50 ? '#F59E0B' : '#16A34A',
                    }}
                  />
                </div>
              </div>
            </div>


            <div className={styles.mainArea}>
              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
                  <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Calculating your route…</h2>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>
                    Fetching charging stations and running AI analysis
                  </p>
                </div>
              ) : (
                <div>
                  <div className={styles.emptyStateIcon}>🗺️</div>
                  <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Plan Your EV Journey</h2>
                  <p style={{ color: '#6B7280', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                    Enter your origin and destination to get AI-optimized route
                    recommendations with charging station availability.
                  </p>
                  {user && (
                    <div style={{ marginTop: '20px', fontSize: '13px', color: '#9CA3AF' }}>
                      Logged in as <strong style={{ color: '#374151' }}>{user.full_name}</strong>
                      {' · '}{user.vehicle_model}
                      {' · '}{batteryKwh} kWh
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default PlannerPage;