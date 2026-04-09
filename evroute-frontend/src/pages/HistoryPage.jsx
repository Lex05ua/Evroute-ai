import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../App.module.css';
import Header from '../components/Header';
import { getHistory, deleteRoute, markCompleted } from '../api';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this route from history?')) return;
    try {
      await deleteRoute(id);
      setHistory(h => h.filter(r => r.id !== id));
    } catch (e) { alert(e.message); }
  };

  const handleComplete = async (id) => {
    try {
      await markCompleted(id);
      setHistory(h => h.map(r => r.id === id ? {...r, status:'completed'} : r));
    } catch (e) { alert(e.message); }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  const fmtDuration = (min) => {
    if (!min) return '—';
    const h = Math.floor(min / 60); const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <>
      <Header />
      <div className={styles.dashboardBg}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Trip History</h1>
            <p style={{color:'#6B7280'}}>Your past and planned EV routes.</p>
          </div>

          {loading && <div style={{textAlign:'center',padding:'60px',color:'#6B7280'}}>Loading history…</div>}
          {error && <div style={{background:'#FEF2F2',color:'#DC2626',padding:'16px',borderRadius:'8px'}}>{error}</div>}

          {!loading && !error && history.length === 0 && (
            <div style={{textAlign:'center',padding:'80px',color:'#6B7280'}}>
              <div style={{fontSize:'48px',marginBottom:'16px'}}>🗺️</div>
              <p>No routes yet. <a onClick={() => navigate('/planner')} style={{color:'#2563EB',cursor:'pointer'}}>Plan your first route →</a></p>
            </div>
          )}

          {!loading && history.length > 0 && (
            <div className={styles.card} style={{padding:0,overflow:'hidden'}}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Route</th>
                    <th>Distance</th>
                    <th>Duration</th>
                    <th>Stops</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.created_at)}</td>
                      <td><strong>{r.origin}</strong> ➝ <strong>{r.destination}</strong></td>
                      <td>{r.total_distance_km ? `${r.total_distance_km.toFixed(0)} km` : '—'}</td>
                      <td>{fmtDuration(r.total_duration_min)}</td>
                      <td>{r.charging_stops_count > 0 ? `${r.charging_stops_count} stop${r.charging_stops_count !== 1 ? 's' : ''}` : 'Direct'}</td>
                      <td>{r.estimated_cost_eur ? `€${r.estimated_cost_eur.toFixed(2)}` : '—'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${r.status === 'completed' ? styles.completed : styles.planned}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                        {r.status === 'planned' && (
                          <button className={styles.btnView} onClick={() => handleComplete(r.id)}>✓ Done</button>
                        )}
                        <button className={styles.btnView} onClick={() => handleDelete(r.id)} style={{color:'#DC2626'}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryPage;
