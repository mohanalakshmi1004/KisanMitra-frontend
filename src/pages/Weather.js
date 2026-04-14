import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Sun, Cloud, CloudRain, Wind, Droplets,
  Search, MapPin, Navigation, CloudLightning, Thermometer
} from 'lucide-react';
import '../App.css';
import bgImage from '../assets/weather.png'; 

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ API Key ని .env నుండి తీసుకుంటున్నాము
  const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

  const fetchByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      setWeatherData(res.data);
      localStorage.setItem("city", res.data.name);
    } catch (err) {
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  }, [API_KEY]); // API_KEY dependency యాడ్ చేశాను

  const getMyLocation = useCallback(() => {
    setLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("Location access denied. Please search manually.");
        setLoading(false);
      }
    );
  }, [fetchByCoords]);

  const fetchByCity = useCallback(async (cityName) => {
    if (!cityName) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      setWeatherData(res.data);
      localStorage.setItem("city", cityName);
    } catch (err) {
      setError("City not found! Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API_KEY]); // API_KEY dependency యాడ్ చేశాను

  useEffect(() => {
    const savedCity = localStorage.getItem("city");
    if (savedCity) {
      fetchByCity(savedCity);
    } else {
      getMyLocation();
    }
  }, [fetchByCity, getMyLocation]);

  const getIcon = (condition) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("cloud")) return <Cloud size={80} color="#90a4ae" />;
    if (lowerCondition.includes("rain")) return <CloudRain size={80} color="#1976d2" />;
    if (lowerCondition.includes("clear")) return <Sun size={80} color="#fbc02d" />;
    if (lowerCondition.includes("thunderstorm")) return <CloudLightning size={80} color="#455a64" />;
    return <Sun size={80} color="#fbc02d" />;
  };

  return (
    <div
      className="weather-wrapper"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      {/* Header Section */}
      <div className="weather-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>Weather Forecast</h1>
        <p style={{ color: '#f0f0f0', marginTop: '5px' }}>Latest weather updates for farmers</p>
      </div>

      {/* Search Controls */}
      <div
        className="search-controls"
        style={{
          width: '100%',
          maxWidth: '450px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '30px'
        }}
      >
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(8px)',
          borderRadius: '30px', 
          padding: '5px 20px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchByCity(city)}
            placeholder="Enter city name..."
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              outline: 'none',
              fontSize: '16px'
            }}
          />
          <Search 
            size={22} 
            color="white" 
            style={{ cursor: 'pointer', opacity: 0.9 }} 
            onClick={() => fetchByCity(city)}
          />
        </div>

        <button 
          onClick={getMyLocation} 
          style={{ 
            marginTop: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            background: '#2e7d32', 
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '30px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1b5e20'}
          onMouseOut={(e) => e.currentTarget.style.background = '#2e7d32'}
        >
          <Navigation size={18} /> My Location
        </button>
      </div>

      {loading && <div style={{ color: 'white', fontWeight: '500' }}>Searching...</div>}
      {error && <div style={{ color: '#ff5252', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '10px', marginBottom: '10px' }}>{error}</div>}

      {weatherData && !loading && (
        <div
          className="weather-display-card"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '28px',
            padding: '30px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid rgba(255, 255, 255, 0.5)', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.3)',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#1a237e' }}>
             <MapPin size={24} color="#d32f2f" />
             <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '800' }}>{weatherData.name}, {weatherData.sys.country}</h2>
          </div>

          <div style={{ margin: '25px 0' }}>
             <div style={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))' }}>
                {getIcon(weatherData.weather[0].main)}
             </div>
             <h1 style={{ fontSize: '64px', margin: '5px 0', color: '#1a237e', fontWeight: '900' }}>{Math.round(weatherData.main.temp)}°C</h1>
             <p style={{ textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', color: '#555', fontSize: '14px' }}>{weatherData.weather[0].description}</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px',
            marginTop: '25px' 
          }}>
            {[
              { label: 'Humidity', val: `${weatherData.main.humidity}%`, icon: <Droplets size={22} color="#0288d1" />, bColor: '#0288d1' },
              { label: 'Wind', val: `${weatherData.wind.speed}m/s`, icon: <Wind size={22} color="#455a64" />, bColor: '#455a64' },
              { label: 'Max Temp', val: `${Math.round(weatherData.main.temp_max)}°C`, icon: <Thermometer size={22} color="#f4511e" />, bColor: '#f4511e' }
            ].map((item, index) => (
              <div key={index} style={{
                padding: '15px 5px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.6)',
                borderBottom: `5px solid ${item.bColor}`, 
                border: `1px solid ${item.bColor}22`, 
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
              }}>
                {item.icon}
                <p style={{ fontSize: '11px', margin: '8px 0 4px', color: '#666', fontWeight: '600' }}>{item.label}</p>
                <p style={{ fontWeight: '800', margin: 0, color: '#222' }}>{item.val}</p>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '18px', 
            borderRadius: '18px', 
            background: weatherData.main.humidity > 80 ? '#fffde7' : '#f1f8e9',
            border: `1.5px solid ${weatherData.main.humidity > 80 ? '#fbc02d' : '#4caf50'}`,
            boxShadow: `0 0 15px ${weatherData.main.humidity > 80 ? 'rgba(251,192,45,0.2)' : 'rgba(76,175,80,0.2)'}`,
            fontSize: '14px',
            color: '#333',
            lineHeight: '1.5',
            textAlign: 'left',
            fontWeight: '600'
          }}>
            {weatherData.main.humidity > 80
              ? "⚠️ Humidity is high. Risk of pest attacks. Monitor fields closely!"
              : "✅ Weather is favorable for agricultural activities. Good time for work!"}
          </div>
        </div>
      )}
    </div>
  );
};

export default Weather;