import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../App.module.css';

// --- STEP 1 ---
export const Onboarding1 = () => {
    const navigate = useNavigate();
    return (
        <div className={styles.authContainer}>
            <div className={styles.progressHeader}><span>Step 1 of 3</span><span>33% Complete</span></div>
            <div className={styles.progressBarContainer}><div className={styles.progressBarFill} style={{width: '33%'}}></div></div>
            <div className={styles.authCard}>
                <div className={styles.authIcon}>👋</div>
                <h2 style={{marginBottom:'10px'}}>Welcome!</h2>
                <p style={{color:'#6B7280', marginBottom:'30px'}}>Let's start with your name.</p>
                <div style={{textAlign:'left'}}>
                    <label className={styles.inputLabel}>What's your name?</label>
                    <input className={styles.inputField} placeholder="Enter your name" />
                </div>
                <button onClick={() => navigate('/onboarding/2')} className={`${styles.btnGreen} ${styles.btnFull}`}>Continue →</button>
            </div>
        </div>
    );
};

// --- STEP 2 ---
export const Onboarding2 = () => {
    const navigate = useNavigate();
    return (
        <div className={styles.authContainer}>
            <div className={styles.progressHeader}><span>Step 2 of 3</span><span>66% Complete</span></div>
            <div className={styles.progressBarContainer}><div className={styles.progressBarFill} style={{width: '66%'}}></div></div>
            <div className={styles.authCard}>
                <div className={styles.authIcon}>🚙</div>
                <h2 style={{marginBottom:'10px'}}>Your Vehicle</h2>
                <p style={{color:'#6B7280', marginBottom:'30px'}}>Select your EV model for accurate routing.</p>
                <div style={{textAlign:'left'}}>
                    <label className={styles.inputLabel}>Vehicle Model</label>
                    <select className={styles.inputField}>
                        <option>Tesla Model 3</option>
                        <option>Audi e-tron</option>
                        <option>Porsche Taycan</option>
                    </select>
                </div>
                <div className={styles.buttonsRow}>
                    <button onClick={() => navigate('/onboarding/1')} className={styles.btnBack}>← Back</button>
                    <button onClick={() => navigate('/onboarding/3')} className={`${styles.btnGreen} ${styles.btnFull}`} style={{flex:1}}>Continue →</button>
                </div>
            </div>
        </div>
    );
};

// --- STEP 3 ---
export const Onboarding3 = () => {
    const navigate = useNavigate();
    return (
        <div className={styles.authContainer}>
            <div className={styles.progressHeader}><span>Step 3 of 3</span><span>100% Complete</span></div>
            <div className={styles.progressBarContainer}><div className={styles.progressBarFill} style={{width: '100%'}}></div></div>
            <div className={styles.authCard}>
                <div className={styles.authIcon}>📍</div>
                <h2 style={{marginBottom:'10px'}}>Set Your Home Base</h2>
                <p style={{color:'#6B7280', marginBottom:'30px', fontSize:'14px'}}>We'll use this as your default starting point for routes.</p>
                <div style={{textAlign:'left'}}>
                    <label className={styles.inputLabel}>Home Location</label>
                    <input className={styles.inputField} placeholder="Enter city or address" />
                </div>
                <div className={styles.infoBox}>
                    <span style={{fontSize:'16px'}}>💡</span>
                    <span>We'll remember nearby charging stations and your favorite routes from this location.</span>
                </div>
                <div className={styles.buttonsRow}>
                    <button onClick={() => navigate('/onboarding/2')} className={styles.btnBack}>← Back</button>
                    <button onClick={() => navigate('/planner')} className={`${styles.btnGreen} ${styles.btnFull}`} style={{flex:1}}>Get Started →</button>
                </div>
            </div>
        </div>
    );
};