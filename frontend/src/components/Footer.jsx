import { Link } from 'react-router-dom';
import { Compass, MapPin, Phone, Mail, Smartphone } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div className="footer-grid" style={styles.inner}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.logoRow}>
            <Compass size={20} color="var(--secondary)" />
            <span style={styles.logoText}>KontrakanKu</span>
          </div>
          <p style={styles.tagline}>Platform pencarian & pemesanan kontrakan terpercaya di seluruh Indonesia.</p>
          <a
            href="/KontrakanKu.apk"
            download="KontrakanKu.apk"
            style={styles.apkBtn}
          >
            <Smartphone size={14} />
            <span>Download APK Android</span>
          </a>
        </div>

        {/* Links */}
        <div style={styles.links}>
          <p style={styles.colTitle}>Navigasi</p>
          <Link to="/" style={styles.link}>Peta Properti</Link>
          <Link to="/login" style={styles.link}>Masuk</Link>
          <Link to="/register" style={styles.link}>Daftar</Link>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        </div>

        {/* Contact */}
        <div style={styles.contact}>
          <p style={styles.colTitle}>Kontak</p>
          <div style={styles.contactItem}>
            <MapPin size={14} color="var(--text-muted)" />
            <span>Bandung, Jawa Barat, Indonesia</span>
          </div>
          <a href="tel:+6281234567890" style={styles.contactItem}>
            <Phone size={14} color="var(--text-muted)" />
            <span>+62 812-3456-7890</span>
          </a>
          <a href="mailto:hello@kontrakanku.id" style={styles.contactItem}>
            <Mail size={14} color="var(--text-muted)" />
            <span>hello@kontrakanku.id</span>
          </a>
        </div>
      </div>

      <div style={styles.bottom}>
        <p style={styles.copy}>© {year} KontrakanKu. Semua hak dilindungi.</p>
        <p style={styles.copy}>Dibuat dengan ❤️ untuk memudahkan pencarian hunian.</p>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    borderTop: '1px solid var(--border-light)',
    background: 'rgba(10, 7, 18, 0.95)',
    backdropFilter: 'blur(12px)',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2.5rem 1.5rem 1.5rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.1rem',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  apkBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    marginTop: '0.75rem',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
    border: '1px solid rgba(139,92,246,0.3)',
    borderRadius: '20px', padding: '0.4rem 0.9rem',
    fontSize: '0.78rem', fontWeight: '600',
    color: '#a78bfa', textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  tagline: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    maxWidth: '280px',
  },
  links: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  colTitle: {
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: '700',
    color: 'var(--text-main)',
    marginBottom: '0.25rem',
  },
  link: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    transition: 'var(--transition-smooth)',
    ':hover': { color: 'var(--secondary)' },
  },
  contact: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    textDecoration: 'none',
  },
  bottom: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    borderTop: '1px solid var(--border-light)',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  copy: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
};

export default Footer;
