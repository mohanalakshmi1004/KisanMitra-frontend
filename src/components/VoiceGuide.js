import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Volume2, VolumeX } from "lucide-react";

const VoiceGuide = () => {
  const location = useLocation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const lastSpokenText = useRef(""); 

  // 1. వాయిస్‌లను లోడ్ చేయడం
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => window.speechSynthesis.cancel();
  }, []);

  const getSelectedLang = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nannaLanguage');
      if (stored) return stored;
    }
    const googleCookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
    let lang = "en";
    if (googleCookie) {
      lang = googleCookie.split('/').pop(); 
    } else {
      lang = document.documentElement.lang || "en";
    }
    return lang.includes("te") ? "te" : lang.includes("hi") ? "hi" : "en";
  }, []);

  const speak = useCallback((text, speed = 0.8) => {
    if (!window.speechSynthesis || !text || text.trim() === lastSpokenText.current) return;

    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = getSelectedLang();
    const langCode = lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-US";
    
    utterance.lang = langCode;
    utterance.rate = speed;
    
    const voice = voices.find(v => v.lang.includes(langCode) && v.name.includes("Google"));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      lastSpokenText.current = text.trim();
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices, getSelectedLang]);

  // 🎯 ఫిక్స్: MutationObserver తీసేసి 'voice-result' ఈవెంట్ వింటున్నాం
  useEffect(() => {
    const handleVoiceEvent = (event) => {
      const textToSpeak = event.detail.text;
      if (textToSpeak) {
        const lang = getSelectedLang();
        const intro = lang === "te" ? "ఫలితాలు ఇవే: " : 
                      lang === "hi" ? "परिणाम: " : "Result is: ";
        speak(intro + textToSpeak, 0.75);
      }
    };

    // Soil.js నుండి వచ్చే ఈవెంట్ ని వినడం
    window.addEventListener('voice-result', handleVoiceEvent);
    
    return () => {
      window.removeEventListener('voice-result', handleVoiceEvent);
      window.speechSynthesis.cancel();
    };
  }, [speak, getSelectedLang]);

  const handleGuideClick = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const lang = getSelectedLang();
    const instructions = {
      te: { "/": "నానా-ఫార్మర్ హోమ్ పేజీకి స్వాగతం. సైట్‌లో నావిగేట్ చేయడానికి బటన్ పైన క్లిక్ చేయండి.", "/crop": "పంట సూచన కోసం NPK విలువలు నమోదు చేసి విశ్లేషించండి.", "/soil": "నేల పరీక్ష కోసం NPK విలువలు నమోదు చేసి విశ్లేషించండి.", default: "వివరాలు నమోదు చేయండి." },
      hi: { "/": "नाना-फार्मर होम पेज में आपका स्वागत है। ऊपर के बटन से नेविगेट करें।", "/crop": "कृपया NPK मान दर्ज करें और विश्लेषण करें।", "/soil": "कृपया NPK मान दर्ज करें और विश्लेषण करें।", default: "कृपया आवश्यक जानकारी दर्ज करें।" },
      en: { "/": "Welcome to Nanna Farmer home page. Use the buttons to navigate.", "/crop": "Enter NPK values to analyze crop recommendation.", "/soil": "Enter NPK values to analyze soil health.", default: "Please enter the required details." }
    };
    const msg = instructions[lang]?.[location.pathname] || instructions[lang]?.default || instructions.en.default;
    speak(msg);
  };

  return (
    <div style={styles.wrapper} className="notranslate" translate="no">
      <button onClick={handleGuideClick} style={styles.button}>
        {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
        <span style={styles.label}>{isSpeaking ? (getSelectedLang() === 'te' ? "ఆపండి" : getSelectedLang() === 'hi' ? "रोकें" : "Stop") : (getSelectedLang() === 'te' ? "వాయిస్" : getSelectedLang() === 'hi' ? "वॉइस" : "Voice")}</span>
      </button>
    </div>
  );
};

const styles = {
  wrapper: { position: "fixed", bottom: "20px", right: "20px", zIndex: 10000 },
  button: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#166534", color: "white", border: "2px solid #bef264",
    borderRadius: "50px", padding: "12px 20px", cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)", fontWeight: "bold"
  },
  label: { marginLeft: "5px" }
};

export default VoiceGuide;