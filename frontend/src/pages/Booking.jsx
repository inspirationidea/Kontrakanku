import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/useAuth';
import { Calendar, Upload, AlertCircle, FileText, ArrowRight, ShieldAlert } from 'lucide-react';

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const unitId = location.state?.unitId;
  
  const [unit, setUnit] = useState(null);
  const [loadingUnit, setLoadingUnit] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ktpPhoto, setKtpPhoto] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Price calculations (derived via useMemo below)

  useEffect(() => {
    if (!unitId) {
      navigate('/');
      return;
    }

    const fetchUnitDetails = async () => {
      try {
        // Find property first since backend returns units nested
        const res = await api.properties.getAll();
        if (res.success) {
          // Look inside all properties' units to find our unit
          let foundUnit = null;
          let foundProp = null;
          for (const prop of res.data) {
            // Need to get full detailed property to access complete units details
            const detailRes = await api.properties.getById(prop.id);
            if (detailRes.success) {
              const u = detailRes.data.units.find(item => item.id === unitId);
              if (u) {
                foundUnit = u;
                foundProp = detailRes.data;
                break;
              }
            }
          }

          if (foundUnit) {
            setUnit({ ...foundUnit, property: foundProp });
          } else {
            setErrorMsg('Data unit tidak ditemukan.');
          }
        }
      } catch {
        setErrorMsg('Gagal memuat informasi unit kontrakan.');
      } finally {
        setLoadingUnit(false);
      }
    };

    fetchUnitDetails();
  }, [unitId, navigate]);

  // Recalculate duration & pricing (derived)
  const { rentMonths, totalRent, totalBill } = useMemo(() => {
    if (!startDate || !endDate || !unit) {
      return { rentMonths: 0, totalRent: 0, totalBill: 0 };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!(start < end)) {
      return { rentMonths: 0, totalRent: 0, totalBill: 0 };
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.max(1, Math.ceil(diffDays / 30));

    const rentTotal = unit.price * months;
    const billTotal = rentTotal + unit.deposit;

    return { rentMonths: months, totalRent: rentTotal, totalBill: billTotal };
  }, [startDate, endDate, unit]);

  const handleFileChange = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMsg('Harap tentukan tanggal mulai dan selesai sewa.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setErrorMsg('Tanggal selesai sewa harus setelah tanggal mulai sewa.');
      return;
    }

    // Must have KTP either uploaded now or on profile
    if (!ktpPhoto && !user?.ktpPhoto) {
      setErrorMsg('Harap unggah foto KTP Anda untuk proses verifikasi identitas.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('unitId', unitId);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      if (ktpPhoto) {
        formData.append('ktpPhoto', ktpPhoto);
      }

      const res = await api.bookings.create(formData);
      if (res.success) {
        // Redirect to simulated payment page with response booking and payment info
        navigate('/payment', { 
          state: { 
            booking: res.data.booking, 
            payment: res.data.payment 
          } 
        });
      } else {
        setErrorMsg(res.message || 'Pemesanan gagal dilakukan.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (num) => {
    if (!num) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  if (loadingUnit) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Memuat formulir pemesanan...</p>
      </div>
    );
  }

  return (
    <div className="main-content fade-in" style={styles.container}>
      <h1 style={styles.pageTitle}>Formulir Pemesanan Unit</h1>

      <div className="page-two-col">
        {/* Left Side: Booking Form */}
        <div className="glass-card" style={styles.formCard}>
          <h2 style={styles.cardTitle}>Detail Penyewaan</h2>

          {errorMsg && (
            <div style={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="startDate">Tanggal Mulai Sewa</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={18} style={styles.inputIcon} />
                  <input
                    id="startDate"
                    type="date"
                    className="form-input"
                    style={styles.inputField}
                    min={new Date().toISOString().split('T')[0]}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="endDate">Tanggal Selesai Sewa</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={18} style={styles.inputIcon} />
                  <input
                    id="endDate"
                    type="date"
                    className="form-input"
                    style={styles.inputField}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="form-group">
              <label className="form-label">Verifikasi Kartu Tanda Penduduk (KTP)</label>
              
              {user?.ktpPhoto && !ktpPhoto ? (
                <div style={styles.alreadyUploaded}>
                  <FileText size={20} color="var(--color-success)" />
                  <div style={{ flex: 1 }}>
                    <p style={styles.uploadTextSuccess}>KTP Profil Terdeteksi</p>
                    <p style={styles.uploadTextMuted}>System akan menggunakan dokumen KTP yang terunggah di profil Anda. Anda tetap dapat mengunggah dokumen baru di bawah ini.</p>
                  </div>
                </div>
              ) : null}

              <div style={styles.uploadArea}>
                <input
                  type="file"
                  id="ktpUpload"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
                <label htmlFor="ktpUpload" style={styles.uploadLabel}>
                  {ktpPreview ? (
                    <img src={ktpPreview} alt="KTP Preview" style={styles.previewImg} />
                  ) : (
                    <>
                      <Upload size={32} color="var(--primary)" />
                      <p style={styles.uploadMainText}>Pilih Foto KTP Anda</p>
                      <p style={styles.uploadSubText}>Format JPG, PNG, atau WEBP (Maksimal 5MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Verification Warning Alert */}
            {!user?.isVerified && (
              <div style={styles.warningAlert}>
                <ShieldAlert size={20} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                <p style={styles.warningText}>
                  <strong>Perhatian:</strong> Pemesanan akan berstatus PENDING hingga admin memverifikasi dokumen KTP Anda.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? 'Memproses Pemesanan...' : 'Ajukan Pemesanan Kamar'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Right Side: Invoice Summary Sidebar */}
        <div style={styles.sidebar}>
          {unit && (
            <div className="glass-card sidebar-sticky" style={styles.summaryCard}>
              <h2 style={styles.cardTitle}>Rincian Pemesanan</h2>
              
              <div style={styles.summaryInfo}>
                <h3 style={styles.propName}>{unit.property?.name}</h3>
                <p style={styles.unitNum}>Unit {unit.unitNumber} ({unit.type})</p>
                <p style={styles.propAddr}>{unit.property?.address}</p>
              </div>

              <div style={styles.sidebarDivider}></div>

              <div style={styles.calcRows}>
                <div style={styles.calcRow}>
                  <span>Harga Kamar</span>
                  <span>{formatRupiah(unit.price)} / bulan</span>
                </div>
                {rentMonths > 0 && (
                  <div style={styles.calcRow}>
                    <span>Durasi Sewa</span>
                    <span>{rentMonths} Bulan</span>
                  </div>
                )}
                
                <div style={styles.sidebarDivider}></div>

                {rentMonths > 0 && (
                  <div style={styles.calcRow}>
                    <span>Total Biaya Sewa</span>
                    <span>{formatRupiah(totalRent)}</span>
                  </div>
                )}
                <div style={styles.calcRow}>
                  <span>Deposit Jaminan</span>
                  <span>{formatRupiah(unit.deposit)}</span>
                </div>

                <div style={styles.sidebarDivider} style={{ borderStyle: 'double', borderWidth: '3px 0 0 0', margin: '1rem 0' }}></div>

                <div style={styles.calcRowTotal}>
                  <span>Total Tagihan Awal</span>
                  <span style={styles.totalVal}>{formatRupiah(totalBill)}</span>
                </div>
              </div>

              <p style={styles.note}>
                * Biaya deposit jaminan akan dikembalikan utuh setelah masa sewa Anda berakhir dan unit diserahterimakan kembali dalam keadaan baik.
              </p>
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
    gridTemplateColumns: '1.3fr 1fr',
    gap: '1.5rem',
  },
  formCard: {
    padding: '2rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    marginBottom: '1.5rem',
    fontFamily: 'var(--font-display)',
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
    gap: '1rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
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
  alreadyUploaded: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '10px',
    padding: '0.85rem 1rem',
    marginBottom: '1rem',
  },
  uploadTextSuccess: {
    fontWeight: 'bold',
    fontSize: '0.85rem',
    color: '#34d399',
    margin: 0,
  },
  uploadTextMuted: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    margin: '0.2rem 0 0 0',
    lineHeight: '1.4',
  },
  uploadArea: {
    width: '100%',
    border: '2px dashed var(--border-light)',
    borderRadius: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    transition: 'var(--transition-smooth)',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1.5rem',
    cursor: 'pointer',
    width: '100%',
    minHeight: '180px',
  },
  uploadMainText: {
    fontWeight: '600',
    fontSize: '0.95rem',
    marginTop: '0.75rem',
    color: 'var(--text-white)',
  },
  uploadSubText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '160px',
    borderRadius: '8px',
    objectFit: 'contain',
  },
  warningAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: '10px',
    padding: '0.85rem 1rem',
    marginTop: '0.5rem',
  },
  warningText: {
    fontSize: '0.8rem',
    color: '#fbbf24',
    margin: 0,
    lineHeight: '1.4',
  },
  submitBtn: {
    marginTop: '1.5rem',
    padding: '0.85rem',
    width: '100%',
    fontSize: '1rem',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryCard: {
    padding: '2rem',
    position: 'sticky',
    top: '100px',
  },
  summaryInfo: {
    marginBottom: '1rem',
  },
  propName: {
    fontSize: '1.3rem',
    color: 'var(--text-white)',
    fontFamily: 'var(--font-display)',
  },
  unitNum: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--secondary)',
    margin: '0.2rem 0',
  },
  propAddr: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  sidebarDivider: {
    height: '1px',
    background: 'var(--border-light)',
    margin: '1.25rem 0',
  },
  calcRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  calcRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
  },
  totalVal: {
    fontSize: '1.4rem',
    color: 'var(--secondary)',
    fontWeight: '800',
  },
  note: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '1.5rem',
    lineHeight: '1.4',
    fontStyle: 'italic',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '1rem',
    color: 'var(--text-muted)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(139, 92, 246, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default Booking;
