import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from '../App.module.css';
import { useAuth } from '../AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getClass = (path, extraPaths = []) => {
    const isActive = location.pathname === path || extraPaths.includes(location.pathname);
    return isActive ? styles.navBtnBlack : styles.navLink;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <Link to="/planner" className={styles.logo}>
            <div className={styles.logoIcon}>⚡</div>
            <div style={{display:'flex',flexDirection:'column',lineHeight:'1.1'}}>
              <span>EVRoute AI</span>
              <span style={{fontSize:'10px',color:'#6B7280',fontWeight:400}}>AI-Powered Route Planning</span>
            </div>
          </Link>
          <div className={styles.nav}>
            <Link to="/planner" className={getClass('/planner', ['/result', '/full-route'])}>Plan Route</Link>
            <Link to="/history" className={getClass('/history')}>History</Link>
            <Link to="/profile" className={getClass('/profile')}>Profile</Link>
            {user && (
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginLeft:'8px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#2563EB',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700'}}>
                  {user.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'U'}
                </div>
                <button onClick={handleLogout} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer',fontSize:'13px',padding:'0'}}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
