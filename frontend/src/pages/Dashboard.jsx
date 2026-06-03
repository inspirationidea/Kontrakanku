import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { ShieldCheck, ShieldAlert, CreditCard, Upload, RefreshCw, XCircle, Bell, BellOff, CheckCheck, Clock, AlertCircle, CheckCircle2, Home, MessageSquarePlus, MessageSquareWarning, Wrench, CheckCircle, Image } from 'lucide-react';

const Dashboard = () => {
  const { user, refreshUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '', unitInfo: '' });
  const [complaintPhoto, setComplaintPhoto] = useState(null);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Redirect admin ke panel admin — dashboard ini khusus penyewa
  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, navigate]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.auth.uploadAvatar(fd);
      if (res.success) await refreshUser();
    } catch (err) {
      toast(err.message || 'Gagal upload foto profil.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [ktpPhoto, setKtpPhoto] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.notifications.getAll();
      if (res.success) setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => api.notifications.markRead(n.id).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const refreshAll = async () => {
    await Promise.all([fetchUserBookings(), fetchNotifications(), fetchComplaints()]);
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.complaints.getAll();
      if (res.success) setComplaints(res.data);
    } catch (e) { console.error(e); }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.unitInfo || !complaintForm.subject || !complaintForm.description) return;
    setSubmittingComplaint(true);
    try {
      const fd = new FormData();
      fd.append('unitInfo', complaintForm.unitInfo);
      fd.append('subject', complaintForm.subject);
      fd.append('description', complaintForm.description);
      if (complaintPhoto) fd.append('complaintPhoto', complaintPhoto);
      const res = await api.complaints.create(fd);
      if (res.success) {
        setComplaints(prev => [res.data, ...prev]);
        setShowComplaintForm(false);
        setComplaintForm({ subject: '', description: '', unitInfo: '' });
        setComplaintPhoto(null);
      }
    } catch (err) {
      toast(err.message || 'Gagal mengirim keluhan.', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // ── Helpers ──
  const fmt = (n) => n ? 'Rp ' + Number(n).toLocaleString('id-ID') : 'Rp 0';

  const calcDuration = (start, end) => {
    const days = Math.max(0, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
    const months = Math.floor(days / 30);
    const remDays = days % 30;
    if (months > 0 && remDays > 0) return `${months} bln ${remDays} hr`;
    if (months > 0) return `${months} bulan`;
    return `${days} hari`;
  };

  const daysLeft = (end) => {
    const diff = Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilDue = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const startEditProfile = () => {
    setProfileForm({ name: user?.name || '', phone: user?.phone || '' });
    setProfileMsg('');
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true); setProfileMsg('');
    try {
      const res = await api.auth.updateProfile(profileForm.name, profileForm.phone);
      if (res.success) {
        await refreshUser();
        setEditingProfile(false);
        toast('Profil berhasil disimpan!', 'success');
      }
    } catch (err) {
      toast(err.message || 'Gagal menyimpan profil.', 'error');
      setProfileMsg(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (pwdForm.next.length < 6) { setPwdError('Password baru minimal 6 karakter.'); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Konfirmasi password tidak cocok.'); return; }
    try {
      const res = await api.auth.changePassword(pwdForm.current, pwdForm.next);
      if (res.success) {
        toast('Password berhasil diubah!', 'success');
        setPwdForm({ current: '', next: '', confirm: '' });
        setShowChangePwd(false);
      }
    } catch (err) {
      toast(err.message || 'Gagal mengubah password.', 'error');
      setPwdError(err.message || 'Gagal mengubah password.');
    }
  };

  const fetchUserBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.bookings.getAll();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching user bookings:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchUserBookings();
      await fetchNotifications();
      await fetchComplaints();
    };
    init();
  }, []);

  const handleKtpFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setKtpPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKtpUpload = async (e) => {
    e.preventDefault();
    if (!ktpPhoto) return;

    setUploadingKtp(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('ktpPhoto', ktpPhoto);

      const res = await api.auth.uploadKtp(formData);
      if (res.success) {
        setUploadSuccess('KTP berhasil diunggah. Mohon tunggu verifikasi admin.');
        setKtpPhoto(null);
        setKtpPreview(null);
        await refreshUser(); // reload profile verification status
      } else {
        setUploadError(res.message || 'Gagal mengunggah foto KTP.');
      }
    } catch (err) {
      setUploadError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setUploadingKtp(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan booking ini?')) return;
    try {
      const res = await api.bookings.cancel(bookingId);
      if (res.success) {
        toast('Booking berhasil dibatalkan.', 'success');
        fetchUserBookings();
      }
    } catch (err) {
      toast(err.message || 'Gagal membatalkan booking.', 'error');
    }
  };

  const handlePayRedirect = (book) => {
    // Find the pending payment for this booking
    const pendingPayment = book.payments?.find(p => p.status === 'PENDING');
    if (pendingPayment) {
      navigate('/payment', { state: { booking: book, payment: pendingPayment } });
    } else {
      toast('Tidak ada tagihan tertunda untuk booking ini.', 'warning');
    }
  };


  return (
    <div className="main-content fade-in" style={styles.container}>
      <h1 style={styles.pageTitle}>Dashboard Saya</h1>

      <div className="dashboard-grid">
        {/* Left Side: Profile & KTP + Notifikasi */}
        <div style={styles.profileSection}>
          <div className="glass-card" style={styles.card}>
            {/* Profile header */}
            <div style={styles.profileHeader}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ ...styles.avatar, overflow: 'hidden', cursor: 'pointer' }} title="Klik untuk ganti foto profil" onClick={() => document.getElementById('avatarInput').click()}>
                  {user?.profilePhoto ? (
                    <img
                      src={`${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${user.profilePhoto}`}
                      alt="Foto Profil"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>
                {uploadingAvatar && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: -4, right: -4, width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', border: '2px solid var(--bg-main)' }} onClick={() => document.getElementById('avatarInput').click()}>
                  ✏️
                </div>
                <input id="avatarInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingProfile ? (
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      className="form-input"
                      style={{ fontSize: '0.9rem', padding: '0.45rem 0.75rem' }}
                      placeholder="Nama lengkap"
                      value={profileForm.name}
                      onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                    <input
                      className="form-input"
                      style={{ fontSize: '0.9rem', padding: '0.45rem 0.75rem' }}
                      placeholder="No HP / WhatsApp"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem' }} disabled={savingProfile}>
                        {savingProfile ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem' }} onClick={() => setEditingProfile(false)}>
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2 style={styles.profileName}>{user?.name}</h2>
                    <p style={styles.profileEmail}>{user?.email}</p>
                    <p style={styles.profilePhone}>{user?.phone || 'No HP Belum Ditambahkan'}</p>
                  </>
                )}
              </div>
              {!editingProfile && (
                <button onClick={startEditProfile} title="Edit profil" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                  ✏️
                </button>
              )}
            </div>
            {profileMsg && <p style={{ fontSize: '0.78rem', color: profileMsg.includes('berhasil') ? '#34d399' : '#fca5a5', marginTop: '0.5rem', textAlign: 'center' }}>{profileMsg}</p>}

            <div style={styles.divider}></div>

            {/* Change Password */}
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => { setShowChangePwd(v => !v); setPwdError(''); setPwdSuccess(''); }}
                style={{ ...styles.pickerBtn, width: '100%', justifyContent: 'center', marginBottom: showChangePwd ? '0.75rem' : 0 }}
              >
                🔑 {showChangePwd ? 'Batal Ganti Password' : 'Ganti Password'}
              </button>
              {showChangePwd && (
                <form onSubmit={handleChangePwd} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {pwdError && <p style={styles.errorText}>{pwdError}</p>}
                  {pwdSuccess && <p style={styles.successText}>{pwdSuccess}</p>}
                  <input type="password" placeholder="Password lama" className="form-input" value={pwdForm.current} onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))} required />
                  <input type="password" placeholder="Password baru (min 6 karakter)" className="form-input" value={pwdForm.next} onChange={e => setPwdForm(f => ({ ...f, next: e.target.value }))} required />
                  <input type="password" placeholder="Konfirmasi password baru" className="form-input" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} required />
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem' }}>Simpan Password Baru</button>
                </form>
              )}
            </div>

            <div style={styles.divider}></div>

            {/* Verification Status */}
            <div>
              <p style={styles.subtitle}>Status Verifikasi Akun</p>
              {user?.isVerified ? (
                <div style={styles.verifiedBox}>
                  <ShieldCheck size={20} color="var(--color-success)" />
                  <span style={styles.verifiedText}>Terverifikasi (KTP Disetujui)</span>
                </div>
              ) : (
                <div style={styles.unverifiedBox}>
                  <ShieldAlert size={20} color="var(--color-warning)" />
                  <span style={styles.unverifiedText}>Belum Terverifikasi</span>
                </div>
              )}

              {/* Upload KTP form if not verified */}
              {!user?.isVerified && (
                <form onSubmit={handleKtpUpload} style={styles.ktpForm}>
                  <p style={styles.ktpHelpText}>
                    Unggah KTP Anda agar dapat melakukan pemesanan kontrakan. Admin akan meninjau berkas Anda secara berkala.
                  </p>
                  
                  {uploadError && <p style={styles.errorText}>{uploadError}</p>}
                  {uploadSuccess && <p style={styles.successText}>{uploadSuccess}</p>}

                  {user?.ktpPhoto && (
                    <div style={styles.existingKtp}>
                      <span>Dokumen KTP saat ini: </span>
                      <a href={`${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${user.ktpPhoto}`} target="_blank" rel="noreferrer" style={styles.ktpLink}>Lihat KTP</a>
                    </div>
                  )}

                  <div style={styles.filePickerWrapper}>
                    <input
                      type="file"
                      id="ktpDashboardUpload"
                      accept="image/*"
                      onChange={handleKtpFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="ktpDashboardUpload" className="btn btn-secondary" style={styles.pickerBtn}>
                      <Upload size={16} />
                      <span>{ktpPhoto ? 'Ganti File KTP' : 'Pilih Foto KTP'}</span>
                    </label>
                    {ktpPhoto && <span style={styles.fileName}>{ktpPhoto.name}</span>}
                  </div>

                  {ktpPreview && (
                    <div style={styles.previewBox}>
                      <img src={ktpPreview} alt="KTP Preview" style={styles.previewImg} />
                    </div>
                  )}

                  {ktpPhoto && (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={styles.uploadBtn}
                      disabled={uploadingKtp}
                    >
                      {uploadingKtp ? 'Mengunggah...' : 'Kirim File KTP'}
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* ── Keluhan — di atas Notifikasi ── */}
          <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showComplaintForm || complaints.length > 0 ? '0.85rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquareWarning size={16} color="#f59e0b" />
                <h2 style={{ ...styles.sectionTitle, fontSize: '1rem' }}>Keluhan & Laporan</h2>
                {complaints.filter(c => c.status !== 'CLOSED').length > 0 && (
                  <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.45rem', borderRadius: '20px' }}>
                    {complaints.filter(c => c.status !== 'CLOSED').length}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  const activeBook = bookings.find(b => ['ACTIVE','CONFIRMED'].includes(b.status));
                  const autoUnit = activeBook ? `${activeBook.unit?.unitNumber} - ${activeBook.unit?.property?.name}` : '';
                  setComplaintForm(f => ({ ...f, unitInfo: autoUnit }));
                  setShowComplaintForm(v => !v);
                }}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem', gap: '0.3rem' }}
              >
                <MessageSquarePlus size={14} /> Buat Keluhan
              </button>
            </div>

            {/* Form */}
            {showComplaintForm && (
              <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={styles.durationLabel}>Nama Penyewa</p>
                    <div className="form-input" style={{ padding: '0.45rem 0.7rem', opacity: 0.7, fontSize: '0.82rem' }}>{user?.name}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.durationLabel}>Unit / Kamar</p>
                    <select className="form-input" style={{ padding: '0.45rem 0.7rem', fontSize: '0.82rem' }} value={complaintForm.unitInfo} onChange={e => setComplaintForm(f => ({ ...f, unitInfo: e.target.value }))} required>
                      <option value="">Pilih unit...</option>
                      {bookings.filter(b => ['ACTIVE','CONFIRMED','PENDING'].includes(b.status)).map(b => (
                        <option key={b.id} value={`${b.unit?.unitNumber} - ${b.unit?.property?.name}`}>
                          {b.unit?.unitNumber} — {b.unit?.property?.name}
                        </option>
                      ))}
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p style={styles.durationLabel}>Judul Keluhan *</p>
                  <input className="form-input" style={{ fontSize: '0.82rem' }} placeholder="Contoh: AC rusak, kebocoran atap..." value={complaintForm.subject} onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))} required />
                </div>
                <div>
                  <p style={styles.durationLabel}>Deskripsi Detail *</p>
                  <textarea className="form-input" style={{ fontSize: '0.82rem', minHeight: '75px', resize: 'vertical' }} placeholder="Jelaskan masalah secara detail..." value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))} required />
                </div>
                <div>
                  <p style={styles.durationLabel}>Foto Pendukung (opsional)</p>
                  <div style={{ border: '2px dashed var(--border-light)', borderRadius: '10px', padding: '0.65rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => document.getElementById('complaintPhotoInput').click()}>
                    <input id="complaintPhotoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setComplaintPhoto(e.target.files[0] || null)} />
                    <Image size={18} color="var(--text-muted)" style={{ margin: '0 auto 0.25rem' }} />
                    <p style={{ fontSize: '0.75rem', color: complaintPhoto ? '#34d399' : 'var(--text-muted)', margin: 0 }}>
                      {complaintPhoto ? `✓ ${complaintPhoto.name}` : 'Klik untuk pilih foto'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem' }} disabled={submittingComplaint}>
                    {submittingComplaint ? 'Mengirim...' : '📤 Kirim ke Admin'}
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 0.4, padding: '0.6rem', fontSize: '0.82rem' }} onClick={() => setShowComplaintForm(false)}>
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Daftar keluhan */}
            {complaints.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                {complaints.map(c => {
                  const stMap = {
                    PENDING:     { label: 'Pending',  color: '#60a5fa', icon: <Clock size={11} /> },
                    IN_PROGRESS: { label: 'Diproses', color: '#fbbf24', icon: <Wrench size={11} /> },
                    CLOSED:      { label: 'Selesai',  color: '#34d399', icon: <CheckCircle size={11} /> },
                  };
                  const st = stMap[c.status] || stMap.PENDING;
                  return (
                    <div key={c.id} style={{ padding: '0.7rem 0.85rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${st.color}`, border: `1px solid rgba(255,255,255,0.05)`, borderLeftWidth: '3px', borderLeftColor: st.color }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-white)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>{c.unitInfo} · {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}44`, fontSize: '0.65rem', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {st.icon} {st.label}
                        </span>
                      </div>
                      {c.adminNote && (
                        <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(16,185,129,0.07)', borderLeft: '2px solid #34d399' }}>
                          <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: '0 0 0.1rem', fontWeight: '600' }}>RESPON ADMIN</p>
                          <p style={{ fontSize: '0.76rem', color: '#d1fae5', margin: 0 }}>{c.adminNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!showComplaintForm && complaints.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0, paddingTop: '0.25rem' }}>Belum ada keluhan yang dikirim.</p>
            )}
          </div>

          {/* Notifikasi — di dalam kolom kiri */}
          <div className="glass-card" style={{ ...styles.notifSection, marginTop: '1rem' }}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell size={16} color="var(--primary)" />
                <h2 style={{ ...styles.sectionTitle, fontSize: '1rem' }}>Notifikasi</h2>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={styles.unreadBadge}>{notifications.filter(n => !n.isRead).length}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={markAllRead} style={styles.refreshBtn} title="Tandai semua dibaca"><CheckCheck size={14} /></button>
                )}
                <button onClick={fetchNotifications} style={styles.refreshBtn}><RefreshCw size={14} /></button>
              </div>
            </div>
            {loadingNotifs ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Memuat...</div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.25rem 0', color: 'var(--text-muted)' }}>
                <BellOff size={26} style={{ opacity: 0.3, marginBottom: '0.4rem' }} />
                <p style={{ fontSize: '0.8rem' }}>Belum ada notifikasi.</p>
              </div>
            ) : (
              <div style={{ ...styles.notifList, maxHeight: '300px' }}>
                {notifications.map(n => {
                  const typeColor = { INFO: '#60a5fa', BOOKING: '#a78bfa', PAYMENT: '#34d399', DANGER: '#f87171' }[n.type] || '#9ca3af';
                  return (
                    <div key={n.id}
                      style={{ ...styles.notifItem, background: n.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(139,92,246,0.06)', borderLeft: `3px solid ${n.isRead ? 'rgba(255,255,255,0.06)' : typeColor}` }}
                      onClick={() => !n.isRead && api.notifications.markRead(n.id).then(() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)))}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ ...styles.notifTitle, fontSize: '0.82rem', color: n.isRead ? 'var(--text-muted)' : 'var(--text-white)' }}>{n.title}</p>
                        <p style={{ ...styles.notifBody, fontSize: '0.75rem' }}>{n.body}</p>
                        <p style={styles.notifTime}>{new Date(n.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.isRead && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: typeColor, flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Rents & Bills */}
        <div style={styles.rentsSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Pemesanan & Tagihan</h2>
            <button onClick={refreshAll} style={styles.refreshBtn} title="Perbarui status">
              <RefreshCw size={16} />
            </button>
          </div>

          {loadingBookings ? (
            <div style={styles.spinnerWrapper}><div style={styles.spinner}></div></div>
          ) : bookings.length === 0 ? (
            <div className="glass-card" style={styles.emptyCard}>
              <Home size={36} color="var(--text-muted)" />
              <p>Anda belum memiliki riwayat pemesanan kontrakan.</p>
              <button onClick={() => navigate('/')} className="btn btn-primary">Cari Properti Sekarang</button>
            </div>
          ) : (
            <div style={styles.bookingsList}>
              {bookings.map((book) => {
                const start = new Date(book.startDate);
                const end   = new Date(book.endDate);
                const remaining = daysLeft(book.endDate);
                const duration  = calcDuration(book.startDate, book.endDate);
                const pendingPayment = book.payments?.find(p => p.status === 'PENDING');
                const paidPayment    = book.payments?.find(p => p.status === 'PAID');
                const dueIn = pendingPayment?.dueDate ? daysUntilDue(pendingPayment.dueDate) : null;

                const statusMap = {
                  PENDING:   { label: 'Menunggu Konfirmasi', cls: 'badge-pending',     color: '#60a5fa' },
                  CONFIRMED: { label: 'Dikonfirmasi',        cls: 'badge-pending',     color: '#a78bfa' },
                  ACTIVE:    { label: 'Aktif',               cls: 'badge-available',   color: '#34d399' },
                  COMPLETED: { label: 'Selesai',             cls: 'badge-occupied',    color: '#9ca3af' },
                  CANCELLED: { label: 'Dibatalkan',          cls: 'badge-maintenance', color: '#f87171' },
                };
                const st = statusMap[book.status] || statusMap.PENDING;

                return (
                  <div key={book.id} className="glass-card" style={styles.bookingCard}>

                    {/* ── Header ── */}
                    <div style={styles.bookCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Home size={18} color="var(--primary)" />
                        </div>
                        <div>
                          <h3 style={styles.propName}>{book.unit?.property?.name}</h3>
                          <p style={styles.unitDetail}>
                            Unit {book.unit?.unitNumber} · {book.unit?.type} · {fmt(book.unit?.price)}/bln
                          </p>
                        </div>
                      </div>
                      <span style={{ background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}50`, fontSize: '0.72rem', fontWeight: '700', padding: '0.25rem 0.7rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                        ● {st.label}
                      </span>
                    </div>

                    <div style={styles.bookingDivider}></div>

                    {/* ── Durasi & Sisa Hari ── */}
                    <div style={styles.durationRow}>
                      <div style={styles.durationBox}>
                        <p style={styles.durationLabel}>Mulai Sewa</p>
                        <p style={styles.durationVal}>{start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div style={{ ...styles.durationBox, textAlign: 'center', background: 'rgba(139,92,246,0.08)', borderRadius: 10, padding: '0.5rem 0.85rem' }}>
                        <p style={styles.durationLabel}>Durasi</p>
                        <p style={{ ...styles.durationVal, color: 'var(--primary)', fontWeight: '800' }}>{duration}</p>
                      </div>
                      <div style={{ ...styles.durationBox, textAlign: 'right' }}>
                        <p style={styles.durationLabel}>Selesai Sewa</p>
                        <p style={styles.durationVal}>{end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Sisa hari (hanya jika ACTIVE) */}
                    {book.status === 'ACTIVE' && (
                      <div style={{ ...styles.remainingBar, background: remaining <= 7 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.07)', borderColor: remaining <= 7 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)' }}>
                        <Clock size={14} color={remaining <= 7 ? '#f87171' : '#34d399'} />
                        <span style={{ color: remaining <= 7 ? '#f87171' : '#34d399', fontWeight: '600', fontSize: '0.82rem' }}>
                          {remaining > 0 ? `${remaining} hari lagi masa sewa berakhir` : 'Masa sewa telah berakhir'}
                        </span>
                      </div>
                    )}

                    <div style={styles.bookingDivider}></div>

                    {/* ── Pembayaran ── */}
                    <div>
                      <p style={styles.payLabel}>Status Pembayaran</p>

                      {book.status === 'PENDING' && (
                        <div style={styles.payRow}>
                          <AlertCircle size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ color: '#60a5fa', fontWeight: '600', fontSize: '0.85rem', margin: 0 }}>Menunggu konfirmasi admin</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Pembayaran akan diaktifkan setelah admin menyetujui booking Anda.</p>
                          </div>
                        </div>
                      )}

                      {book.status === 'CONFIRMED' && pendingPayment && (
                        <div style={{ ...styles.payBlock, borderColor: dueIn !== null && dueIn <= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)', background: dueIn !== null && dueIn <= 3 ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div>
                              <p style={{ color: '#fbbf24', fontWeight: '700', fontSize: '0.82rem', margin: 0 }}>⏳ Belum Dibayar</p>
                              <p style={{ color: 'var(--text-white)', fontSize: '1.1rem', fontWeight: '800', margin: '0.2rem 0 0', fontFamily: 'var(--font-display)' }}>{fmt(pendingPayment.amount)}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Jatuh Tempo</p>
                              <p style={{ color: dueIn !== null && dueIn <= 3 ? '#f87171' : '#fbbf24', fontWeight: '700', fontSize: '0.82rem', margin: '0.15rem 0 0' }}>
                                {pendingPayment.dueDate ? new Date(pendingPayment.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                              {dueIn !== null && (
                                <p style={{ color: dueIn <= 0 ? '#f87171' : dueIn <= 3 ? '#fb923c' : '#9ca3af', fontSize: '0.72rem', margin: 0 }}>
                                  {dueIn <= 0 ? 'Sudah lewat!' : `${dueIn} hari lagi`}
                                </p>
                              )}
                            </div>
                          </div>
                          <button onClick={() => handlePayRedirect(book)} className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', fontSize: '0.9rem' }}>
                            <CreditCard size={16} /> Bayar Sekarang
                          </button>
                        </div>
                      )}

                      {book.status === 'ACTIVE' && paidPayment && (
                        <div style={{ ...styles.payBlock, borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ color: '#34d399', fontWeight: '700', fontSize: '0.82rem', margin: 0 }}>✅ Sudah Dibayar</p>
                              <p style={{ color: 'var(--text-white)', fontSize: '1.1rem', fontWeight: '800', margin: '0.2rem 0 0', fontFamily: 'var(--font-display)' }}>{fmt(paidPayment.amount)}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Tanggal Bayar</p>
                              <p style={{ color: '#34d399', fontWeight: '600', fontSize: '0.82rem', margin: '0.15rem 0 0' }}>
                                {paidPayment.paidAt ? new Date(paidPayment.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                              {paidPayment.method && <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>{paidPayment.method.replace('_', ' ')}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {book.status === 'ACTIVE' && !paidPayment && !pendingPayment && (
                        <div style={styles.payRow}>
                          <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
                          <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: '600' }}>Pembayaran telah lunas</span>
                        </div>
                      )}

                      {book.status === 'CANCELLED' && (
                        <div style={styles.payRow}>
                          <XCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
                          <span style={{ color: '#f87171', fontSize: '0.85rem' }}>Booking dibatalkan — tidak ada tagihan aktif</span>
                        </div>
                      )}
                    </div>

                    {/* ── Aksi ── */}
                    {(book.status === 'PENDING' || book.status === 'ACTIVE' || book.status === 'COMPLETED') && (
                      <>
                        <div style={styles.bookingDivider}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Total Tagihan</p>
                            <p style={{ color: 'var(--secondary)', fontWeight: '800', fontSize: '1.1rem', margin: '0.1rem 0 0', fontFamily: 'var(--font-display)' }}>{fmt(book.totalPrice)}</p>
                          </div>
                          {book.status === 'PENDING' && (
                            <button onClick={() => handleCancelBooking(book.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                              <XCircle size={15} /> Batalkan
                            </button>
                          )}
                          {book.status === 'ACTIVE' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.82rem', fontWeight: '600' }}>
                              <ShieldCheck size={16} /> Sedang Aktif
                            </div>
                          )}
                        </div>
                      </>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontFamily: 'var(--font-display)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '1.5rem',
  },
  profileSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    padding: '2rem',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.8rem',
  },
  profileName: {
    fontSize: '1.25rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  profilePhone: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
  divider: {
    height: '1px',
    background: 'var(--border-light)',
    margin: '1.5rem 0',
  },
  subtitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
  },
  verifiedBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  unverifiedBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#fbbf24',
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  ktpForm: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  ktpHelpText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  filePickerWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  pickerBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    borderRadius: '8px',
  },
  fileName: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  previewBox: {
    marginTop: '0.5rem',
    border: '1px solid var(--border-light)',
    borderRadius: '8px',
    padding: '0.25rem',
    display: 'flex',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '140px',
    objectFit: 'contain',
    borderRadius: '6px',
  },
  uploadBtn: {
    padding: '0.6rem',
    fontSize: '0.85rem',
    borderRadius: '8px',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: '0.75rem',
  },
  successText: {
    color: '#34d399',
    fontSize: '0.75rem',
  },
  existingKtp: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  ktpLink: {
    color: 'var(--secondary)',
    textDecoration: 'underline',
  },
  rentsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
  },
  refreshBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-main)',
    borderRadius: '8px',
    padding: '0.4rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  emptyCard: {
    padding: '3rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    color: 'var(--text-muted)',
  },
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  bookingCard: {
    padding: '1.5rem',
  },
  bookCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propName: {
    fontSize: '1.15rem',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
  },
  unitDetail: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
  bookingDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.05)',
    margin: '1rem 0',
  },
  bookMeta: {
    display: 'flex',
    gap: '2rem',
  },
  metaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  metaVal: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-white)',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    borderRadius: '8px',
  },
  actionBtnPrimary: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.8rem',
    borderRadius: '8px',
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: '#34d399',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  spinnerWrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: '3rem 0',
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: '3px solid rgba(139, 92, 246, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  durationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    margin: '0.25rem 0',
  },
  durationBox: {
    flex: 1,
  },
  durationLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600',
    margin: 0,
  },
  durationVal: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: 'var(--text-white)',
    margin: '0.15rem 0 0',
  },
  remainingBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid',
    margin: '0.5rem 0 0',
  },
  payLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600',
    marginBottom: '0.6rem',
  },
  payRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.65rem 0.85rem',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  payBlock: {
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: '1px solid',
  },
  notifSection: {
    padding: '1.5rem',
  },
  unreadBadge: {
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '0.1rem 0.45rem',
    borderRadius: '20px',
    minWidth: '20px',
    textAlign: 'center',
  },
  notifList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  notifTitle: {
    fontSize: '0.88rem',
    fontWeight: '700',
    margin: 0,
    lineHeight: 1.3,
  },
  notifBody: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    margin: '0.25rem 0 0',
    lineHeight: 1.5,
  },
  notifTime: {
    fontSize: '0.7rem',
    color: 'rgba(156,163,175,0.6)',
    margin: '0.35rem 0 0',
  },
};

export default Dashboard;
