import React from 'react';
import { Link } from 'react-router-dom';

// Added Lucide Icons
import '../styles/home.css'; 
import cropImg from '../assets/profilecrop.avif'; 
import pestImg from '../assets/pestcontrol.jpg';
import priceImg from '../assets/price.jpg'; 
import govtImg from '../assets/government.jpg';
import insuranceImg from '../assets/insurance.jpeg';
import communityImg from '../assets/community.jpeg';

const Home = () => {
  const farmerTools = [
    {
      title: 'Crop Recommendation',
      description: 'AI analysis for best yield.',
      image: cropImg,
      path: '/crop',
    },
    {
      title: 'Pest & Disease',
      description: 'Scan leaf photos for issues.',
      image: pestImg,
      path: '/soil',
    },
    {
      title: 'Price Prediction',
      description: 'Future market rates & trends.',
      image: priceImg,
      path: '/price-prediction',
    },
    {
      title: 'Govt Schemes',
      description: 'Alerts on subsidies & help.',
      image: govtImg,
      path: '/schemes',
    },
    {
      title: 'Crop Insurance',
      description: 'Protect from climate risks.',
      image: insuranceImg,
      path: '/insurance',
    },
    {
      title: 'Farmer Community',
      description: 'Telugu Voice Chat & Forum.',
      image: communityImg,
      path: '/community',
    },
  ];

  return (
    <>
      <section className="hero-section" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/home.png)` }}>
        {/* Google Translator ఇక్కడి నుంచి తీసేశాము */}
        <div className="hero-content-box">
          <div className="sky-text">
            <h1>Namaste, <span>Farmer</span></h1>
          </div>

          <div className="weather-extreme-lock">
            <div className="weather-glass-card">
              <span className="live-tag">● LIVE WEATHER</span>
              <div className="temp-large">31°C</div>
              <p className="city-small">Visakhapatnam</p>
              <Link to="/weather" className="weather-view-btn">View Forecast</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DASHBOARD SECTION */}
      <section className="dashboard-grid-container">
        <h2 className="dashboard-title-main">Smart Farming Tools</h2>

        <div className="dashboard-3-grid">
          {farmerTools.map((tool, index) => (
            <div key={index} className="premium-tool-card">
              <div className="card-color-bar"></div>
              <div className="icon-frame">
                <img src={tool.image} alt={tool.title} />
              </div>

              <div className="tool-info">
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <Link to={tool.path} className="tool-go-btn">Get Started</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ABOUT / MATTER RELATED SECTION */}
      <section className="about-info-section">
        <div className="about-container">
          <div className="about-text">
            <h2>Empowering Farmers with AI Technology</h2>
            <p>
              Nanna-Farmer bridges the gap between traditional agricultural wisdom and modern artificial intelligence.
              Our mission is to help farmers in Andhra Pradesh and beyond maximize their crop yields, protect against
              diseases, and secure the best market prices.
            </p>
            <div className="stats-row">
              <div className="stat-item">
                <h3>98%</h3>
                <p>AI Accuracy</p>
              </div>
              <div className="stat-item">
                <h3>24/7</h3>
                <p>Telugu Voice Support</p>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Nanna-Farmer. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Home;