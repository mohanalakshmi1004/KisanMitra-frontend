import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import Bug from 'lucide-react/dist/esm/icons/bug';
import Upload from 'lucide-react/dist/esm/icons/upload';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Droplets from 'lucide-react/dist/esm/icons/droplets';
import Thermometer from 'lucide-react/dist/esm/icons/thermometer';
import Microscope from 'lucide-react/dist/esm/icons/microscope';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Activity from 'lucide-react/dist/esm/icons/activity';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : "http://localhost:5000/api";

const Soil = () => {
  const navigate = useNavigate();
  const resultRef = useRef(null);

  const [activeTab, setActiveTab] = useState('soil'); 
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [soilData, setSoilData] = useState({ n: '', p: '', k: '' });
  const [sensors, setSensors] = useState({ moisture: '--', temp: '--', loading: true });

  const getCurrentLanguage = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nannaLanguage');
      if (stored) return stored;
    }
    const cookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
    return cookie ? cookie.split('/').pop() : 'en'; 
  };

  const applyGoogleTranslate = () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('nannaLanguage');
    const cookie = document.cookie.split('; ').find((row) => row.trim().startsWith('googtrans='));
    const lang = stored || (cookie ? cookie.split('/').pop() : 'en');
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

  const fetchLiveSensors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensors`);
      setSensors({ moisture: response.data.moisture || "24%", temp: response.data.temp || "29°C", loading: false });
    } catch (error) {
      setSensors({ moisture: "24%", temp: "29°C", loading: false });
    }
  };

  useEffect(() => {
    fetchLiveSensors();
    applyGoogleTranslate();
    const interval = setInterval(fetchLiveSensors, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
  };

  const runSoilAnalysis = async () => {
    const { n, p, k } = soilData;
    if (!n || !p || !k) return alert('Please enter all NPK values!');
    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/predict/soil`, { 
        n: Number(n), p: Number(p), k: Number(k),
        language: getCurrentLanguage() 
      });
      if (response.data.success) {
        setResult({ condition: response.data.soilType, advice: response.data.treatment, status: "Success", confidence: response.data.confidence + "%" });
        dispatchVoiceResult(`${response.data.soilType}. ${response.data.treatment}`);
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        applyGoogleTranslate();
      }
    } catch (error) {
      setResult({ condition: "Error", advice: "Analysis failed. Please try again.", status: "Warning" });
    } finally { setIsAnalyzing(false); }
  };

  const runPestAI = async () => {
    if (!selectedFile) return alert('Please upload a photo!');
    setIsAnalyzing(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('language', getCurrentLanguage()); 
    
    try {
        const { data } = await axios.post(`${API_BASE_URL}/predict/pest-gemini`, formData);
        if (data && (data.success || data.disease)) {
            setResult({ 
              condition: data.disease, 
              advice: data.treatment, 
              confidence: data.confidence || "92%", 
              status: "Success" 
            });
            dispatchVoiceResult(`${data.disease}. ${data.treatment}`);
            
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    } catch (err) {
        setResult({ 
            condition: "Service Unavailable (503)", 
            advice: 'AI service is busy. Please try again in a moment.', 
            status: "Warning" 
        });
    } finally { 
        setIsAnalyzing(false); 
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}><ArrowLeft size={20} /></button>
        <h1 style={titleStyle}><span>Smart </span><span style={{ color: '#65a30d' }}>Diagnosis</span></h1>
      </header>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => {setActiveTab('soil'); setResult(null);}} style={{ ...tabBtn, backgroundColor: activeTab === 'soil' ? '#166534' : 'white', color: activeTab === 'soil' ? 'white' : '#166534', border: '1px solid #166534' }}>
          <Activity size={18} /> <span>Soil Test</span>
        </button>
        <button onClick={() => {setActiveTab('pest'); setResult(null);}} style={{ ...tabBtn, backgroundColor: activeTab === 'pest' ? '#991b1b' : 'white', color: activeTab === 'pest' ? 'white' : '#991b1b', border: '1px solid #991b1b' }}>
          <Bug size={18} /> <span>Pest Detection</span>
        </button>
      </div>

      <div style={mainGrid}>
        <div style={cardStyle}>
          {activeTab === 'soil' ? (
            <div className="fade-in">
              <h3 style={flexCenter}><FlaskConical size={20} color="#166534" /> <span>Soil Nutrients (NPK)</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {['n', 'p', 'k'].map((type) => {
                    const label = type === 'n' ? 'Nitrogen' : type === 'p' ? 'Phosphorus' : 'Potassium';
                    return (
                      <div key={type} style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>{label}</label>
                        <input
                          type="number"
                          value={soilData[type]}
                          onChange={(e) => setSoilData({ ...soilData, [type]: e.target.value })}
                          style={inputStyle}
                          placeholder="0 - 140"
                        />
                      </div>
                    );
                })}
              </div>
              <button onClick={runSoilAnalysis} style={analyzeBtn} disabled={isAnalyzing}>
                {isAnalyzing ? <RefreshCw className="spin" size={20} /> : <span>Analyze Soil</span>}
              </button>
            </div>
          ) : (
            <div className="fade-in">
              <h3 style={{...flexCenter, color: '#991b1b'}}><Bug size={20} /> <span>Pest Detection</span></h3>
              <div style={uploadBox}>
                {!selectedImage ? (
                  <>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if(file){ setSelectedFile(file); setSelectedImage(URL.createObjectURL(file)); }}} style={hiddenInput} />
                    <div style={{textAlign: 'center'}}><Upload size={40} color="#64748b" /><p style={{color: '#64748b', marginTop: '10px'}}>Upload Photo</p></div>
                  </>
                ) : (
                  <img src={selectedImage} alt="Scan" style={previewImg} />
                )}
              </div>

              {selectedImage && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    onClick={runPestAI} 
                    disabled={isAnalyzing} 
                    style={{...analyzeBtn, background: '#991b1b', flex: 2}}
                  >
                    {isAnalyzing ? <RefreshCw className="spin" size={20} /> : 'Identify Pest'}
                  </button>
                  
                  <button 
                    onClick={handleClearImage} 
                    disabled={isAnalyzing} 
                    style={{...analyzeBtn, background: '#64748b', flex: 1}}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={resultRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...cardStyle, borderLeft: `10px solid ${result ? '#166534' : '#e2e8f0'}` }}>
            <h3 style={flexCenter}><Microscope size={22} /> <span>Report</span></h3>
            <div style={{minHeight: '120px'}}>
              {isAnalyzing ? (
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <RefreshCw className="spin" size={30} color="#991b1b" />
                  <p style={{marginTop: '10px', fontWeight: 'bold'}}>AI is analyzing... please wait</p>
                </div>
              ) : result ? (
                <div className="fade-in">
                  <p style={{ fontSize: '1.4rem', fontWeight: '900', color: '#14532d' }}><span>{result.condition}</span></p>
                  <div style={adviceBox}>
                    <p><b><span>Advice:</span></b> <span>{result.advice}</span></p>
                  </div>
                  <div style={confidenceBadge}><Zap size={14} color="#f59e0b" /> <span>Confidence: {result.confidence}</span></div>
                </div>
              ) : <p style={{color: '#94a3b8', textAlign: 'center'}}>Upload photo to see details here.</p>}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <SensorMini icon={<Droplets color="#0ea5e9" />} label="Moisture" value={sensors.moisture} />
            <SensorMini icon={<Thermometer color="#f59e0b" />} label="Temperature" value={sensors.temp} />
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.4s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

const SensorMini = ({ icon, label, value }) => (
  <div style={sensorCardStyle}>
    {icon}
    <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}><span>{label}</span></p>
    <p style={{ fontSize: '1.2rem', fontWeight: '900' }}><span>{value}</span></p>
  </div>
);

const containerStyle = { background: '#f0fdf4', minHeight: '100vh', padding: '40px 8%', fontFamily: "'Inter', sans-serif" };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' };
const titleStyle = { fontSize: '2.5rem', fontWeight: '900', color: '#14532d' };
const backBtnStyle = { background: 'white', border: 'none', padding: '12px', borderRadius: '15px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const tabBtn = { padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '10px' };
const mainGrid = { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '40px' };
const cardStyle = { background: 'white', padding: '35px', borderRadius: '35px', boxShadow: '0 15px 35px rgba(0,0,0,0.04)', scrollMarginTop: '20px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '15px', border: '2px solid #f1f5f9' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b' };
const analyzeBtn = { width: '100%', padding: '18px', background: '#166534', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const uploadBox = { border: '3px dashed #cbd5e1', borderRadius: '30px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: '#f8fafc' };
const hiddenInput = { position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' };
const previewImg = { width: '100%', height: '100%', objectFit: 'cover' };
const adviceBox = { background: '#f0fdf4', padding: '20px', borderRadius: '20px', marginTop: '20px', border: '1px solid #dcfce7' };
const confidenceBadge = { fontSize: '13px', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '5px' };
const sensorCardStyle = { flex: 1, background: 'white', padding: '25px', borderRadius: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.02)' };
const flexCenter = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontWeight: '900' };

export default Soil;