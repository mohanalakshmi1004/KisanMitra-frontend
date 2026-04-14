import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ✅ ల్యాగ్ తగ్గించడానికి ఆప్టిమైజ్ చేసిన ఇంపోర్ట్స్
import Sprout from 'lucide-react/dist/esm/icons/sprout';
import Leaf from 'lucide-react/dist/esm/icons/leaf';
import Target from 'lucide-react/dist/esm/icons/target';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';

import bgImage from '../assets/crop.png'; 

const Crop = () => {
  const navigate = useNavigate();
  const [soilData, setSoilData] = useState({ n: '', p: '', k: '', ph: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ENV Variables - ఒకవేళ ఇవి undefined అయితే డైరెక్ట్ URL వాడుకుంటుంది
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
  const WEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

  // ✅ ప్రస్తుత భాషను గుర్తించే ఫంక్షన్ (Consistency కోసం)
  const getCurrentLanguage = () => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
    return cookie ? cookie.split('/').pop() : "te";
  };

  const applyGoogleTranslate = () => {
    if (typeof window === 'undefined') return;
    const cookie = document.cookie.split('; ').find((row) => row.trim().startsWith('googtrans='));
    const lang = cookie ? cookie.split('/').pop() : 'en';
    if (lang === 'en') return;
    if (window.doGTranslate) {
      window.doGTranslate(`en|${lang}`);
      return;
    }
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }
  };

  const dispatchVoiceResult = (text) => {
    if (typeof window !== 'undefined' && window.CustomEvent) {
      window.dispatchEvent(new CustomEvent('voice-result', { detail: { text } }));
    }
  };

  useEffect(() => {
    applyGoogleTranslate();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    const userCity = localStorage.getItem("city") || "Visakhapatnam";

    try {
      // 1. Weather Data Fetch
      const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=${WEATHER_API_KEY}&units=metric`);
      const { temp, humidity } = weatherRes.data.main;

      // 2. AI Prediction Call
      // 🔍 DEBUG: ఇక్కడ console log పెట్టి URL ని చెక్ చెయ్యి
      const apiPath = `${BACKEND_URL}/api/predict/crop`;
      console.log("Calling API:", apiPath);

      const response = await axios.post(apiPath, {
        n: Number(soilData.n), 
        p: Number(soilData.p), 
        k: Number(soilData.k), 
        ph: Number(soilData.ph),
        temp: temp, 
        humidity: humidity, 
        rainfall: 100,
        language: getCurrentLanguage()
      });

      if (response.data.success) {
        const insights = ["Perfect soil & climate."];
        setResult({ 
          crop: response.data.recommendedCrop, 
          confidence: response.data.confidence,
          insights,
          weather: { temp, humidity }
        });

        dispatchVoiceResult(`${response.data.recommendedCrop}. ${insights[0]}`);
        applyGoogleTranslate();
      }
    } catch (err) { 
      console.error("Prediction Error:", err);
      alert(err.response?.status === 404 ? "API Route Not Found (404). Check Backend." : "Connection Error. Please try again."); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate('/')} style={backBtnStyle}><ArrowLeft size={20} /></button>
      
      <div style={formWrapper}>
        {/* Left Side: Input Form */}
        <div style={cardStyle}>
          <h3 style={flexHeader}><Sprout color="#16a34a" size={22} /> Soil Analysis</h3>
          <form onSubmit={handlePredict} style={formStyle}>
            {['n', 'p', 'k', 'ph'].map((id) => {
  const label =
    id === 'n' ? 'Nitrogen' :
    id === 'p' ? 'Phosphorus' :
    id === 'k' ? 'Potassium' : 'Soil pH';

  const placeholder =
    id === 'n' ? '0-140' :
    id === 'p' ? '0-140' :
    id === 'k' ? '0-140' :
    '0-14';

  return (
    <div key={id} style={inputGroup}>
      <label style={labelStyle}>{label}</label>

      <input
        type="number"
        required
        style={inputStyle}
        placeholder={placeholder}   // ✅ box lo range
        value={soilData[id]}
        onChange={(e) =>
          setSoilData({ ...soilData, [id]: e.target.value })
        }
      />
    </div>
  );
})}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? <Loader2 className="spin" size={20} /> : 'Analyze & Recommend'}
            </button>
          </form>
        </div>

        {/* Right Side: Result Display */}
        <div style={resultCardStyle}>
          {result ? (
            <div className="fade-in">
              <Leaf color="#16a34a" size={35} style={{ margin: '0 auto' }} />
              <span style={subLabel}>Recommended Crop</span>
              <h1 style={cropTitle}>{result.crop}</h1>
              <div style={confidenceBadge}><CheckCircle2 size={16} /> {result.confidence}% Match</div>
              <div style={insightWrapper}>
                {result.insights.map((msg, i) => (
                  <div key={i} style={alertBox}><AlertTriangle size={16} /> {msg}</div>
                ))}
              </div>
            </div>
          ) : (
            <div style={pendingWrapper}>
              <Target size={60} style={{ opacity: 0.1 }} />
              <h4>Soil Analysis</h4>
              <p>Enter data for results</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s infinite linear; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

// Styles
const containerStyle = { height: '100vh', width: '100vw', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif" };
const formWrapper = { display: 'flex', gap: '20px', width: '900px', height: '480px' };
const cardStyle = { flex: '1', background: 'white', borderRadius: '28px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' };
const resultCardStyle = { ...cardStyle, background: 'rgba(255, 255, 255, 0.95)', textAlign: 'center' };
const backBtnStyle = { position: 'absolute', top: '80px', left: '20px', background: 'white', border: 'none', padding: '12px', borderRadius: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const flexHeader = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a237e' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 };
const inputGroup = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const labelStyle = { fontSize: '14px', fontWeight: '600', color: '#444' };
const inputStyle = { width: '160px', padding: '10px', borderRadius: '12px', border: '1px solid #eee', background: '#f8fafc' };
const btnStyle = { background: '#16a34a', color: 'white', padding: '15px', borderRadius: '15px', border: 'none', fontWeight: '800', cursor: 'pointer', marginTop: 'auto' };
const subLabel = { fontSize: '11px', fontWeight: '900', color: '#16a34a', textTransform: 'uppercase', display: 'block', marginTop: '10px' };
const cropTitle = { fontSize: '2.5rem', margin: '5px 0', textTransform: 'capitalize', fontWeight: '900' };
const confidenceBadge = { background: '#dcfce7', padding: '6px 15px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '13px', fontWeight: '700' };
const insightWrapper = { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' };
const weatherBox = { background: '#f0f9ff', padding: '10px', borderRadius: '12px', border: '1px solid #bae6fd', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' };
const alertBox = { ...weatherBox, background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412' };
const pendingWrapper = { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 };

export default Crop;