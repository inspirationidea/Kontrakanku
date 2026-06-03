import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { UserPlus, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.');
      return;
    }

    const phoneClean = phone.replace(/[\s-]/g, '');
    if (!/^(\+62|62|0)[0-9]{8,13}$/.test(phoneClean)) {
      setErrorMsg('Format nomor HP tidak valid. Contoh: 081234567890');
      return;
    }

    setLoadingLocal(true);
    setErrorMsg('');

    const result = await register(name, email, password, phone);
    setLoadingLocal(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.message || 'Pendaftaran gagal. Email mungkin sudah terdaftar.');
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div className="glass-card fade-in" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <UserPlus size={24} color="#06b6d4" />
          </div>
          <h2 style={styles.title}>Daftar Akun Baru</h2>
          <p style={styles.subtitle}>Buat akun untuk memulai pencarian dan pemesanan kontrakan</p>
        </div>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nama Lengkap</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                id="name"
                type="text"
                className="form-input"
                style={styles.inputField}
                placeholder="Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loadingLocal}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Alamat Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={styles.inputField}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingLocal}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Nomor WhatsApp / HP</label>
            <div style={styles.inputWrapper}>
              <Phone size={18} style={styles.inputIcon} />
              <input
                id="phone"
                type="text"
                className="form-input"
                style={styles.inputField}
                placeholder="0812XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loadingLocal}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Kata Sandi</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={styles.inputField}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loadingLocal}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Konfirmasi Kata Sandi</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                style={styles.inputField}
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loadingLocal}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loadingLocal}
          >
            {loadingLocal ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Sudah memiliki akun? </span>
          <Link to="/login" style={styles.loginLink}>Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
    padding: '2rem 1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '2.5rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  iconContainer: {
    display: 'inline-flex',
    padding: '0.75rem',
    borderRadius: '12px',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.6rem',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    color: '#fca5a5',
    fontSize: '0.85rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  inputField: {
    paddingLeft: '2.75rem',
  },
  submitBtn: {
    width: '100%',
    marginTop: '1rem',
    padding: '0.85rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  loginLink: {
    color: 'var(--secondary)',
    fontWeight: '600',
  },
};

export default Register;
