import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


import Sprout from 'lucide-react/dist/esm/icons/sprout';
import Leaf from 'lucide-react/dist/esm/icons/leaf';
import Target from 'lucide-react/dist/esm/icons/target';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';

import bgImage from '../assets/crop.png'; 

const Crop = () => {
  const navigate = useNavigate();
  const [soilData, setSoilData] = useState({ n: '', p: '', k: '', ph: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

 
  const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
  const WEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

 
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

  const getFallbackCrop = (soilValues) => {
    const { n = 0, p = 0, k = 0, ph = 0 } = soilValues || {};
    const parsedN = Number(n);
    const parsedP = Number(p);
    const parsedK = Number(k);
    const parsedPh = Number(ph);

    if (parsedPh > 7.5) return 'cotton';
    if (parsedN >= 80 && parsedP >= 40 && parsedK >= 40) return 'rice';
    if (parsedN >= 60 && parsedP >= 30) return 'maize';
    if (parsedP >= 50 && parsedK >= 30) return 'pigeonpeas';
    return 'green gram';
  };

  useEffect(() => {
    applyGoogleTranslate();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const userCity = localStorage.getItem('city') || 'Visakhapatnam';
    const fallbackWeather = { temp: 28, humidity: 60 };
    let weather = fallbackWeather;

    try {
      if (WEATHER_API_KEY) {
        try {
          const weatherRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=${WEATHER_API_KEY}&units=metric`
          );
          if (weatherRes?.data?.main) {
            weather = {
              temp: weatherRes.data.main.temp,
              humidity: weatherRes.data.main.humidity
            };
          }
        } catch (weatherErr) {
          console.warn('Weather lookup failed, using fallback values:', weatherErr.message);
        }
      }

      const apiPath = BACKEND_URL ? `${BACKEND_URL}/api/predict/crop` : '/api/predict/crop';
      console.log('Calling API:', apiPath);

      const response = await axios.post(apiPath, {
        n: Number(soilData.n),
        p: Number(soilData.p),
        k: Number(soilData.k),
        ph: Number(soilData.ph),
        temp: weather.temp,
        humidity: weather.humidity,
        rainfall: 100,
        language: getCurrentLanguage()
      });

      if (response?.data?.success) {
        const primaryCrop = response.data.recommendedCrop || getFallbackCrop(soilData);
        const suggestions = [
          primaryCrop,
          response.data.alternativeCrop || 'maize',
          response.data.secondAlternative || 'cotton'
        ].filter(Boolean).slice(0, 3);

        const insights = [
          response.data.reason || 'Good soil and climate conditions for these crops.',
          `Suggested crops: ${suggestions.join(', ')}`,
          `Current weather: ${weather.temp}°C and ${weather.humidity}% humidity.`
        ];

        setResult({
          crop: primaryCrop,
          confidence: response.data.confidence,
          suggestions,
          insights,
          weather
        });

        dispatchVoiceResult(`${primaryCrop}. ${insights[0]}`);
        applyGoogleTranslate();
        return;
      }

      const fallbackCrop = getFallbackCrop(soilData);
      const fallbackSuggestions = [fallbackCrop, 'maize', 'cotton'];
      const fallbackInsights = [
        'A local fallback recommendation is being shown because the prediction service was unavailable.',
        `Suggested crops: ${fallbackSuggestions.join(', ')}`,
        `Current weather: ${weather.temp}°C and ${weather.humidity}% humidity.`
      ];

      setResult({
        crop: fallbackCrop,
        confidence: '85.00',
        suggestions: fallbackSuggestions,
        insights: fallbackInsights,
        weather
      });
      dispatchVoiceResult(`${fallbackCrop}. ${fallbackInsights[0]}`);
      applyGoogleTranslate();
    } catch (err) {
      console.error('Prediction Error:', err);
      const fallbackCrop = getFallbackCrop(soilData);
      setResult({
        crop: fallbackCrop,
        confidence: '85.00',
        suggestions: [fallbackCrop, 'maize', 'cotton'],
        insights: [
          'A local fallback recommendation is being shown because the prediction service was unavailable.',
          `Current weather: ${weather.temp}°C and ${weather.humidity}% humidity.`
        ],
        weather
      });
      dispatchVoiceResult(`${fallbackCrop}. Local fallback recommendation.`);
      applyGoogleTranslate();
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
              <span style={subLabel}>Recommended Crops</span>
              <h1 style={cropTitle}>{result.crop}</h1>
              <div style={confidenceBadge}><CheckCircle2 size={16} /> {result.confidence}% Match</div>
              <div style={suggestionRow}>
                {result.suggestions?.map((crop, i) => (
                  <span key={i} style={suggestionChip}>{crop}</span>
                ))}
              </div>
              <div style={insightWrapper}>
                {result.insights.map((msg, i) => (
                  <div key={i} style={alertBox}><CheckCircle2 size={16} /> {msg}</div>
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
const suggestionRow = { marginTop: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' };
const suggestionChip = { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'capitalize' };
const insightWrapper = { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' };
const weatherBox = { background: '#f0f9ff', padding: '10px', borderRadius: '12px', border: '1px solid #bae6fd', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' };
const alertBox = { ...weatherBox, background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412' };
const pendingWrapper = { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 };

export default Crop;