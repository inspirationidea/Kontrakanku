import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Download, X, Smartphone } from 'lucide-react';

// Versi aplikasi saat ini — update setiap kali build baru
const CURRENT_VERSION = '1.0.0';

const compareVersions = (v1, v2) => {
  // returns 1 jika v1 > v2, -1 jika v1 < v2, 0 jika sama
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((p1[i] || 0) > (p2[i] || 0)) return 1;
    if ((p1[i] || 0) < (p2[i] || 0)) return -1;
  }
  return 0;
};

const AppUpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Cek versi terbaru dari server (sekali saat app dibuka)
    const check = async () => {
      try {
        // Hanya cek jika sebelumnya belum dismiss di session ini
        if (sessionStorage.getItem('update_dismissed')) return;

        const res = await api.settings.getAppVersion();
        if (!res.success) return;

        const { android } = res.data;
        if (!android?.version) return;

        // Deteksi platform (apakah berjalan di Android via Capacitor)
        const isAndroid = navigator.userAgent.includes('Android') ||
          (typeof window !== 'undefined' && window.Capacitor?.getPlatform?.() === 'android');

        if (isAndroid && compareVersions(android.version, CURRENT_VERSION) > 0) {
          setUpdateInfo({
            version: android.version,
            releaseNotes: android.releaseNotes,
            downloadUrl: android.downloadUrl,
            platform: 'android',
          });
        }
      } catch (e) {
        // Jangan tampilkan error — update check adalah background task
      }
    };

    // Delay 3 detik agar tidak ganggu loading awal
    const timer = setTimeout(check, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!updateInfo || dismissed) return null;

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');
  const downloadUrl = updateInfo.downloadUrl?.startsWith('http')
    ? updateInfo.downloadUrl
    : `${API_BASE}${updateInfo.downloadUrl}`;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('update_dismissed', '1');
  };

  return (
    <div style={styles.banner}>
      <div style={styles.inner}>
        <div style={styles.iconWrap}>
          <Smartphone size={22} color="#fff" />
        </div>
        <div style={styles.text}>
          <p style={styles.title}>🚀 Update Tersedia — v{updateInfo.version}</p>
          {updateInfo.releaseNotes && (
            <p style={styles.notes}>{updateInfo.releaseNotes}</p>
          )}
        </div>
        <div style={styles.actions}>
          <a
            href={downloadUrl}
            download
            style={styles.downloadBtn}
            onClick={handleDismiss}
          >
            <Download size={14} /> Update Sekarang
          </a>
          <button onClick={handleDismiss} style={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  banner: {
    position: 'fixed',
    bottom: '1.25rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9998,
    width: 'calc(100% - 2rem)',
    maxWidth: '520px',
    animation: 'fadeIn 0.4s ease',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.9rem 1rem',
    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
    border: '1px solid rgba(139,92,246,0.4)',
    borderRadius: '14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)',
  },
  iconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    fontFamily: 'var(--font-display)',
  },
  notes: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.6)',
    margin: '0.2rem 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.7)',
    flexShrink: 0,
  },
};

export default AppUpdateChecker;
