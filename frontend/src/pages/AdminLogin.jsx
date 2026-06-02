import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi administrator.');
      return;
    }

    setLoadingLocal(true);
    setErrorMsg('');

    const result = await login(email, password);
    setLoadingLocal(false);

    if (result.success) {
      if (result.user?.role === 'ADMIN' || result.user?.role === 'SUPERADMIN') {
        navigate('/admin');
      } else {
        // Regular user tried to use admin login
        setErrorMsg('Akun ini tidak memiliki hak akses administrator.');
      }
    } else {
      setErrorMsg(result.message || 'Login gagal. Email atau password salah.');
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel — branding */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.brandMark}>
            <Shield size={32} color="#f59e0b" />
          </div>
          <h1 style={styles.brandTitle}>KontrakanKu</h1>
          <p style={styles.brandSub}>Admin Control Panel</p>

          <div style={styles.divider}></div>

          <div style={styles.featureList}>
            {[
              'Kelola seluruh properti & unit kamar',
              'Verifikasi identitas penyewa (KTP)',
              'Terima & tolak pengajuan booking',
              'Konfirmasi pembayaran manual',
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureDot}></span>
                <span style={styles.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Background decoration */}
        <div style={styles.bgOrb1}></div>
        <div style={styles.bgOrb2}></div>
      </div>

      {/* Right panel — form */}
      <div style={styles.rightPanel}>
        <Link to="/login" style={styles.backLink}>
          <ArrowLeft size={15} />
          <span>Login sebagai Penyewa</span>
        </Link>

        <div style={styles.formBox}>
          <div style={styles.formHeader}>
            <div style={styles.iconRing}>
              <Shield size={22} color="#f59e0b" />
            </div>
            <h2 style={styles.formTitle}>Masuk sebagai Admin</h2>
            <p style={styles.formSubtitle}>
              Akses eksklusif untuk pengelola KontrakanKu
            </p>
          </div>

          {errorMsg && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="adminEmail">
                Email Administrator
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  id="adminEmail"
                  type="email"
                  style={styles.input}
                  placeholder="admin@kontrakanku.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loadingLocal}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="adminPassword">
                Kata Sandi
              </label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...styles.input, paddingRight: '2.75rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loadingLocal}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                opacity: loadingLocal ? 0.7 : 1,
                cursor: loadingLocal ? 'not-allowed' : 'pointer',
              }}
              disabled={loadingLocal}
            >
              {loadingLocal ? (
                <>
                  <span style={styles.spinner}></span>
                  Mengautentikasi...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Masuk ke Panel Admin
                </>
              )}
            </button>
          </form>

          <p style={styles.footerNote}>
            Hanya akun dengan role <strong style={{ color: '#f59e0b' }}>Admin</strong> atau{' '}
            <strong style={{ color: '#f59e0b' }}>SuperAdmin</strong> yang dapat mengakses panel ini.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0b0f19',
    fontFamily: "'Inter', sans-serif",
  },

  // ── Left branding panel ──
  leftPanel: {
    flex: '0 0 420px',
    background: 'linear-gradient(160deg, #111827 0%, #0f172a 60%, #1c1209 100%)',
    borderRight: '1px solid rgba(245, 158, 11, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
  },
  brandMark: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
    boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)',
  },
  brandTitle: {
    fontSize: '2.2rem',
    fontWeight: '900',
    fontFamily: "'Outfit', sans-serif",
    color: '#f9fafb',
    letterSpacing: '-0.04em',
    margin: 0,
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginTop: '0.4rem',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, transparent 100%)',
    margin: '2rem 0',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  featureDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#f59e0b',
    flexShrink: 0,
    marginTop: '5px',
    boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)',
  },
  featureText: {
    fontSize: '0.88rem',
    color: '#9ca3af',
    lineHeight: '1.5',
  },
  bgOrb1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
    top: '-80px',
    right: '-80px',
    zIndex: 1,
  },
  bgOrb2: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, transparent 70%)',
    bottom: '-40px',
    left: '-40px',
    zIndex: 1,
  },

  // ── Right form panel ──
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    position: 'relative',
  },
  backLink: {
    position: 'absolute',
    top: '1.5rem',
    left: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    color: '#6b7280',
    fontWeight: '500',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  formBox: {
    width: '100%',
    maxWidth: '420px',
  },
  formHeader: {
    marginBottom: '2rem',
  },
  iconRing: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  formTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    fontFamily: "'Outfit', sans-serif",
    color: '#f3f4f6',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  formSubtitle: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '0.4rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
    color: '#f87171',
    fontSize: '0.82rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: '0.02em',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.9rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.6rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.35)',
    color: '#e5e7eb',
    fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.85rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.85rem',
    borderRadius: '11px',
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#fff',
    fontSize: '0.92rem',
    fontWeight: '700',
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
    marginTop: '0.5rem',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  footerNote: {
    marginTop: '1.75rem',
    fontSize: '0.75rem',
    color: '#4b5563',
    lineHeight: '1.5',
    textAlign: 'center',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    background: 'rgba(245, 158, 11, 0.04)',
    border: '1px solid rgba(245, 158, 11, 0.08)',
  },
};

export default AdminLogin;
