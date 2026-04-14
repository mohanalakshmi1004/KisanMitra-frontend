import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MapPin, Search, Loader2, TrendingUp, TrendingDown, Wheat, Mic, MicOff, Inbox, Bot, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip, CartesianGrid, YAxis } from 'recharts';
import axios from 'axios';

const MarketDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [trainingData, setTrainingData] = useState([]);

  // ✅ ENV Variables
  const DATASET_URL = process.env.REACT_APP_MARKET_DATA_URL || "/crop_price_dataset.json";
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

  const dispatchVoiceResult = (text) => {
    if (typeof window !== 'undefined' && window.CustomEvent) {
      window.dispatchEvent(new CustomEvent('voice-result', { detail: { text } }));
    }
  };

  const [liveResult, setLiveResult] = useState({
    location: 'Visakhapatnam',
    crop: 'Sugarcane',
    price: 0,
    unit: 'per Quintal (100 KG)',
    predictedPrice: 0,
    arrivals: 0,
    mandi: 'Local Mandi',
    trend: '0.0%',
    isUp: true,
    source: 'Initializing...',
    history: []
  });

  // --- 1. DYNAMIC DATASET LOADING ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(DATASET_URL);
        const data = await response.json();
        setTrainingData(data);
      } catch (err) {
        console.error("Dataset loading failed:", err);
        setError("Market dataset file not found!");
      }
    };
    loadData();
  }, [DATASET_URL]);

  // --- 2. DYNAMIC PREDICTION LOGIC ---
  const runPrediction = useCallback(async (crop = 'Sugarcane', location = 'Visakhapatnam') => {
    if (trainingData.length === 0) return;
    
    setError(null);
    setIsSearching(true);

    let searchCrop = crop.trim().toLowerCase();
    if (searchCrop === 'paddy') searchCrop = 'rice';

    const cropRecords = trainingData
      .filter(d => d.commodity_name?.toLowerCase().includes(searchCrop))
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    if (cropRecords.length > 0) {
      const latestRecord = cropRecords[cropRecords.length - 1];
      const modal = Math.round(latestRecord.avg_modal_price || 0);
      const trendChange = latestRecord.change || 0;
      const unitType = modal < 250 ? "per KG" : "per Quintal (100 KG)";

      const historyData = cropRecords.slice(-4).map(r => ({
        day: new Date(r.month).toLocaleString('default', { month: 'short' }),
        price: Math.round(r.avg_modal_price),
        isFuture: false
      }));

      const futureData = [];
      const lastPrice = historyData[historyData.length - 1].price;
      const step = lastPrice * (trendChange / 100);

      for (let i = 1; i <= 3; i++) {
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + i);
        futureData.push({
          day: nextMonthDate.toLocaleString('default', { month: 'short' }),
          price: Math.round(lastPrice + (step * i)),
          isFuture: true
        });
      }

      setLiveResult({
        location: latestRecord.state_name === 'India' ? location : latestRecord.state_name,
        crop: latestRecord.commodity_name,
        price: modal,
        unit: unitType,
        predictedPrice: futureData[0].price,
        arrivals: Math.floor(Math.random() * 500) + 100, 
        mandi: latestRecord.district_name === 'All' ? 'District Market' : latestRecord.district_name,
        trend: `${trendChange > 0 ? '+' : ''}${trendChange.toFixed(1)}%`,
        isUp: trendChange >= 0,
        source: "Dynamic Dataset Analysis",
        history: [...historyData, ...futureData]
      });
      dispatchVoiceResult(`Price for ${latestRecord.commodity_name} is ₹${modal}. Predicted price is ₹${futureData[0].price}.`);
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/predict/price`, { cropName: crop });
        if (response.data.success) {
          const aiData = response.data;
          const numericPrice = typeof aiData.currentPrice === 'string' 
            ? Number(aiData.currentPrice.replace(/[^0-9.-]+/g, "")) 
            : Number(aiData.currentPrice);
          
          const dynamicFuture = [];
          for (let i = 1; i <= 3; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() + i);
            dynamicFuture.push({
              day: d.toLocaleString('default', { month: 'short' }),
              price: numericPrice + (i * 50),
              isFuture: true
            });
          }

          setLiveResult({
            location: location,
            crop: crop.charAt(0).toUpperCase() + crop.slice(1),
            price: numericPrice,
            unit: numericPrice < 250 ? "per KG" : "per Quintal (100 KG)",
            predictedPrice: dynamicFuture[0].price,
            arrivals: "Live", 
            mandi: "Main Mandi",
            trend: "+2.0%",
            isUp: true,
            source: "Live AI Market Data",
            history: [
              { day: 'Last', price: numericPrice - 50, isFuture: false },
              { day: 'Now', price: numericPrice, isFuture: false },
              ...dynamicFuture
            ]
          });
        }
      } catch (err) {
        setError(`'${crop}' డేటా దొరకలేదు.`);
      }
    }
    setIsSearching(false);
  }, [trainingData, BACKEND_URL]);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Please use Chrome for Voice Search.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'te-IN'; 
    recognition.onstart = () => { setIsListening(true); setError(null); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      const words = transcript.trim().split(' ');
      runPrediction(words[words.length - 1], words[0] || 'Visakhapatnam');
    };
    recognition.start();
  };

  const executeSearch = (e) => {
    if (e) e.preventDefault();
    const words = searchQuery.trim().split(' ');
    runPrediction(words[words.length - 1] || 'Sugarcane', words[0] || 'Visakhapatnam');
  };

  return (
    <div style={containerStyle}>
      <style>{`
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        .mic-active { animation: pulse 1s infinite; color: #ef4444 !important; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Prevent Google Translate from messing with crucial values */
        .notranslate { translate: no !important; }
      `}</style>
      
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'white' }}>
          <ArrowLeft size={24} cursor="pointer" onClick={() => window.history.back()} />
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>Farmer Market AI</h1>
        </div>

        <form onSubmit={executeSearch} style={searchBoxStyle} className="notranslate">
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            className="notranslate"
            placeholder="e.g. 'Vizag Tomato'" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputFieldStyle}
          />
          <button type="button" onClick={handleVoiceSearch} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 8px' }}>
            {isListening ? <Mic className="mic-active" size={22} /> : <MicOff color="#94a3b8" size={22} />}
          </button>
          <button type="submit" style={searchBtnStyle}>
            {isSearching ? <Loader2 className="animate-spin" size={18} /> : "Predict"}
          </button>
        </form>
      </div>

      {error && <div style={errorBanner}><AlertCircle size={18} /> <span>{error}</span></div>}

      <div style={glassCardStyle}>
        <div style={leftColStyle}>
          <div style={innerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Source: <span className="notranslate" translate="no">{liveResult.source}</span>
              </span>
              <div style={locationBadge} className="notranslate">
                <MapPin size={14} /> <span translate="no">{liveResult.location}</span>
              </div>
            </div>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <Wheat size={24} color="#64748b" />
              <p style={{ fontWeight: '700', color: '#64748b', margin: '5px 0' }}>
                <span className="notranslate" translate="no">{liveResult.crop}</span>
              </p>
              {/* ✅ Wrapped price in span with translate="no" to fix insertBefore error */}
              <h2 style={{ fontSize: '4.5rem', fontWeight: '900', color: '#0f172a', margin: '5px 0' }}>
                <span className="notranslate" translate="no">₹{(liveResult.price || 0).toLocaleString('en-IN')}</span>
              </h2>
              <p style={{ margin: '-10px 0 15px 0', fontSize: '15px', color: '#64748b', fontWeight: 'bold' }}>
                <span>{liveResult.unit}</span>
              </p>
              <div style={{ color: liveResult.isUp ? '#10b981' : '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                {liveResult.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
                <span className="notranslate" translate="no">{liveResult.trend}</span> <span>History</span>
              </div>
            </div>
          </div>
          <div style={aiCardStyle} className="notranslate">
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '15px' }}><Bot size={28} /></div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>AI Target (Future)</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>
                <span translate="no" className="notranslate">₹{(liveResult.predictedPrice || 0).toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
        </div>

        <div style={rightColStyle}>
          <div style={{ ...innerCard, flex: 1, minHeight: '320px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#1e293b' }}>Price Trend</h3>
            <div style={{ width: '100%', minWidth: 0, minHeight: 200, position: 'relative' }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={liveResult.history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip />
                  <Area type="monotone" dataKey="price" stroke="#0ea5e9" strokeWidth={3} fill="#0ea5e9" fillOpacity={0.1} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={bottomGrid}>
            <div style={miniCard}>
              <Inbox size={20} color="#0ea5e9" />
              <div>
                <p style={miniHead}>Arrivals</p>
                <p style={miniVal} className="notranslate" translate="no">
                  {liveResult.arrivals} {liveResult.unit.includes("KG") ? "Kgs" : "Qtl"}
                </p>
              </div>
            </div>
            <div style={miniCard}>
              <MapPin size={20} color="#0ea5e9" />
              <div>
                <p style={miniHead}>Selected Mandi</p>
                <p style={miniVal} className="notranslate" translate="no">{liveResult.mandi}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { width: '100vw', minHeight: '100vh', backgroundColor: '#f7fee7', backgroundImage: "url('/background.png')", backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', boxSizing: 'border-box', margin: 0 };
const headerStyle = { width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const searchBoxStyle = { display: 'flex', alignItems: 'center', background: 'white', borderRadius: '50px', padding: '5px 15px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', gap: '10px' };
const inputFieldStyle = { border: 'none', outline: 'none', flex: 1, fontSize: '14px' };
const searchBtnStyle = { background: '#0ea5e9', border: 'none', color: 'white', padding: '10px 25px', borderRadius: '50px', cursor: 'pointer', fontWeight: '700' };
const glassCardStyle = { background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '30px', padding: '30px', width: '100%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '25px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' };
const innerCard = { background: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' };
const aiCardStyle = { background: 'linear-gradient(135deg, #075985 0%, #0ea5e9 100%)', color: 'white', padding: '20px', borderRadius: '25px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' };
const leftColStyle = { display: 'flex', flexDirection: 'column' };
const rightColStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const bottomGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const miniCard = { background: 'white', padding: '15px', borderRadius: '20px', display: 'flex', gap: '12px', alignItems: 'center' };
const miniHead = { margin: 0, fontSize: '11px', color: '#64748b' };
const miniVal = { margin: 0, fontWeight: '800', fontSize: '13px', color: '#1e293b' };
const locationBadge = { background: '#f0f9ff', color: '#0ea5e9', padding: '6px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' };
const errorBanner = { background: '#fee2e2', color: '#ef4444', padding: '10px 20px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold', maxWidth: '1100px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px' };

export default MarketDashboard;