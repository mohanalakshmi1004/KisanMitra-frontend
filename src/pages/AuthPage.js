import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({ name: '', identifier: '', password: '' });
  const navigate = useNavigate();

  const API_URL = "http://localhost:5000/api/auth"; 

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
          setMessage({ text: 'లాగిన్ సక్సెస్! హోమ్ పేజీకి వెళ్తున్నాము...', type: 'success' });
          localStorage.setItem('token', data.token); 
          setTimeout(() => navigate('/'), 2000);
        } else {
          setMessage({ text: data.message, type: 'success' });
          setTimeout(() => setIsLogin(true), 2000);
        }
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'సర్వర్ కనెక్ట్ అవ్వడం లేదు!', type: 'error' });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>Login</button>
          <button className={!isLogin ? "active" : ""} onClick={() => setIsLogin(false)}>Sign Up</button>
        </div>

        <div className="auth-content">
          {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-field">
                <label>పూర్తి పేరు (Full Name)</label>
                <input type="text" name="name" onChange={handleChange} required />
              </div>
            )}
            <div className="input-field">
              <label>Email లేదా Mobile Number</label>
              <input type="text" name="identifier" onChange={handleChange} placeholder="మెయిల్ లేదా ఫోన్" required />
            </div>
            <div className="input-field">
              <label>Password</label>
              <input type="password" name="password" onChange={handleChange} placeholder="••••••••" required />
            </div>
            <button type="submit" className="main-btn">{isLogin ? "Login" : "Sign Up"}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;