import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, LogOut } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  // 🔐 టోకెన్ చెక్
  const token = localStorage.getItem('token');

  // 🚪 Logout ఫంక్షన్
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const openTranslatePanel = () => {
    const translateRoot = document.getElementById('google_translate_element');
    if (translateRoot) {
      translateRoot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const changeLanguage = (langCode) => {
    const googleTransValue = `/en/${langCode}`;
    document.cookie = `googtrans=${googleTransValue}; path=/; SameSite=Lax`;
    localStorage.setItem('nannaLanguage', langCode);
    window.location.reload();
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Weather', path: '/weather' },
    { name: 'Crop', path: '/crop' },
    { name: 'Soil', path: '/soil' },
    { name: 'Community', path: '/community' },
    { name: 'Schemes', path: '/schemes' },
    { name: 'Price Prediction', path: '/price-prediction' },
    { name: 'Insurance', path: '/insurance' }
  ];

  return (
    <nav style={styles.nav}>
      {/* 🟢 Logo */}
      <div style={styles.logo}>
        <Link to="/" style={{ textDecoration: 'none', color: '#bef264', fontWeight: '900', fontSize: '20px' }}>
          NANNA-FARMER
        </Link>
      </div>

      {/* center links */}
      <div style={styles.linksContainer}>
        {token && navLinks.map((link) => (
          <Link 
            key={link.path}
            to={link.path}
            style={{
              ...styles.link,
              borderBottom: isActive(link.path) ? '4px solid #bef264' : '4px solid transparent',
              color: isActive(link.path) ? '#bef264' : 'white',
            }}
          >
            {link.name}
          </Link>
        ))}

        {/* 🔐 Auth Logic */}
        {!token ? (
          <>
            <Link to="/login" style={styles.authBtn}>Login</Link>
            <Link to="/signup" style={{ ...styles.authBtn, background: '#bef264', color: '#166534' }}>Signup</Link>
          </>
        ) : (
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
        )}
      </div>

      {/* right side */}
      <div style={styles.translatorWrapper}>
        <button type="button" onClick={openTranslatePanel} style={styles.translateIconBtn}>
          <Globe size={18} />
          <span style={styles.translateLabel}>Translate</span>
        </button>

        <div style={styles.btnGroup}>
          <button onClick={() => changeLanguage('en')} style={styles.langBtn}>
            <span style={styles.btnText}>EN</span>
          </button>
          <button onClick={() => changeLanguage('te')} style={styles.langBtn}>
            <span style={styles.btnText}>TE</span>
          </button>
          <button onClick={() => changeLanguage('hi')} style={styles.langBtn}>
            <span style={styles.btnText}>HI</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#166534', 
    padding: '0 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    minHeight: '60px'
  },
  logo: {
    flex: 1,
  },
  linksContainer: {
    display: 'flex',
    gap: '15px',
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  link: {
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 'bold',
    padding: '16px 4px',
    transition: '0.3s ease',
    whiteSpace: 'nowrap'
  },
  authBtn: {
    marginLeft: '10px',
    padding: '6px 16px',
    borderRadius: '8px',
    background: 'white',
    color: '#166534',
    fontWeight: '700',
    textDecoration: 'none',
    fontSize: '14px'
  },
  logoutBtn: {
    marginLeft: '15px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: '#ef4444',
    color: 'white',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  translatorWrapper: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  btnGroup: {
    display: 'flex',
    gap: '5px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '4px',
    borderRadius: '40px'
  },
  langBtn: {
    background: '#bef264',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '20px',
    cursor: 'pointer',
  },
  btnText: {
    fontSize: '10px',
    fontWeight: '900',
    color: '#166534'
  },
  translateIconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.45)',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '999px',
    cursor: 'pointer',
    marginRight: '10px'
  },
  translateLabel: {
    fontSize: '12px',
  }
};

export default Navbar;