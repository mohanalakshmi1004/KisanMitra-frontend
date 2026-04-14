import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Search, Calendar,  
  ShieldCheck, Landmark, Tractor, CheckCircle, ArrowLeft, Mic, MicOff 
} from 'lucide-react';

const Schemes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [speakingId, setSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const currentYear = new Date().getFullYear(); 
  
  const announcements = [
    `PM-Kisan ${currentYear} installments scheduled list out now!`,
    `Tractor Subsidy phase 1 deadline: 15 June ${currentYear}.`,
    `Annadata Sukhibhava registration started.`
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Please use Chrome for Voice Search.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; 
    
    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // 🟢 చుక్కలు తీసేసి, చిన్న అక్షరాల్లోకి మార్చి సెర్చ్ చేయడం
      const cleanText = transcript.replace(/[.]/g, "").trim();
      setSearchTerm(cleanText); 
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const speakScheme = (scheme) => {
    if (speakingId === scheme.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const text = `${scheme.title}. ${scheme.desc}. Last date is ${scheme.lastDate}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(scheme.id);
    }
  };

  const allSchemes = [
    { id: 1, title: "PM-Kisan Samman Nidhi", desc: "Financial support for farmers.", lastDate: "31 July", icon: <Landmark size={24} color="#059669"/>, link: "https://pmkisan.gov.in/", keywords: "pm kisan money 6000" },
    { id: 2, title: "Annadata Sukhibhava (AP)", desc: "Investment support for AP Farmers.", lastDate: "15 May", icon: <CheckCircle size={24} color="#ef4444"/>, link: "https://karshak.ap.gov.in/", keywords: "annadata sukhibhava sukhi bawa rythu bharosa" },
    { id: 3, title: "PM Fasal Bima Yojana", desc: "Crop Insurance for natural disasters.", lastDate: "31 August", icon: <ShieldCheck size={24} color="#0ea5e9"/>, link: "https://pmfby.gov.in/", keywords: "panta bheema insurance crop" },
    { id: 4, title: "Farm Machinery Subsidy", desc: "40-50% subsidy on Tractors and tools.", lastDate: "20 June", icon: <Tractor size={24} color="#f59e0b"/>, link: "https://agrimachinery.nic.in/", keywords: "tractor tools machinery subsidy" }
  ];

  // 🟢 స్మార్ట్ ఫిల్టర్ లాజిక్: టైటిల్ లేదా కీవర్డ్స్ లో ఏ ఒక్క పదం మ్యాచ్ అయినా చూపిస్తుంది
  const filtered = allSchemes.filter(s => {
    const search = searchTerm.toLowerCase();
    const words = search.split(' '); // సెర్చ్ ని ముక్కలుగా చేయడం
    
    return words.some(word => 
      s.title.toLowerCase().includes(word) || 
      (s.keywords && s.keywords.toLowerCase().includes(word))
    );
  });

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <div style={styles.titleRow}>
          <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={20}/></button>
          <h2 style={styles.sectionTitle}>Govt. Schemes</h2>
          <div style={styles.notifWrapper} onClick={() => setShowNotifPanel(!showNotifPanel)}>
            <Bell size={24} color="#475569" />
          </div>
        </div>
        
        <div style={styles.searchContainer}>
            <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                placeholder="Search schemes..." 
                style={styles.searchInput} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <button onClick={handleVoiceSearch} style={{...styles.searchMic, color: isListening ? '#ef4444' : '#94a3b8'}}>
                {isListening ? <Mic className="pulse" size={20}/> : <Mic size={20}/>}
              </button>
            </div>
            
            <div style={styles.tickerBox}>
              <div style={{ ...styles.tickerWrapper, transform: `translateY(-${announcementIndex * 48}px)` }}>
                {announcements.map((text, index) => (
                  <div key={index} style={styles.tickerItem}><span style={styles.tickerText}>📢 {text}</span></div>
                ))}
              </div>
            </div>
        </div>

        <div style={styles.schemesGrid}>
          {filtered.length > 0 ? filtered.map(scheme => (
            <div key={scheme.id} style={styles.schemeCard}>
              <div style={styles.cardTop}>
                <div style={styles.iconBox}>{scheme.icon}</div>
                <button onClick={() => speakScheme(scheme)} style={{ ...styles.cardMic, backgroundColor: speakingId === scheme.id ? '#ef4444' : '#f1f5f9' }}>
                  {speakingId === scheme.id ? <MicOff size={18} color="white"/> : <Mic size={18} color="#059669"/>}
                </button>
              </div>
              <h3 style={styles.schemeTitle}>{scheme.title}</h3>
              <p style={styles.schemeDesc}>{scheme.desc}</p>
              <div style={styles.dateBox}><Calendar size={14}/> <span>Last Date: {scheme.lastDate}</span></div>
              <div style={styles.btnRow}>
                <a href={scheme.link} target="_blank" rel="noopener noreferrer" style={styles.applyBtn}>Apply Now</a>
              </div>
            </div>
          )) : (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#64748b'}}>
              "{searchTerm}" కి సంబంధించి ఏమీ దొరకలేదు.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .pulse { animation: pulse-red 1s infinite; }
        @keyframes pulse-red { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
};

// Styles (Preserved)
const styles = {
  pageWrapper: { background: '#f0fdf4', minHeight: '100vh', padding: '40px 0' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '30px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '32px' },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  backBtn: { background: 'white', border: '1px solid #eee', padding: '10px', borderRadius: '12px', cursor: 'pointer' },
  sectionTitle: { fontSize: '24px', fontWeight: '800' },
  searchContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap:'20px', marginBottom: '30px' },
  searchBox: { background: 'white', display: 'flex', alignItems: 'center', padding: '0 15px', borderRadius: '15px', border: '1px solid #e2e8f0', height: '48px' },
  searchInput: { border: 'none', outline: 'none', marginLeft: '10px', flex: 1, fontSize: '15px' },
  searchMic: { border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  tickerBox: { background: '#14532d', borderRadius: '15px', overflow: 'hidden', height: '48px' },
  tickerWrapper: { transition: '0.5s ease-in-out' },
  tickerItem: { height: '48px', display: 'flex', alignItems: 'center', padding: '0 20px' },
  tickerText: { color: 'white', fontSize: '13px' },
  schemesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' },
  schemeCard: { background: 'white', borderRadius: '24px', padding: '25px', border: '1px solid #f1f5f9' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  cardMic: { border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' },
  iconBox: { padding: '10px', background: '#f0fdf4', borderRadius: '12px' },
  schemeTitle: { fontSize: '19px', fontWeight: '800', margin: '0 0 10px 0' },
  schemeDesc: { fontSize: '14px', color: '#64748b', marginBottom: '20px' },
  dateBox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '10px', marginBottom: '20px' },
  btnRow: { display: 'flex', gap: '12px' },
  applyBtn: { flex: 1, background: '#059669', color: 'white', textDecoration: 'none', padding: '12px', borderRadius: '14px', textAlign: 'center', fontWeight: '700' }
};

export default Schemes;