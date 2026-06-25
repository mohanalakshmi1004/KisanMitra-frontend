import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import { Bug, Upload, ArrowLeft, RefreshCw, Zap, Activity } from 'lucide-react';

// This URL points to your Node.js server
const API_BASE_URL = "http://localhost:5000/api";

const Soil = () => {
  const navigate = useNavigate();
  const resultRef = useRef(null);

  const [activeTab, setActiveTab] = useState('soil'); 
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [soilData, setSoilData] = useState({ n: '', p: '', k: '' });


  const fetchLiveSensors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensors`);
      setSensors({ moisture: response.data.moisture, temp: response.data.temp, loading: false });
    } catch (error) {
      // Silently fail - using default sensor values
    }
  };

  useEffect(() => {
    fetchLiveSensors();
    const interval = setInterval(fetchLiveSensors, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClearImage = () => {
    if (selectedImage) URL.revokeObjectURL(selectedImage);
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
      const response = await axios.post(`${API_BASE_URL}/predict/soil`, { n, p, k });
      if (response.data.success) {
        setResult({ 
            condition: response.data.soilType, 
            advice: response.data.treatment, 
            confidence: response.data.confidence + "%" 
        });
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      setResult({ condition: "Error", advice: "Backend not connected. Start server.js!", status: "Warning" });
    } finally { setIsAnalyzing(false); }
  };

  const runPestAI = async () => {
    if (!selectedFile) return alert('Please upload a photo!');
    setIsAnalyzing(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    try {
        const { data } = await axios.post(`${API_BASE_URL}/predict/pest-gemini`, formData);
        if (data.success) {
            setResult({ 
              condition: data.disease, 
              advice: data.treatment, 
              confidence: data.confidence + "%", 
            });
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    } catch (err) {
        setResult({ condition: "Error", advice: "Check if your Node.js server is running.", status: "Warning" });
    } finally { setIsAnalyzing(false); }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}><ArrowLeft size={20} /></button>
        <h1 style={titleStyle}>Smart <span style={{ color: '#65a30d' }}>Diagnosis</span></h1>
      </header>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => setActiveTab('soil')} style={{ ...tabBtn, backgroundColor: activeTab === 'soil' ? '#166534' : 'white', color: activeTab === 'soil' ? 'white' : '#166534' }}>
          <Activity size={18} /> Soil Test
        </button>
        <button onClick={() => setActiveTab('pest')} style={{ ...tabBtn, backgroundColor: activeTab === 'pest' ? '#991b1b' : 'white', color: activeTab === 'pest' ? 'white' : '#991b1b' }}>
          <Bug size={18} /> Pest Detection
        </button>
      </div>

      <div style={mainGrid}>
        <div style={cardStyle}>
          {activeTab === 'soil' ? (
            <div>
              <h3>Soil Nutrients (NPK)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {['n', 'p', 'k'].map((type) => (
                  <div key={type}>
                    <label style={labelStyle}>{type.toUpperCase()}</label>
                    <input type="number" value={soilData[type]} onChange={(e) => setSoilData({ ...soilData, [type]: e.target.value })} style={inputStyle} placeholder="0-140" />
                  </div>
                ))}
              </div>
              <button onClick={runSoilAnalysis} style={analyzeBtn} disabled={isAnalyzing}>
                {isAnalyzing ? <RefreshCw className="spin" size={20} /> : "Analyze Soil"}
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{color: '#991b1b'}}>Pest Detection</h3>
              <div style={uploadBox}>
                {!selectedImage ? (
                  <>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if(file){ setSelectedFile(file); setSelectedImage(URL.createObjectURL(file)); }}} style={hiddenInput} />
                    <div style={{textAlign: 'center'}}><Upload size={40} color="#64748b" /><p>Upload Photo</p></div>
                  </>
                ) : <img src={selectedImage} alt="Scan" style={previewImg} />}
              </div>
              {selectedImage && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={runPestAI} style={{...analyzeBtn, background: '#991b1b', flex: 2}}>Identify Pest</button>
                  <button onClick={handleClearImage} style={{...analyzeBtn, background: '#64748b', flex: 1}}>Clear</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={resultRef}>
          <div style={{ ...cardStyle, borderLeft: `10px solid ${result ? '#166534' : '#e2e8f0'}` }}>
            <h3>Report</h3>
            {isAnalyzing ? <RefreshCw className="spin" size={30} /> : result ? (
              <div>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{result.condition}</p>
                <div style={adviceBox}><p><b>Advice:</b> {result.advice}</p></div>
                <div style={confidenceBadge}><Zap size={14} color="#f59e0b" /> Confidence: {result.confidence}</div>
              </div>
            ) : <p>Results will appear here...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES (Keep these from your original code) ---
const containerStyle = { background: '#f0fdf4', minHeight: '100vh', padding: '40px 8%' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' };
const titleStyle = { fontSize: '2.5rem', fontWeight: '900', color: '#14532d' };
const backBtnStyle = { background: 'white', border: 'none', padding: '12px', borderRadius: '15px', cursor: 'pointer' };
const tabBtn = { padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '10px', border: '1px solid #ccc' };
const mainGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' };
const cardStyle = { background: 'white', padding: '35px', borderRadius: '35px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '15px', border: '1px solid #ddd' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b' };
const analyzeBtn = { width: '100%', padding: '15px', background: '#166534', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' };
const uploadBox = { border: '2px dashed #ccc', borderRadius: '20px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' };
const hiddenInput = { position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' };
const previewImg = { width: '100%', height: '100%', objectFit: 'cover' };
const adviceBox = { background: '#f0fdf4', padding: '15px', borderRadius: '15px', marginTop: '10px' };
const confidenceBadge = { fontSize: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' };

export default Soil;