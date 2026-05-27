import React, { useState, useEffect } from 'react';
import styles from '../App.module.css';
import Header from '../components/Header';
import { getMe, updateMe } from '../api';
import { useAuth } from '../AuthContext';

const VEHICLES = ['Tesla Model 3','Tesla Model Y','Audi e-tron','Porsche Taycan','VW ID.4','BMW iX3'];

const ProfilePage = () => {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ full_name:'', vehicle_model:'Tesla Model 3', battery_capacity_kwh:75, efficiency_wh_per_km:180 });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMe().then(u => {
      setEmail(u.email);
      setForm({ full_name: u.full_name, vehicle_model: u.vehicle_model, battery_capacity_kwh: u.battery_capacity_kwh, efficiency_wh_per_km: u.efficiency_wh_per_km });
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const handleSave = async () => {
  setSaving(true); setError(''); setSaved(false);
  try {
    const updated = await updateMe(form);
    localStorage.setItem('evroute_user', JSON.stringify(updated));
    refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  } catch (e) {
    setError(e.message);
  } finally {
    setSaving(false);
  }
};

  const initials = form.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'EV';

  if (loading) return <><Header /><div style={{textAlign:'center',padding:'80px',color:'#6B7280'}}>Loading…</div></>;

  return (
    <>
      <Header />
      <div className={styles.dashboardBg}>
        <div className={styles.container}>
          <div className={styles.card} style={{maxWidth:'800px',margin:'0 auto'}}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarLarge}>{initials}</div>
              <div>
                <h1 style={{margin:0,fontSize:'24px'}}>{form.full_name}</h1>
                <p style={{margin:'4px 0 0',color:'#6B7280'}}>{email}</p>
              </div>
            </div>

            {error && <div style={{background:'#FEF2F2',color:'#DC2626',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'14px'}}>{error}</div>}
            {saved && <div style={{background:'#ECFDF5',color:'#065F46',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'14px'}}>✅ Profile saved successfully!</div>}

            <div className={styles.profileForm}>
              <div>
                <label className={styles.inputLabel}>Full Name</label>
                <input className={styles.sidebarInput} value={form.full_name}
                  onChange={e => setForm(p => ({...p, full_name: e.target.value}))} />
              </div>
              <div>
                <label className={styles.inputLabel}>Email Address</label>
                <input className={styles.sidebarInput} value={email} readOnly style={{opacity:0.6}} />
              </div>
              <div>
                <label className={styles.inputLabel}>Primary Vehicle</label>
                <select className={styles.vehicleSelect} value={form.vehicle_model}
                  onChange={e => setForm(p => ({...p, vehicle_model: e.target.value}))}>
                  {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.inputLabel}>Battery Capacity (kWh)</label>
                <input className={styles.sidebarInput} type="number" value={form.battery_capacity_kwh}
                  onChange={e => setForm(p => ({...p, battery_capacity_kwh: Number(e.target.value)}))} />
              </div>
              <div>
                <label className={styles.inputLabel}>Efficiency (Wh/km)</label>
                <input className={styles.sidebarInput} type="number" value={form.efficiency_wh_per_km}
                  onChange={e => setForm(p => ({...p, efficiency_wh_per_km: Number(e.target.value)}))} />
              </div>
            </div>

            <div style={{marginTop:'30px',borderTop:'1px solid #E5E7EB',paddingTop:'20px',textAlign:'right'}}>
              <button onClick={handleSave} disabled={saving}
                className={styles.btnCalculate} style={{width:'auto',padding:'12px 30px',display:'inline-block',opacity:saving?0.7:1}}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
