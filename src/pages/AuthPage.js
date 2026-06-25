import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const translations = {
  en: {
    login: 'Login',
    signup: 'Sign Up',
    fullName: 'Full Name',
    identifier: 'Email or Mobile Number',
    password: 'Password',
    identifierPlaceholder: 'Email or phone',
    passwordPlaceholder: '••••••••',
    submitLogin: 'Login',
    submitSignup: 'Sign Up',
    successLogin: 'Login successful! Redirecting to home...',
    successSignup: 'Signup successful! Please login now.',
    serverError: 'Server not reachable!',
  },
  te: {
    login: 'లాగిన్',
    signup: 'సైన్ అప్',
    fullName: 'పూర్తి పేరు',
    identifier: 'ఇమెయిల్ లేదా మొబైల్ నంబర్',
    password: 'పాస్‌వర్డ్',
    identifierPlaceholder: 'ఇమెయిల్ లేదా ఫోన్',
    passwordPlaceholder: '••••••••',
    submitLogin: 'లాగిన్',
    submitSignup: 'సైన్ అప్',
    successLogin: 'లాగిన్ సక్సెస్! హోమ్ పేజీకి వెళ్తున్నాము...',
    successSignup: 'సైన్ అప్ సక్సెస్! దయచేసి లాగిన్ అవ్వండి.',
    serverError: 'సర్వర్ కనెక్ట్ అవ్వడం లేదు!',
  },
  hi: {
    login: 'लॉगिन',
    signup: 'साइन अप',
    fullName: 'पूरा नाम',
    identifier: 'ईमेल या मोबाइल नंबर',
    password: 'पासवर्ड',
    identifierPlaceholder: 'ईमेल या फोन',
    passwordPlaceholder: '••••••••',
    submitLogin: 'लॉगिन',
    submitSignup: 'साइन अप',
    successLogin: 'लॉगिन सफल! होम पेज पर जा रहे हैं...',
    successSignup: 'साइन अप सफल! कृपया लॉगिन करें।',
    serverError: 'सर्वर से कनेक्ट नहीं हो पा रहा है!',
  },
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({ name: '', identifier: '', password: '' });
  const navigate = useNavigate();

  const currentLanguage = localStorage.getItem('nannaLanguage') || 'en';
  const t = translations[currentLanguage] || translations.en;
  const API_URL = "https://kisanmitra-backend-9t41.onrender.com/api/auth"; 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? `${API_URL}/login` : `${API_URL}/signup`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          setMessage({ text: t.successLogin, type: 'success' });
          localStorage.setItem('token', data.token);
          const userName = (data.user?.name || formData.identifier || '').trim();
          localStorage.setItem('currentUser', userName);
          localStorage.setItem('userName', userName);
          localStorage.setItem('userIdentifier', formData.identifier || '');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setMessage({ text: data.message || t.successSignup, type: 'success' });
          setTimeout(() => setIsLogin(true), 2000);
        }
      } else {
        setMessage({ text: data.message || t.serverError, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: t.serverError, type: 'error' });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>{t.login}</button>
          <button className={!isLogin ? "active" : ""} onClick={() => setIsLogin(false)}>{t.signup}</button>
        </div>

        <div className="auth-content">
          {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-field">
                <label>{t.fullName}</label>
                <input type="text" name="name" onChange={handleChange} required />
              </div>
            )}
            <div className="input-field">
              <label>{t.identifier}</label>
              <input type="text" name="identifier" onChange={handleChange} placeholder={t.identifierPlaceholder} required />
            </div>
            <div className="input-field">
              <label>{t.password}</label>
              <input type="password" name="password" onChange={handleChange} placeholder={t.passwordPlaceholder} required />
            </div>
            <button type="submit" className="main-btn">{isLogin ? t.submitLogin : t.submitSignup}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
