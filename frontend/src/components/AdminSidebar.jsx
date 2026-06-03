import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  PlusCircle,
  LogOut,
  Home,
  ChevronRight,
  Users,
  Settings,
  MessageSquareWarning,
  Globe,
  UserCog,
} from 'lucide-react';

const AdminSidebar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const menuItems = [
    // SuperAdmin exclusive
    ...(isSuperAdmin ? [
      { id: 'global', label: 'Monitor Global', icon: Globe, superAdminOnly: true },
      { id: 'manage-admins', label: 'Kelola Admin', icon: UserCog, superAdminOnly: true },
    ] : []),
    // Common menu
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'bookings', label: 'Kelola Booking', icon: ClipboardList },
    { id: 'tenants', label: 'Data Penyewa', icon: Users },
    { id: 'complaints', label: 'Keluhan Penyewa', icon: MessageSquareWarning },
    { id: 'properties', label: 'Properti & Unit', icon: Building2 },
    { id: 'add-property', label: 'Tambah Properti', icon: PlusCircle },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Admin Brand */}
      <div style={styles.brand}>
        <img
          src="/kontrakanku.png"
          alt="KontrakanKu"
          style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div>
          <h2 style={styles.brandTitle}>KontrakanKu</h2>
          <span style={styles.brandSub}>{user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin Panel'}</span>
        </div>
      </div>

      <div style={styles.divider}></div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <p style={styles.navLabel}>MENU UTAMA</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
                ...(item.superAdminOnly && !isActive ? { color: '#a78bfa', background: 'rgba(139,92,246,0.06)', borderLeft: '2px solid rgba(139,92,246,0.3)' } : {}),
              }}
            >
              <Icon size={18} style={{ opacity: isActive ? 1 : 0.75 }} />
              <span style={styles.navItemText}>{item.label}</span>
              {item.superAdminOnly && !isActive && <span style={{ fontSize: '0.55rem', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '700' }}>SA</span>}
              {isActive && <ChevronRight size={14} style={styles.navArrow} />}
            </button>
          );
        })}
      </nav>

      <div style={styles.divider}></div>

      {/* Quick Links */}
      <nav style={styles.nav}>
        <p style={styles.navLabel}>LAINNYA</p>
        <button
          onClick={() => navigate('/')}
          style={styles.navItem}
        >
          <Home size={18} style={{ opacity: 0.6 }} />
          <span style={styles.navItemText}>Kembali ke Beranda</span>
        </button>
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* User Profile + Logout */}
      <div style={styles.userSection}>
        <div style={styles.userAvatar}>
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div style={styles.userInfo}>
          <p style={styles.userName}>{user?.name}</p>
          <p style={styles.userRole}>
            {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Administrator'}
          </p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Keluar">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
    borderRight: '1px solid rgba(245, 158, 11, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem 0.75rem',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1100,
    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    marginBottom: '0.25rem',
  },
  brandIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#f9fafb',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.03em',
    margin: 0,
  },
  brandSub: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
    margin: '0.75rem 0.5rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navLabel: {
    fontSize: '0.6rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '0.5rem 0.75rem 0.4rem',
    margin: 0,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.65rem 0.75rem',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
    color: '#fbbf24',
    fontWeight: '600',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  navItemText: {
    flex: 1,
  },
  navArrow: {
    opacity: 0.5,
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.75rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
    fontFamily: "'Outfit', sans-serif",
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#f3f4f6',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.65rem',
    color: '#6b7280',
    margin: 0,
  },
  logoutBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    background: 'rgba(239, 68, 68, 0.08)',
    color: '#f87171',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
};

export default AdminSidebar;
