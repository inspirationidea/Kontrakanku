import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { CreditCard, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Copy, Clock } from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking;
  const initialPayment = location.state?.payment;

  const [payment, setPayment] = useState(initialPayment);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [successStatus, setSuccessStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  useEffect(() => {
    api.settings.getPaymentAccounts()
      .then(res => { if (res.success) setPaymentAccounts(res.data); })
      .catch(() => {});
  }, []);

  if (!booking || !payment) {
    return (
      <div className="main-content" style={styles.errorContainer}>
        <div className="glass-card" style={styles.errorCard}>
          <AlertTriangle size={36} color="var(--color-warning)" />
          <h3>Akses Ditolak</h3>
          <p>Informasi pembayaran tidak ditemukan. Silakan navigasi dari menu booking atau dashboard.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Kembali ke Peta</button>
        </div>
      </div>
    );
  }

  const handleCopyVa = () => {
    navigator.clipboard.writeText(`80777${payment.id.substring(0, 8)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!selectedMethod) {
      setErrorMsg('Pilih salah satu metode pembayaran terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Generate transaction status update via mock gateway redirect
      const gatewayRes = await api.payments.createTransaction(booking.id, selectedMethod);
      if (gatewayRes.success) {
        // 2. Trigger webhook call to simulate gateway completion notification
        const webhookPayload = {
          transaction_status: 'settlement',
          order_id: gatewayRes.data.payment.id,
          payment_type: selectedMethod,
        };

        const webhookRes = await api.payments.triggerWebhook(webhookPayload);
        if (webhookRes.success) {
          setPayment(webhookRes.data.pay);
          setSuccessStatus(true);
        } else {
          setErrorMsg('Simulasi payment gateway gagal memproses webhook.');
        }
      } else {
        setErrorMsg('Simulasi pembuatan invoice gagal.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdminConfirm = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.payments.confirmManual(payment.id);
      if (res.success) {
        setPayment(res.data.payment);
        setSuccessStatus(true);
      } else {
        setErrorMsg(res.message || 'Konfirmasi manual gagal.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num) => {
    if (!num) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const paymentMethods = [
    { id: 'VA_BCA', name: 'BCA Virtual Account', category: 'VA' },
    { id: 'VA_MANDIRI', name: 'Mandiri Virtual Account', category: 'VA' },
    { id: 'VA_BRI', name: 'BRI Virtual Account', category: 'VA' },
    { id: 'QRIS', name: 'QRIS (Gopay, OVO, ShopeePay, Dana)', category: 'EWALLET' },
    { id: 'MANUAL_BANK', name: 'Transfer Bank Manual (Simulasi Admin)', category: 'MANUAL' }
  ];

  if (successStatus) {
    return (
      <div className="main-content fade-in" style={styles.successContainer}>
        <div className="glass-card" style={styles.successCard}>
          <div style={styles.successIconWrapper}>
            <CheckCircle size={48} color="var(--color-success)" />
          </div>
          <h1 style={styles.successTitle}>Pembayaran Berhasil!</h1>
          <p style={styles.successSubtitle}>Status Sewa Kontrakan Anda Sekarang: <strong style={{ color: 'var(--color-success)' }}>ACTIVE</strong></p>

          <div style={styles.successDivider}></div>

          <div style={styles.successDetails}>
            <div style={styles.successRow}>
              <span>ID Pemesanan</span>
              <span style={styles.mono}>{booking.id}</span>
            </div>
            <div style={styles.successRow}>
              <span>Jumlah Terbayar</span>
              <span style={styles.priceSuccess}>{formatRupiah(payment.amount)}</span>
            </div>
            <div style={styles.successRow}>
              <span>Metode Pembayaran</span>
              <span>{payment.method}</span>
            </div>
            <div style={styles.successRow}>
              <span>Waktu Pembayaran</span>
              <span>
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleString('id-ID')
                  : '-'}
              </span>
            </div>
          </div>

          <div style={styles.successDivider}></div>

          <div style={styles.successFooter}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={styles.successBtn}>
              Masuk ke Dashboard Saya
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in" style={styles.container}>
      <h1 style={styles.pageTitle}>Selesaikan Pembayaran</h1>

      <div className="page-two-col">
        {/* Left Side: Select Method */}
        <div className="glass-card" style={styles.leftCard}>
          <h2 style={styles.cardTitle}>Pilih Metode Pembayaran</h2>

          {errorMsg && (
            <div style={styles.errorAlert}>
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                style={{
                  ...styles.methodItem,
                  borderColor: selectedMethod === method.id ? 'var(--secondary)' : 'var(--border-light)',
                  background: selectedMethod === method.id ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0, 0, 0, 0.2)'
                }}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div style={styles.methodInfo}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id={method.id}
                    checked={selectedMethod === method.id}
                    onChange={() => setSelectedMethod(method.id)}
                    style={styles.radioInput}
                  />
                  <label htmlFor={method.id} style={styles.methodName}>{method.name}</label>
                </div>
                <span style={styles.methodCat}>{method.category}</span>
              </div>
            ))}
          </div>

          {selectedMethod === 'MANUAL_BANK' ? (
            <div style={styles.vaInstructions}>
              <p style={styles.vaTitle}>Rekening & Dompet Digital Tujuan</p>
              <p style={styles.vaDesc}>Kirim pembayaran ke salah satu rekening berikut:</p>
              {paymentAccounts.length > 0 ? (
                paymentAccounts.map(acc => (
                  <div key={acc.id} style={{ ...styles.vaBox, marginBottom: '0.5rem', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <p style={{ ...styles.vaLabel, color: '#f59e0b', marginBottom: '0.2rem' }}>{acc.type === 'BANK' ? '🏦' : acc.type === 'GOPAY' ? '💚' : acc.type === 'DANA' ? '🔵' : acc.type === 'OVO' ? '💜' : acc.type === 'QRIS' ? '📱' : '💳'} {acc.label}</p>
                    <p style={styles.vaNum}>{acc.accountNumber}</p>
                    <p style={styles.vaHolder}>a.n. {acc.accountHolder}</p>
                  </div>
                ))
              ) : (
                <div style={styles.vaBox}>
                  <p style={styles.vaHolder}>Hubungi admin untuk info rekening pembayaran.</p>
                </div>
              )}
              <p style={{ ...styles.vaDesc, marginTop: '0.75rem' }}>Setelah transfer, klik "Konfirmasi Manual" di samping untuk menyelesaikan pembayaran.</p>
            </div>
          ) : selectedMethod && selectedMethod.startsWith('VA_') ? (
            <div style={styles.vaInstructions}>
              <p style={styles.vaTitle}>Virtual Account Number</p>
              <div style={styles.vaBox}>
                <span style={styles.vaNumber}>80777{payment.id.substring(0, 8)}</span>
                <button onClick={handleCopyVa} style={styles.copyBtn}>
                  <Copy size={16} />
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p style={styles.vaDesc}>Gunakan nomor Virtual Account di atas untuk membayar melalui ATM, Mobile, atau Internet Banking.</p>
            </div>
          ) : null}
        </div>

        {/* Right Side: Invoice Info */}
        <div style={styles.sidebar}>
          <div className="glass-card sidebar-sticky" style={styles.summaryCard}>
            <h2 style={styles.cardTitle}>Tagihan Invoice</h2>

            <div style={styles.invoiceMeta}>
              <div style={styles.metaRow}>
                <span>No. Invoice</span>
                <span style={styles.mono}>INV-{payment.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div style={styles.metaRow}>
                <span>Batas Waktu</span>
                <span style={styles.dueVal}>
                  <Clock size={14} />
                  <span>{new Date(payment.dueDate).toLocaleString('id-ID')}</span>
                </span>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.billingList}>
              <div style={styles.billRow}>
                <span>Uang Sewa Kontrakan</span>
                <span>{formatRupiah(payment.amount - (booking.unit?.deposit || 0))}</span>
              </div>
              {booking.unit?.deposit > 0 && (
                <div style={styles.billRow}>
                  <span>Deposit Jaminan</span>
                  <span>{formatRupiah(booking.unit.deposit)}</span>
                </div>
              )}

              <div style={styles.divider}></div>

              <div style={styles.totalRow}>
                <span>Total Harus Dibayar</span>
                <span style={styles.totalVal}>{formatRupiah(payment.amount)}</span>
              </div>
            </div>

            <div style={styles.actionButtons}>
              {selectedMethod === 'MANUAL_BANK' ? (
                <button
                  onClick={handleManualAdminConfirm}
                  className="btn btn-primary"
                  style={styles.payBtn}
                  disabled={loading}
                >
                  <ShieldCheck size={18} />
                  <span>Simulasi Konfirmasi Admin</span>
                </button>
              ) : (
                <button
                  onClick={handleSimulatePayment}
                  className="btn btn-primary"
                  style={styles.payBtn}
                  disabled={loading || !selectedMethod}
                >
                  <CreditCard size={18} />
                  <span>Bayar Sekarang (Simulasi Gateway)</span>
                </button>
              )}
            </div>
          </div>
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
  leftCard: {
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
  methodsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  methodItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid var(--border-light)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  methodInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  radioInput: {
    cursor: 'pointer',
    accentColor: 'var(--secondary)',
  },
  methodName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    color: 'var(--text-white)',
  },
  methodCat: {
    fontSize: '0.7rem',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    color: 'var(--text-muted)',
    fontWeight: 'bold',
  },
  vaInstructions: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-light)',
    borderRadius: '12px',
    padding: '1.25rem',
    marginTop: '1rem',
  },
  vaTitle: {
    fontSize: '0.95rem',
    fontWeight: 'bold',
    color: 'var(--text-white)',
    marginBottom: '0.5rem',
  },
  vaDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  vaBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-light)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
  },
  vaNumber: {
    fontSize: '1.3rem',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: 'var(--secondary)',
    letterSpacing: '0.05em',
  },
  copyBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-main)',
    borderRadius: '6px',
    padding: '0.35rem 0.65rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.75rem',
  },
  vaLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 'bold',
    margin: 0,
  },
  vaNum: {
    fontSize: '1.25rem',
    color: 'var(--text-white)',
    fontWeight: 'bold',
    margin: '0.1rem 0',
  },
  vaHolder: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    margin: 0,
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
  invoiceMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  mono: {
    fontFamily: 'monospace',
    color: 'var(--text-white)',
  },
  dueVal: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: '#fbbf24',
    fontSize: '0.8rem',
  },
  divider: {
    height: '1px',
    background: 'var(--border-light)',
    margin: '1.25rem 0',
  },
  billingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  billRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  totalRow: {
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
  actionButtons: {
    marginTop: '1.5rem',
  },
  payBtn: {
    width: '100%',
    padding: '0.85rem',
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
  },
  errorCard: {
    maxWidth: '450px',
    width: '100%',
    textAlign: 'center',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
  },
  successContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
    padding: '1.5rem',
  },
  successCard: {
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    padding: '3rem 2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  successIconWrapper: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '50%',
    padding: '1rem',
    display: 'inline-flex',
    marginBottom: '1.5rem',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  successTitle: {
    fontSize: '1.8rem',
    fontFamily: 'var(--font-display)',
    marginBottom: '0.5rem',
  },
  successSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    marginBottom: '1.5rem',
  },
  successDivider: {
    height: '1px',
    background: 'var(--border-light)',
    width: '100%',
    margin: '1.5rem 0',
  },
  successDetails: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  successRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  priceSuccess: {
    color: 'var(--color-success)',
    fontWeight: 'bold',
  },
  successFooter: {
    width: '100%',
    marginTop: '1.5rem',
  },
  successBtn: {
    width: '100%',
    padding: '0.85rem',
  },
};

export default Payment;
