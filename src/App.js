import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import "./App.css"; 

// AuthPage
const AuthPage = lazy(() => import('./pages/AuthPage'));

// Lazy Imports
const Navbar = lazy(() => import("./components/Navbar"));
const VoiceGuide = lazy(() => import("./components/VoiceGuide"));
const Home = lazy(() => import("./pages/Home"));
const Weather = lazy(() => import("./pages/Weather"));
const Crop = lazy(() => import("./pages/Crop"));
const Soil = lazy(() => import("./pages/Soil"));
const Community = lazy(() => import("./pages/Community"));
const Schemes = lazy(() => import("./pages/Schemes"));
const PricePrediction = lazy(() => import("./pages/PricePrediction"));
const Insurance = lazy(() => import("./pages/Insurance")); 
const Trainer = lazy(() => import("./pages/Trainer"));

// 🔐 Protected Route Component
// లాగిన్ టోకెన్ ఉంటేనే పేజీని చూపిస్తుంది, లేకపోతే లాగిన్ పేజీకి పంపిస్తుంది.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/auth" replace />;
};

// Loading Spinner
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <div className="loader">లోడ్ అవుతోంది...</div>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <div className="main-content" id="app-root-container">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          
          {/* 🔓 Public Routes (ఎవరైనా చూడొచ్చు) */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* 🔐 Protected Routes (లాగిన్ అయితేనే కనిపిస్తాయి) */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
          <Route path="/crop" element={<ProtectedRoute><Crop /></ProtectedRoute>} />
          <Route path="/soil" element={<ProtectedRoute><Soil /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
          <Route path="/price-prediction" element={<ProtectedRoute><PricePrediction /></ProtectedRoute>} />
          <Route path="/insurance" element={<ProtectedRoute><Insurance /></ProtectedRoute>} /> 
          <Route path="/trainer" element={<ProtectedRoute><Trainer /></ProtectedRoute>} />
          
          {/* ఏదైనా తప్పుడు లింక్ నొక్కితే హోమ్ కి లేదా ఆథ్ కి పంపడానికి */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Navbar />
        <VoiceGuide />
      </Suspense>
      <AppRoutes />
    </Router>
  );
}

export default App;