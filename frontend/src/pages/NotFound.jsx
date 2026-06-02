import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container} className="fade-in">
      <div className="glass-card" style={styles.card}>
        <div style={styles.iconWrap}>
          <Compass size={48} color="var(--primary)" />
        </div>
        <h1 style={styles.code}>404</h1>
        <h2 style={styles.title}>Halaman Tidak Ditemukan</h2>
        <p style={styles.desc}>
          Halaman yang Anda cari tidak ada atau mungkin telah dipindahkan.
          Kembali ke peta untuk menemukan kontrakan impian Anda.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
          style={styles.btn}
        >
          <ArrowLeft size={18} />
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem 1.5rem',
  },
  card: {
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    padding: '3rem 2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  iconWrap: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '50%',
    padding: '1.25rem',
    display: 'inline-flex',
    marginBottom: '0.5rem',
  },
  code: {
    fontSize: '5rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: '1',
    margin: 0,
  },
  title: {
    fontSize: '1.5rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    color: 'var(--text-white)',
    margin: 0,
  },
  desc: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    maxWidth: '340px',
    margin: '0.25rem 0 0.5rem',
  },
  btn: {
    marginTop: '0.5rem',
    padding: '0.75rem 1.75rem',
  },
};

export default NotFound;
