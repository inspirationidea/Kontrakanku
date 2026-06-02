import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../utils/api';
import { LogIn, Mail, Lock, AlertCircle, KeyRound, X } from 'lucide-react';

// Forgot password steps: 'email' | 'otp' | 'done'
const ForgotModal = ({ onClose }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [demoOtp, setDemoOtp] = useState(''); // shown for demo

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setErrMsg('');
    try {
      const res = await api.auth.forgotPassword(email);
      if (res.success) {
        setDemoOtp(res.data.otp); // for demo: show OTP
        setStep('otp');
      }
    } catch (err) {
      setErrMsg(err.message || 'Email tidak ditemukan.');
    } finally { setLoading(false); }
  };

  const doReset = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) { setErrMsg('Password minimal 6 karakter.'); return; }
    if (newPwd !== confirmPwd) { setErrMsg('Konfirmasi password tidak cocok.'); return; }
    setLoading(true); setErrMsg('');
    try {
      const res = await api.auth.resetPassword(email, otp, newPwd);
      if (res.success) setStep('done');
    } catch (err) {
      setErrMsg(err.message || 'Kode OTP salah atau sudah kadaluarsa.');
    } finally { setLoading(false); }
  };

  return (
    <div style={ms.backdrop} onClick={onClose}>
      <div style={ms.modal} onClick={e => e.stopPropagation()}>
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <KeyRound size={20} color="var(--primary)" />
            <h3 style={ms.title}>Reset Password</h3>
          </div>
          <button onClick={onClose} style={ms.closeBtn}><X size={18} /></button>
        </div>

        {step === 'email' && (
          <form onSubmit={requestOtp} style={ms.form}>
            <p style={ms.desc}>Masukkan email akun Anda. Kode OTP akan dibuat untuk reset password.</p>
            {errMsg && <p style={ms.err}>{errMsg}</p>}
            <input type="email" className="form-input" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="btn btn-primary" style={ms.btn} disabled={loading}>
              {loading ? 'Memproses...' : 'Kirim Kode OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={doReset} style={ms.form}>
            <p style={ms.desc}>Masukkan kode OTP yang diberikan dan buat password baru.</p>
            {demoOtp && (
              <div style={ms.otpDemo}>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0 0 0.25rem' }}>
                  [MODE DEMO] Kode OTP Anda:
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b', fontFamily: 'monospace', letterSpacing: '0.15em', margin: 0 }}>
                  {demoOtp}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0.25rem 0 0' }}>Berlaku 15 menit</p>
              </div>
            )}
            {errMsg && <p style={ms.err}>{errMsg}</p>}
            <input type="text" className="form-input" placeholder="6-digit OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required />
            <input type="password" className="form-input" placeholder="Password baru (min 6 karakter)" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
            <input type="password" className="form-input" placeholder="Konfirmasi password baru" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
            <button type="submit" className="btn btn-primary" style={ms.btn} disabled={loading}>
              {loading ? 'Mereset...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Password Berhasil Direset!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Silakan login dengan password baru Anda.</p>
            <button onClick={onClose} className="btn btn-primary" style={ms.btn}>Kembali ke Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ms = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: 'rgba(18,14,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title: { fontSize: '1.1rem', fontWeight: '700', color: '#f9fafb', fontFamily: "'Outfit',sans-serif", margin: 0 },
  closeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  desc: { fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 0.25rem' },
  err: { color: '#fca5a5', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', margin: 0 },
  btn: { width: '100%', padding: '0.75rem', marginTop: '0.25rem' },
  otpDemo: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi Anda.');
      return;
    }
    setLoadingLocal(true);
    setErrorMsg('');
    const result = await login(email, password);
    setLoadingLocal(false);
    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.message || 'Login gagal. Email atau password salah.');
    }
  };

  return (
    <div style={styles.pageContainer}>
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}

      <div className="glass-card fade-in" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <LogIn size={24} color="#8b5cf6" />
          </div>
          <h2 style={styles.title}>Masuk ke Akun Anda</h2>
          <p style={styles.subtitle}>Akses data kontrakan, riwayat booking & pembayaran Anda</p>
        </div>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Alamat Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input id="email" type="email" className="form-input" style={styles.inputField} placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loadingLocal} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Kata Sandi</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input id="password" type="password" className="form-input" style={styles.inputField} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loadingLocal} required />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
              Lupa Password?
            </button>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loadingLocal}>
            {loadingLocal ? 'Menghubungkan...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Belum memiliki akun? </span>
          <Link to="/register" style={styles.registerLink}>Daftar di sini</Link>
        </div>

        <div style={styles.adminFooter}>
          <Link to="/admin/login" style={styles.adminLink}>Masuk sebagai Admin →</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '1.5rem' },
  card: { width: '100%', maxWidth: '440px', padding: '2.5rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  iconContainer: { display: 'inline-flex', padding: '0.75rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '1rem' },
  title: { fontSize: '1.6rem', marginBottom: '0.5rem' },
  subtitle: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  errorAlert: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#fca5a5', fontSize: '0.85rem' },
  form: { display: 'flex', flexDirection: 'column' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
  inputField: { paddingLeft: '2.75rem' },
  submitBtn: { width: '100%', marginTop: '0.5rem', padding: '0.85rem' },
  footer: { textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' },
  registerLink: { color: 'var(--secondary)', fontWeight: '600' },
  adminFooter: { textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' },
  adminLink: { fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600', opacity: 0.7, transition: 'opacity 0.2s ease' },
};

export default Login;
