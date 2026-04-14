import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Plus, Leaf, Loader2, MapPin, CheckCircle, Home, PhoneCall, TrendingDown, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import bgImage from '../assets/insurance.png'; 

const Insurance = () => {
  const [acres, setAcres] = useState(1);
  const [cropData, setCropData] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [chartData, setChartData] = useState([]);
  const [weatherCondition, setWeatherCondition] = useState('Normal');

  // ✅ API Key from .env
  const WEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

  const isAP = selectedState === 'Andhra Pradesh';
  const premiumAmount = isAP ? 0 : (acres * 45000 * 0.02); 
  const portalUrl = isAP ? 'https://karshak.ap.gov.in/' : 'https://pmfby.gov.in/';

  const fetchRealRiskData = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        // ✅ Replaced hardcoded key with variable
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`);
        const data = await response.json();
        const today = new Date().toLocaleDateString('en-CA');
        const dailyData = {};
        
        data.list.forEach(item => {
          const dateStr = new Date(item.dt * 1000).toLocaleDateString('en-CA');
          if (!dailyData[dateStr]) dailyData[dateStr] = { temps: [], date: new Date(item.dt * 1000) };
          dailyData[dateStr].temps.push(item.main.temp);
        });

        const sortedDates = Object.keys(dailyData).sort().slice(0, 4);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let maxTotalRisk = 0;

        const formatted = sortedDates.map(dateStr => {
          const info = dailyData[dateStr];
          const maxTemp = Math.max(...info.temps);
          let risk = Math.max(10, Math.min(100, Math.round(maxTemp * 0.7)));
          if (risk > maxTotalRisk) maxTotalRisk = risk;
          return { day: dateStr === today ? 'Today' : days[info.date.getDay()], risk };
        });

        setChartData(formatted);
        setWeatherCondition(maxTotalRisk > 60 ? 'High Risk' : 'Normal');
      } catch (e) { console.error(e); }
    });
  }, [WEATHER_API_KEY]);

  useEffect(() => {
    fetchRealRiskData();
    const learnedCrops = JSON.parse(localStorage.getItem('ai_crops')) || ["Paddy", "Maize", "Pulses"];
    const fullList = learnedCrops.map((name, index) => ({
      id: index.toString(), name: name, sumInsuredPerAcre: 45000 
    }));
    setCropData(fullList);
    setSelectedCropId(fullList[0]?.id || '');
    setIsLoading(false);
  }, [fetchRealRiskData]);

  if (isLoading) return <div style={styles.loader}><Loader2 className="animate-spin" size={48} color="#2e7d32" /></div>;

  return (
    <div style={styles.pageWrapper}>
      {/* UI structure remains exactly as you built it */}
      <div style={styles.subHeader}>
        <div style={styles.brandGroup}>
          <div style={styles.logoCircle}>
            <Leaf size={26} color="#ffffff" fill="#ffffff" />
          </div>
          <h1 style={styles.mainTitle}>Panta Bheema</h1>
        </div>
      </div>

      <main style={styles.dashboardGrid}>
        <section style={styles.card}>
          <h2 style={styles.cardHeading}><Leaf size={18} color="#2e7d32" /> Farm Details</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}><MapPin size={14}/> Location</label>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={styles.selectInput}>
                {(JSON.parse(localStorage.getItem('ai_states')) || ["Andhra Pradesh", "Telangana", "Karnataka"]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}><Leaf size={14}/> Select Crop</label>
            <select style={styles.selectInput} value={selectedCropId} onChange={(e) => setSelectedCropId(e.target.value)}>
              {cropData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.counterContainer}>
            <button onClick={() => setAcres(Math.max(1, acres - 1))} style={styles.mathBtn}><Minus size={14}/></button>
            <span style={styles.acreDisplay}>{acres} <small style={{fontSize:'14px', color:'#666'}}>Acres</small></span>
            <button onClick={() => setAcres(acres + 1)} style={styles.mathBtn}><Plus size={14}/></button>
          </div>
          
          <div style={styles.financeBox}>
            {isAP ? (
              <div style={styles.dataItem}>
                <span>Premium <span style={{color:'#2e7d32', fontWeight:'bold'}}>(e-Crop Free)</span></span>
                <span style={{color:'#2e7d32', fontWeight:'800'}}>₹0</span>
              </div>
            ) : (
              <div style={styles.dataItem}>
                <span>Govt Premium <span style={{color:'#d32f2f', fontWeight:'bold'}}>(Payable)</span></span>
                <span style={{color:'#d32f2f', fontWeight:'800'}}>₹{premiumAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={styles.sumRow}>
              <span>Total Sum Insured</span>
              <span>₹{(acres * 45000).toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.flexBetween}>
            <h2 style={styles.cardHeading}>Risk Analysis <RefreshCw size={14} onClick={fetchRealRiskData} style={styles.pointer} /></h2>
            <div style={styles.badge}>{weatherCondition}</div>
          </div>
          <div style={{ width: '100%', minWidth: 0, minHeight: 210, position: 'relative' }}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#43a047" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#43a047" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} dy={10} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="risk" stroke="#43a047" strokeWidth={2} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.forecastBanner}>
            <TrendingDown size={18} color="#2e7d32" /><span>GPS Based 4-Day Forecast</span>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardHeading}>Requirements</h2>
          <ul style={styles.reqList}>
            <li style={styles.reqItem}><CheckCircle size={18} color="#2e7d32"/> Aadhaar Card</li>
            <li style={styles.reqItem}><CheckCircle size={18} color="#2e7d32"/> Bank Passbook</li>
            <li style={styles.reqItem}>
              <CheckCircle size={18} color="#2e7d32"/> 
              {isAP ? ' e-Panta Receipt' : ' Crop Sowing Certificate'}
            </li>
          </ul>
          <div style={styles.rbkBox}>
            <Home size={22} color="#2e7d32" />
            <div>
              <div style={styles.bold14}>{isAP ? 'Visit Nearest RBK' : 'Visit Nearest CSC / Bank'}</div>
              <div style={styles.grey12}>Verified for {selectedState}</div>
            </div>
          </div>
          <div style={styles.btnRow}>
            <button style={styles.btnGreen} onClick={() => window.open(portalUrl, '_blank')}>
              {isAP ? 'e-Crop Portal' : 'PMFBY Portal'}
            </button>
            <button style={styles.btnRed} onClick={() => window.location.href = "tel:1902"}><PhoneCall size={16}/> 1902</button>
          </div>
        </section>
      </main>
    </div>
  );
};

// ... (Styles stay the same as your original)
const styles = {
  pageWrapper: { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px' },
  subHeader: { width: '90%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 10px 10px 10px' },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoCircle: { background: '#2e7d32', padding: '10px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(46, 125, 50, 0.4)' },
  mainTitle: { fontSize: '32px', fontWeight: 'bold', color: '#ffffff', margin: 0, textShadow: '0 3px 10px rgba(0,0,0,0.5)' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', width: '95%', maxWidth: '1200px', margin: '30px auto', alignItems: 'stretch' },
  card: { background: 'rgba(255, 255, 255, 0.97)', borderRadius: '28px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.5)' },
  cardHeading: { fontSize: '18px', color: '#111', fontWeight: '700', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
  inputGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#666' },
  selectInput: { padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  counterContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8faf8', padding: '10px 15px', borderRadius: '15px', border: '1px solid #eee' },
  mathBtn: { width: '35px', height: '35px', borderRadius: '10px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' },
  acreDisplay: { fontSize: '26px', fontWeight: '800', color: '#2e7d32' },
  financeBox: { marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' },
  dataItem: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' },
  sumRow: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 'bold', borderTop: '1px dashed #ccc', paddingTop: '15px', fontSize: '16px' },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  badge: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', background: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' },
  forecastBanner: { display: 'flex', gap: '10px', background: '#f0fdf4', padding: '14px', borderRadius: '15px', color: '#2e7d32', fontWeight: '600', fontSize: '14px', marginTop: '15px' },
  reqList: { listStyle: 'none', padding: 0, marginBottom: '20px' },
  reqItem: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', fontSize: '15px' },
  rbkBox: { display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '18px', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '25px' },
  bold14: { fontWeight: '700', fontSize: '15px' },
  grey12: { fontSize: '13px', color: '#666' },
  btnRow: { display: 'flex', gap: '12px', marginTop: 'auto' },
  btnGreen: { flex: 2, background: '#388e3c', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', cursor: 'pointer' },
  btnRed: { flex: 1, background: '#e53935', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' },
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  pointer: { cursor: 'pointer' }
};

export default Insurance;