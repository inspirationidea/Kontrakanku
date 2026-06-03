import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { User, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navStyle = (path) => ({
    ...styles.navLink,
    ...(pathname === path ? styles.navLinkActive : {}),
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-nav" style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <img
            src="/kontrakanku.png"
            alt="KontrakanKu"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span className="gradient-text" style={styles.logoText}>KontrakanKu</span>
        </Link>

        <div style={styles.links}>
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin" style={styles.navLinkAdmin}>
                  <LayoutDashboard size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}
              {!isAdmin && (
                <Link to="/dashboard" style={navStyle('/dashboard')}>
                  <User size={18} />
                  <span>Dashboard Saya</span>
                </Link>
              )}
              <div style={styles.userInfo}>
                <span style={styles.userName}>Hi, {user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
                  <LogOut size={16} />
                  <span style={styles.logoutText}>Keluar</span>
                </button>
              </div>
            </>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.loginLink}>Masuk</Link>
              <Link to="/register" className="btn btn-primary" style={styles.registerBtn}>Daftar</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'rgba(10, 7, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0.85rem 1.5rem',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 'bold',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--text-muted)',
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    color: 'var(--secondary)',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.25)',
    fontWeight: '700',
  },
  navLinkAdmin: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#a78bfa',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
    paddingLeft: '1rem',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-white)',
  },
  logoutBtn: {
    padding: '0.4rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  logoutText: {
    marginLeft: '0.2rem',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  loginLink: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-white)',
    padding: '0.5rem 1rem',
  },
  registerBtn: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.85rem',
    borderRadius: '10px',
  },
};

export default Navbar;
