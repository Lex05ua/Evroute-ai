import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../App.module.css';
import { login, register } from '../api';
import { useAuth } from '../AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(form);
      refreshUser();
      navigate('/planner');
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authContent}>
        <div className={styles.authLogo}><div className={styles.logoIcon}>⚡</div> EVRoute AI</div>
        <h2 className={styles.authTitle}>Welcome back</h2>
        <p className={styles.authSubtitle}>Sign in to continue planning your routes</p>
        <div className={styles.authCardClassic}>
          {error && <div style={{background:'#FEF2F2',color:'#DC2626',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'14px'}}>{error}</div>}
          <div className={styles.inputGroupClassic}>
            <label className={styles.inputLabelClassic}>Email Address</label>
            <input className={styles.inputClassic} type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
          </div>
          <div className={styles.inputGroupClassic}>
            <label className={styles.inputLabelClassic}>Password</label>
            <input className={styles.inputClassic} type="password" placeholder="Enter your password"
              value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button onClick={handleSubmit} className={styles.btnGradient} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
          <div className={styles.authFooter}>
            Don't have an account? <Link to="/signup" className={styles.authLink}>Sign Up</Link>
          </div>
        </div>
        <div className={styles.backHome}><Link to="/">← Back to Home</Link></div>
      </div>
    </div>
  );
};

export const SignupPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!form.full_name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password });
      refreshUser();
      navigate('/planner');
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm(p => ({...p, [field]: e.target.value})) });

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authContent}>
        <div className={styles.authLogo}><div className={styles.logoIcon}>⚡</div> EVRoute AI</div>
        <h2 className={styles.authTitle}>Create your account</h2>
        <p className={styles.authSubtitle}>Start planning your EV routes with AI</p>
        <div className={styles.authCardClassic}>
          {error && <div style={{background:'#FEF2F2',color:'#DC2626',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'14px'}}>{error}</div>}
          <div className={styles.inputGroupClassic}>
            <label className={styles.inputLabelClassic}>Full Name</label>
            <input className={styles.inputClassic} placeholder="Enter your name" {...f('full_name')} />
          </div>
          <div className={styles.inputGroupClassic}>
            <label className={styles.inputLabelClassic}>Email Address</label>
            <input className={styles.inputClassic} type="email" placeholder="your@email.com" {...f('email')} />
          </div>
          <div className={styles.inputGroupClassic}>
            <label className={styles.inputLabelClassic}>Password</label>
            <input className={styles.inputClassic} type="password" placeholder="At least 6 characters" {...f('password')} />
          </div>
          <div className={styles.inputGroupClassic}>
            <label className={styles.inputLabelClassic}>Confirm Password</label>
            <input className={styles.inputClassic} type="password" placeholder="Confirm your password" {...f('confirm')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button onClick={handleSubmit} className={styles.btnGradient} style={{marginTop:'10px'}} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
          <div className={styles.authFooter}>
            Already have an account? <Link to="/login" className={styles.authLink}>Sign In</Link>
          </div>
        </div>
        <div className={styles.backHome}><Link to="/">← Back to Home</Link></div>
      </div>
    </div>
  );
};
