import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../App.module.css';

const LandingPage = () => {
  return (
    <>

      <header className={styles.header}>
        <div className={styles.container}>
            <div className={styles.headerContent}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>⚡</div> EVRoute AI
                </div>
                <div className={styles.nav}>
                    <Link to="/features" className={styles.navLink}>Features</Link>
                    <Link to="/how-it-works" className={styles.navLink}>How It Works</Link>

                    <Link to="/login" className={styles.btnGreen}>Get Started</Link>
                </div>
            </div>
        </div>
      </header>


      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContainer}>

            <div className={styles.heroText}>
              <div className={styles.badge}>✨ AI-Powered Route Intelligence</div>
              <h1 className={styles.heroTitle}>Plan Your Electric Journey with Confidence</h1>
              <p style={{color:'#6B7280', fontSize:'18px', marginBottom:'30px', lineHeight: '1.6', maxWidth:'600px'}}>
                Smart route planning powered by artificial intelligence. Find optimal charging stations, minimize travel time, and maximize your EV experience.
              </p>
              
              <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                  <Link to="/signup" className={styles.btnGreen}>Start Planning →</Link>
                  
                  {/* Статистика */}
                  <div style={{display:'flex', gap:'30px', marginLeft:'20px'}}>
                      <div>
                          <div style={{fontWeight:'800', fontSize:'20px', color:'#111827'}}>12k+</div>
                          <div style={{fontSize:'13px', color:'#6B7280', fontWeight:500}}>Stations</div>
                      </div>
                      <div>
                          <div style={{fontWeight:'800', fontSize:'20px', color:'#111827'}}>99%</div>
                          <div style={{fontSize:'13px', color:'#6B7280', fontWeight:500}}>Accuracy</div>
                      </div>
                  </div>
              </div>
            </div>


            <div className={styles.heroImage}>
               <img 
                 src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=1000&auto=format&fit=crop" 
                 alt="EV Dashboard"
                 className={styles.heroImgTag} 
               />
            </div>

          </div>
        </div>
      </section>


      <section className={styles.section} style={{background: '#fff', padding: '80px 0'}}>
        <div className={styles.container}>
          <div style={{textAlign:'center', marginBottom:'60px'}}>
            <h2 style={{fontSize:'32px', marginBottom:'16px'}}>Intelligent Route Planning</h2>
            <p style={{color:'#6B7280'}}>Our AI analyzes real-time data to provide you with the most efficient routes.</p>
          </div>
          
          <div className={styles.featuresGrid} style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'30px'}}>
            <div className={styles.card} style={{padding:'32px', border:'1px solid #F3F4F6', boxShadow:'none'}}>
              <div className={styles.authIcon} style={{width:'48px', height:'48px', fontSize:'20px', margin:'0 0 20px 0', background:'#EFF6FF', color:'#2563EB'}}>⚙️</div>
              <h3 style={{fontSize:'18px', marginBottom:'10px'}}>AI Optimization</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Machine learning algorithms optimize your route based on battery level.</p>
            </div>
            <div className={styles.card} style={{padding:'32px', border:'1px solid #F3F4F6', boxShadow:'none'}}>
              <div className={styles.authIcon} style={{width:'48px', height:'48px', fontSize:'20px', margin:'0 0 20px 0', background:'#ECFDF5', color:'#059669'}}>📍</div>
              <h3 style={{fontSize:'18px', marginBottom:'10px'}}>Real-Time Updates</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Live charging station availability and pricing updates based on current conditions.</p>
            </div>
            <div className={styles.card} style={{padding:'32px', border:'1px solid #F3F4F6', boxShadow:'none'}}>
               <div className={styles.authIcon} style={{width:'48px', height:'48px', fontSize:'20px', margin:'0 0 20px 0', background:'#FFFBEB', color:'#D97706'}}>🔋</div>
              <h3 style={{fontSize:'18px', marginBottom:'10px'}}>Battery Management</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Smart battery monitoring ensures you never run out of charge.</p>
            </div>
            <div className={styles.card} style={{padding:'32px', border:'1px solid #F3F4F6', boxShadow:'none'}}>
               <div className={styles.authIcon} style={{width:'48px', height:'48px', fontSize:'20px', margin:'0 0 20px 0', background:'#F3E8FF', color:'#7C3AED'}}>⏱️</div>
              <h3 style={{fontSize:'18px', marginBottom:'10px'}}>Time Optimization</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Minimize total travel time by selecting the fastest charging stations.</p>
            </div>
            <div className={styles.card} style={{padding:'32px', border:'1px solid #F3F4F6', boxShadow:'none'}}>
               <div className={styles.authIcon} style={{width:'48px', height:'48px', fontSize:'20px', margin:'0 0 20px 0', background:'#FEF2F2', color:'#DC2626'}}>🛡️</div>
              <h3 style={{fontSize:'18px', marginBottom:'10px'}}>Safety First</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Always maintain a safe battery buffer with emergency recommendations.</p>
            </div>
            <div className={styles.card} style={{padding:'32px', border:'1px solid #F3F4F6', boxShadow:'none'}}>
               <div className={styles.authIcon} style={{width:'48px', height:'48px', fontSize:'20px', margin:'0 0 20px 0', background:'#EFF6FF', color:'#2563EB'}}>📈</div>
              <h3 style={{fontSize:'18px', marginBottom:'10px'}}>Cost Tracking</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Monitor charging costs and compare prices across different stations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className={styles.section} style={{padding:'80px 0'}}>
        <div className={styles.container}>
          <div style={{textAlign:'center', marginBottom:'60px'}}>
            <div style={{fontSize:'12px', fontWeight:'600', color:'#6B7280', marginBottom:'10px', textTransform:'uppercase'}}>How It Works</div>
            <h2 style={{fontSize:'32px'}}>Simple, fast, and intelligent</h2>
          </div>
          
          <div style={{display:'flex', justifyContent:'space-between', textAlign:'center', gap:'40px'}}>
            <div style={{flex:1}}>
              <div style={{width:'60px', height:'60px', background:'#2563EB', color:'white', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'bold', margin:'0 auto 24px', boxShadow:'0 10px 20px rgba(37, 99, 235, 0.3)'}}>1</div>
              <h3 style={{marginBottom:'10px'}}>Enter Your Route</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Input your starting point and destination.</p>
            </div>
            <div style={{flex:1}}>
              <div style={{width:'60px', height:'60px', background:'#00C853', color:'white', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'bold', margin:'0 auto 24px', boxShadow:'0 10px 20px rgba(0, 200, 83, 0.3)'}}>2</div>
              <h3 style={{marginBottom:'10px'}}>AI Analyzes Options</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Our AI evaluates thousands of route combinations.</p>
            </div>
            <div style={{flex:1}}>
              <div style={{width:'60px', height:'60px', background:'#9333EA', color:'white', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'bold', margin:'0 auto 24px', boxShadow:'0 10px 20px rgba(147, 51, 234, 0.3)'}}>3</div>
              <h3 style={{marginBottom:'10px'}}>Get Optimized Route</h3>
              <p style={{fontSize:'14px', color:'#6B7280', lineHeight:'1.6'}}>Receive your personalized route instantly.</p>
            </div>
          </div>
        </div>
      </section>


      <section style={{background: 'linear-gradient(90deg, #2563EB 0%, #00C853 100%)', padding:'100px 0', textAlign:'center', color:'white'}}>
         <div className={styles.container}>
            <h2 style={{fontSize:'36px', marginBottom:'20px'}}>Ready to Start Your Journey?</h2>
            <p style={{fontSize:'18px', opacity:0.9, marginBottom:'40px'}}>Join thousands of EV drivers who trust EVRoute AI.</p>
            {/* Ведет на Регистрацию */}
            <Link to="/signup" style={{background:'white', color:'#111827', padding:'14px 32px', borderRadius:'8px', fontWeight:'600', textDecoration:'none', display:'inline-block'}}>
                Get Started Free →
            </Link>
         </div>
      </section>

      <footer style={{background:'#111827', color:'white', padding:'80px 0 40px'}}>
           <div className={styles.container}>
              <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr', gap:'40px', borderBottom:'1px solid #374151', paddingBottom:'60px', marginBottom:'40px'}}>
                 <div>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'20px', fontWeight:'bold', marginBottom:'20px'}}>
                       <div style={{background:'#00C853', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>⚡</div> 
                       EVRoute AI
                    </div>
                    <p style={{fontSize:'14px', color:'#9CA3AF', lineHeight:'1.6', maxWidth:'300px'}}>
                       Intelligent route planning for the electric vehicle era.
                    </p>
                 </div>
                 <div>
                    <h4 style={{marginBottom:'20px'}}>Product</h4>
                    <div style={{display:'flex', flexDirection:'column', gap:'12px', fontSize:'14px', color:'#9CA3AF'}}>
                        <Link to="/features" style={{color:'#9CA3AF', textDecoration:'none'}}>Features</Link>
                        <span>Pricing</span>
                    </div>
                 </div>
                 <div>
                    <h4 style={{marginBottom:'20px'}}>Company</h4>
                    <div style={{display:'flex', flexDirection:'column', gap:'12px', fontSize:'14px', color:'#9CA3AF'}}>
                        <span>About</span>
                        <span>Careers</span>
                    </div>
                 </div>
                 <div>
                    <h4 style={{marginBottom:'20px'}}>Support</h4>
                    <div style={{display:'flex', flexDirection:'column', gap:'12px', fontSize:'14px', color:'#9CA3AF'}}>
                        <span>Help Center</span>
                        <span>Privacy Policy</span>
                    </div>
                 </div>
              </div>
              <div style={{textAlign:'center', color:'#6B7280', fontSize:'14px'}}>
                 © 2025 EVRoute AI. All rights reserved.
              </div>
           </div>
      </footer>
    </>
  );
};

export default LandingPage;