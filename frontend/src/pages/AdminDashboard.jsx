import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getPropertyImageUrl, handleImageError } from '../utils/imageHelper';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import AdminSidebar from '../components/AdminSidebar';
import {
  CheckCircle,
  XCircle,
  FileText,
  Image,
  Building2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  DollarSign,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Users,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MessageSquareWarning,
  MessageSquare,
  Wrench,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);

  // Loading & Error states
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingProps, setLoadingProps] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states for adding property
  const [propName, setPropName] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propLat, setPropLat] = useState('');
  const [propLng, setPropLng] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propCover, setPropCover] = useState(null);
  const [submittingProp, setSubmittingProp] = useState(false);

  // Form states for adding unit
  const [selectedPropIdForUnit, setSelectedPropIdForUnit] = useState('');
  const [unitNum, setUnitNum] = useState('');
  const [unitType, setUnitType] = useState('Standard');
  const [unitPrice, setUnitPrice] = useState('');
  const [unitDeposit, setUnitDeposit] = useState('0');
  const [unitFacilities, setUnitFacilities] = useState('');
  const [unitDesc, setUnitDesc] = useState('');
  const [submittingUnit, setSubmittingUnit] = useState(false);

  // Revenue stats state
  const [revenueStats, setRevenueStats] = useState(null);

  // Admin profile edit states
  const [adminProfileForm, setAdminProfileForm] = useState({ name: '', phone: '' });
  const [adminProfileEditing, setAdminProfileEditing] = useState(false);
  const [savingAdminProfile, setSavingAdminProfile] = useState(false);
  const [adminPwdForm, setAdminPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [savingAdminPwd, setSavingAdminPwd] = useState(false);
  const [showAdminPwdForm, setShowAdminPwdForm] = useState(false);

  // SuperAdmin states
  const [globalStats, setGlobalStats] = useState(null);
  const [allAdmins, setAllAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', phone: '', password: '' });
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintNoteId, setComplaintNoteId] = useState(null);
  const [complaintNote, setComplaintNote] = useState('');

  // Payment accounts (settings)
  const [payAccounts, setPayAccounts] = useState([]);
  const [savingAccounts, setSavingAccounts] = useState(false);

  // Tenants tab states
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [expandedTenant, setExpandedTenant] = useState(null);

  // Pagination state for admin lists
  const [bookingPage, setBookingPage] = useState(1);
  const ADMIN_PAGE_SIZE = 10;

  // Reject booking modal state
  const [rejectModal, setRejectModal] = useState(null); // { bookingId }
  const [rejectReason, setRejectReason] = useState('');

  // Add tenant modal state
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', email: '', phone: '', password: '' });
  const [newTenantKtp, setNewTenantKtp] = useState(null);
  const [savingTenant, setSavingTenant] = useState(false);
  const [createdTenantInfo, setCreatedTenantInfo] = useState(null); // success info modal

  // Property & unit edit states
  const [selectedPropForEdit, setSelectedPropForEdit] = useState(null);
  const [selectedPropUnits, setSelectedPropUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null); // unit being edited
  const [editForm, setEditForm] = useState({});
  const [savingUnit, setSavingUnit] = useState(false);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.bookings.getAll();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchProperties = async () => {
    setLoadingProps(true);
    try {
      const res = await api.properties.getAll();
      if (res.success) {
        setProperties(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err.message);
    } finally {
      setLoadingProps(false);
    }
  };

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await api.complaints.getAll();
      if (res.success) setComplaints(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingComplaints(false); }
  };

  const handleUpdateComplaintStatus = async (id, status, note) => {
    try {
      const res = await api.complaints.updateStatus(id, status, note);
      if (res.success) {
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status, adminNote: note ?? c.adminNote } : c));
        setComplaintNoteId(null);
        setComplaintNote('');
      }
    } catch (e) { alert(e.message); }
  };

  const fetchGlobalStats = async () => {
    try {
      const [statsRes, adminsRes] = await Promise.all([
        api.auth.getGlobalStats(),
        api.auth.getAllAdmins(),
      ]);
      if (statsRes.success) setGlobalStats(statsRes.data);
      if (adminsRes.success) setAllAdmins(adminsRes.data);
    } catch (e) { console.error(e); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSavingAdmin(true);
    try {
      const res = await api.auth.createAdmin(newAdmin);
      if (res.success) {
        toast('Akun admin baru berhasil dibuat!', 'success');
        setNewAdmin({ name: '', email: '', phone: '', password: '' });
        fetchGlobalStats();
      }
    } catch (err) {
      toast(err.message || 'Gagal membuat akun admin.', 'error');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setSavingAdminProfile(true);
    try {
      const res = await api.auth.updateProfile(adminProfileForm.name, adminProfileForm.phone);
      if (res.success) {
        toast('Profil berhasil disimpan!', 'success');
        setAdminProfileEditing(false);
        // refreshUser tidak tersedia di admin context, reload halaman
        window.location.reload();
      }
    } catch (err) {
      toast(err.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setSavingAdminProfile(false);
    }
  };

  const handleSaveAdminPwd = async (e) => {
    e.preventDefault();
    if (adminPwdForm.next.length < 6) { toast('Password baru minimal 6 karakter.', 'warning'); return; }
    if (adminPwdForm.next !== adminPwdForm.confirm) { toast('Konfirmasi password tidak cocok.', 'warning'); return; }
    setSavingAdminPwd(true);
    try {
      const res = await api.auth.changePassword(adminPwdForm.current, adminPwdForm.next);
      if (res.success) {
        toast('Password berhasil diubah!', 'success');
        setAdminPwdForm({ current: '', next: '', confirm: '' });
        setShowAdminPwdForm(false);
      }
    } catch (err) {
      toast(err.message || 'Gagal mengubah password.', 'error');
    } finally {
      setSavingAdminPwd(false);
    }
  };

  const fetchRevenueStats = async () => {
    try {
      const res = await api.stats.monthly();
      if (res.success) setRevenueStats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchPayAccounts = async () => {
    try {
      const res = await api.settings.getPaymentAccounts();
      if (res.success) setPayAccounts(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const res = await api.auth.getAll();
      if (res.success) setTenants(res.data);
    } catch (err) {
      console.error('Failed to fetch tenants:', err.message);
    } finally {
      setLoadingTenants(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchBookings();
      await fetchProperties();
      fetchRevenueStats();
      fetchPayAccounts();
    };
    init();
  }, []);

  const handleUpdateBookingStatus = async (bookingId, newStatus, reason) => {
    try {
      const res = await api.bookings.updateStatus(bookingId, newStatus, reason);
      if (res.success) {
        setRejectModal(null);
        setRejectReason('');
        fetchBookings();
      }
    } catch (err) {
      alert(err.message || 'Gagal mengubah status booking.');
    }
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    setSavingTenant(true);
    try {
      const fd = new FormData();
      fd.append('name', newTenant.name);
      fd.append('email', newTenant.email);
      fd.append('phone', newTenant.phone);
      fd.append('password', newTenant.password);
      if (newTenantKtp) fd.append('ktpPhoto', newTenantKtp);

      const res = await api.auth.adminCreate(fd);
      if (res.success) {
        setShowAddTenant(false);
        // Save credentials to show in success modal
        setCreatedTenantInfo({
          name: newTenant.name,
          email: newTenant.email,
          password: newTenant.password,
          isVerified: res.data?.isVerified,
        });
        setNewTenant({ name: '', email: '', phone: '', password: '' });
        setNewTenantKtp(null);
        fetchTenants();
      }
    } catch (err) {
      alert(err.message || 'Gagal membuat akun penyewa.');
    } finally {
      setSavingTenant(false);
    }
  };

  const handleConfirmManualPayment = async (paymentId) => {
    if (window.confirm('Apakah Anda yakin ingin memverifikasi pembayaran manual ini?')) {
      try {
        const res = await api.payments.confirmManual(paymentId);
        if (res.success) {
          alert('Pembayaran berhasil dikonfirmasi dan masa sewa aktif.');
          fetchBookings();
        }
      } catch (err) {
        alert(err.message || 'Gagal mengkonfirmasi pembayaran.');
      }
    }
  };

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    if (!propName || !propAddress || !propLat || !propLng) {
      setErrorMsg('Nama, Alamat, Lat, dan Lng wajib diisi.');
      return;
    }

    setSubmittingProp(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('name', propName);
      formData.append('address', propAddress);
      formData.append('lat', propLat);
      formData.append('lng', propLng);
      formData.append('description', propDesc);
      if (propCover) {
        formData.append('coverImage', propCover);
      }

      const res = await api.properties.create(formData);
      if (res.success) {
        alert('Properti baru berhasil ditambahkan.');
        setPropName('');
        setPropAddress('');
        setPropLat('');
        setPropLng('');
        setPropDesc('');
        setPropCover(null);
        fetchProperties();
        setActiveTab('properties');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambahkan properti.');
    } finally {
      setSubmittingProp(false);
    }
  };

  const handleAddUnitSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPropIdForUnit || !unitNum || !unitPrice) {
      alert('Pilih properti, masukkan nomor unit dan harga.');
      return;
    }

    setSubmittingUnit(true);
    try {
      const facilitiesArray = unitFacilities
        ? unitFacilities.split(',').map(item => item.trim())
        : ['WiFi', 'AC'];

      const res = await api.units.create(selectedPropIdForUnit, {
        unitNumber: unitNum,
        type: unitType,
        price: parseFloat(unitPrice),
        deposit: parseFloat(unitDeposit || 0),
        facilities: facilitiesArray,
        description: unitDesc,
      });

      if (res.success) {
        alert(`Unit ${unitNum} berhasil ditambahkan.`);
        setUnitNum('');
        setUnitPrice('');
        setUnitDeposit('0');
        setUnitFacilities('');
        setUnitDesc('');
        fetchProperties();
      }
    } catch (err) {
      alert(err.message || 'Gagal menambahkan unit.');
    } finally {
      setSubmittingUnit(false);
    }
  };

  // ── Property & Unit edit handlers ──

  const handleSelectPropForEdit = async (prop) => {
    setSelectedPropForEdit(prop);
    setLoadingUnits(true);
    try {
      const res = await api.properties.getById(prop.id);
      if (res.success) setSelectedPropUnits(res.data.units || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleQuickStatus = async (unit, newStatus) => {
    try {
      const res = await api.units.update(unit.id, { status: newStatus });
      if (res.success) {
        setSelectedPropUnits(prev => prev.map(u => u.id === unit.id ? { ...u, status: newStatus } : u));
        fetchProperties();
      }
    } catch (e) {
      alert(e.message || 'Gagal mengubah status.');
    }
  };

  const openEditUnit = (unit) => {
    setEditingUnit(unit);
    setEditForm({
      unitNumber: unit.unitNumber,
      type: unit.type,
      status: unit.status,
      price: unit.price,
      deposit: unit.deposit || 0,
      facilities: Array.isArray(unit.facilities) ? unit.facilities.join(', ') : unit.facilities || '',
      description: unit.description || '',
    });
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    setSavingUnit(true);
    try {
      const payload = {
        ...editForm,
        price: parseFloat(editForm.price),
        deposit: parseFloat(editForm.deposit || 0),
        facilities: editForm.facilities.split(',').map(f => f.trim()).filter(Boolean),
      };
      const res = await api.units.update(editingUnit.id, payload);
      if (res.success) {
        setSelectedPropUnits(prev => prev.map(u => u.id === editingUnit.id ? { ...u, ...payload } : u));
        setEditingUnit(null);
        fetchProperties();
      }
    } catch (e) {
      alert(e.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async (unit) => {
    if (!window.confirm(`Hapus ${unit.unitNumber}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await api.units.delete(unit.id);
      if (res.success) {
        setSelectedPropUnits(prev => prev.filter(u => u.id !== unit.id));
        fetchProperties();
      }
    } catch (e) {
      alert(e.message || 'Gagal menghapus unit.');
    }
  };

  // Stats calculation
  const totalRents = bookings.filter(b => b.status === 'ACTIVE').length;
  const pendingApprovals = bookings.filter(b => b.status === 'PENDING').length;
  const pendingPayments = bookings.filter(b => b.status === 'CONFIRMED').length;
  const totalUnits = properties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)', label: 'Aktif' },
      PENDING: { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)', label: 'Pending' },
      CONFIRMED: { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)', label: 'Terkonfirmasi' },
      CANCELLED: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)', label: 'Dibatalkan' },
      COMPLETED: { bg: 'rgba(107, 114, 128, 0.12)', color: '#9ca3af', border: 'rgba(107, 114, 128, 0.25)', label: 'Selesai' },
    };
    const s = map[status] || map.COMPLETED;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.72rem',
        fontWeight: '600',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: s.color,
        }}></span>
        {s.label}
      </span>
    );
  };

  // ──────── RENDER ────────
  return (
    <div style={styles.adminLayout}>
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="admin-main-mobile" style={styles.mainContent}>
        {/* Top Bar */}
        <header style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === 'overview' && 'Ringkasan Dashboard'}
              {activeTab === 'bookings' && 'Kelola Booking & Sewa'}
              {activeTab === 'global' && '🌐 Monitor Global Platform'}
              {activeTab === 'manage-admins' && '👤 Kelola Admin & Pengelola'}
              {activeTab === 'tenants' && 'Data Penyewa'}
              {activeTab === 'complaints' && 'Keluhan Penyewa'}
              {activeTab === 'properties' && 'Properti & Unit Kamar'}
              {activeTab === 'add-property' && 'Tambah Properti Baru'}
              {activeTab === 'settings' && 'Pengaturan Pembayaran'}
            </h1>
            <p style={styles.pageSubtitle}>
              Selamat datang, {user?.name?.split(' ')[0]} — kelola kontrakan Anda dari sini.
            </p>
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.dateChip}>
              <Clock size={14} />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* ═══════════ GLOBAL MONITOR TAB (SUPERADMIN) ═══════════ */}
        {activeTab === 'global' && (() => {
          if (!globalStats) fetchGlobalStats();
          const fmt = (n) => n ? 'Rp ' + Number(n).toLocaleString('id-ID') : 'Rp 0';

          return (
            <div style={styles.fadeIn}>
              {!globalStats ? (
                <div style={styles.loadingBox}><div style={styles.adminSpinner}></div><span style={styles.loadingText}>Memuat data global...</span></div>
              ) : (
                <>
                  {/* Platform summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'Total Properti',  val: globalStats.properties,        icon: <Building2 size={20} color="#f59e0b" />,  color: '#f59e0b' },
                      { label: 'Total Unit',       val: globalStats.units,             icon: <DollarSign size={20} color="#60a5fa" />, color: '#60a5fa' },
                      { label: 'Total Pengelola',  val: globalStats.admins,            icon: <Users size={20} color="#a78bfa" />,      color: '#a78bfa' },
                      { label: 'Total Penyewa',    val: globalStats.tenants,           icon: <Users size={20} color="#34d399" />,      color: '#34d399' },
                      { label: 'Sewa Aktif',       val: globalStats.bookings.active,   icon: <CheckCircle size={20} color="#34d399" />,color: '#34d399' },
                      { label: 'Booking Pending',  val: globalStats.bookings.pending,  icon: <Clock size={20} color="#fbbf24" />,      color: '#fbbf24' },
                      { label: 'Total Transaksi',  val: globalStats.revenue.transactions, icon: <FileText size={20} color="#60a5fa" />, color: '#60a5fa' },
                      { label: 'Total Revenue',    val: fmt(globalStats.revenue.total), icon: <TrendingUp size={20} color="#34d399" />, color: '#34d399', isText: true },
                    ].map(c => (
                      <div key={c.label} style={{ ...styles.statCard, background: `${c.color}12`, borderColor: `${c.color}30`, flexDirection: 'row', alignItems: 'center', gap: '0.85rem', padding: '1rem' }}>
                        {c.icon}
                        <div>
                          <p style={{ ...styles.statLabel, color: c.color }}>{c.label}</p>
                          <p style={{ ...styles.statVal, fontSize: c.isText ? '1rem' : '1.6rem', color: '#f3f4f6', margin: 0 }}>{c.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* All admins overview */}
                  <div style={styles.sectionCard}>
                    <h2 style={styles.sectionTitle}>Semua Pengelola Kontrakan</h2>
                    <div style={styles.miniTableWrap}>
                      <table style={styles.adminTable}>
                        <thead>
                          <tr>
                            <th style={styles.adminTh}>Pengelola</th>
                            <th style={styles.adminTh}>Role</th>
                            <th style={styles.adminTh}>Properti</th>
                            <th style={styles.adminTh}>Total Unit</th>
                            <th style={styles.adminTh}>Terisi</th>
                            <th style={styles.adminTh}>Tersedia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAdmins.map(a => (
                            <tr key={a.id} style={styles.adminTr}>
                              <td style={styles.adminTd}>
                                <div style={styles.cellUser}>
                                  <div style={{ ...styles.cellAvatar, background: a.role === 'SUPERADMIN' ? 'linear-gradient(135deg,#8b5cf6,#06b6d4)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                                    {a.name?.[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p style={styles.cellName}>{a.name}</p>
                                    <p style={styles.cellSub}>{a.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td style={styles.adminTd}>
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', background: a.role === 'SUPERADMIN' ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.12)', color: a.role === 'SUPERADMIN' ? '#a78bfa' : '#fbbf24' }}>
                                  {a.role}
                                </span>
                              </td>
                              <td style={styles.adminTd}><span style={styles.cellName}>{a.propertyCount}</span></td>
                              <td style={styles.adminTd}><span style={styles.cellSub}>{a.unitCount}</span></td>
                              <td style={styles.adminTd}><span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.82rem' }}>{a.occupiedCount}</span></td>
                              <td style={styles.adminTd}><span style={{ color: '#34d399', fontWeight: '600', fontSize: '0.82rem' }}>{a.availableCount}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ═══════════ MANAGE ADMINS TAB (SUPERADMIN) ═══════════ */}
        {activeTab === 'manage-admins' && (
          <div style={styles.fadeIn}>
            <div style={styles.twoCol}>
              {/* List of admins */}
              <div style={{ ...styles.sectionCard, flex: 1.5 }}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Daftar Pengelola</h2>
                  <button onClick={fetchGlobalStats} style={styles.refreshChip}><RefreshCw size={14} /><span>Refresh</span></button>
                </div>
                {allAdmins.length === 0 ? (
                  <div style={styles.emptyState}><Users size={48} color="#374151" /><p style={styles.emptyText}>Belum ada pengelola.</p></div>
                ) : (
                  <div className="admin-scroll" style={styles.propListVertical}>
                    {allAdmins.map(a => (
                      <div key={a.id} style={styles.propListItem}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: a.role === 'SUPERADMIN' ? 'linear-gradient(135deg,#8b5cf6,#06b6d4)' : 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', color: '#fff', flexShrink: 0 }}>
                          {a.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={styles.propListName}>{a.name}</h4>
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '700', background: a.role === 'SUPERADMIN' ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.1)', color: a.role === 'SUPERADMIN' ? '#a78bfa' : '#fbbf24' }}>{a.role}</span>
                          </div>
                          <p style={styles.propListAddr}>{a.email} · {a.phone || 'No HP belum diisi'}</p>
                          <div style={styles.propListBadges}>
                            <span style={styles.propListUnitBadge}>{a.propertyCount} properti</span>
                            <span style={styles.propListUnitBadge}>{a.unitCount} unit</span>
                            <span style={styles.propListAvailBadge}>{a.availableCount} tersedia</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create new admin form */}
              <div style={{ ...styles.sectionCard, flex: 1 }}>
                <h2 style={styles.sectionTitle}>+ Tambah Pengelola Baru</h2>
                <p style={styles.formHint}>Buat akun admin untuk pengelola kontrakan baru. Mereka bisa login di halaman admin dan mengelola properti milik mereka.</p>
                <form onSubmit={handleCreateAdmin} style={{ ...styles.adminForm, marginTop: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>Nama Lengkap *</label>
                    <input style={styles.adminInput} placeholder="Pak Budi" value={newAdmin.name} onChange={e => setNewAdmin(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>Email *</label>
                    <input type="email" style={styles.adminInput} placeholder="budi@email.com" value={newAdmin.email} onChange={e => setNewAdmin(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>No. HP</label>
                    <input style={styles.adminInput} placeholder="08123456789" value={newAdmin.phone} onChange={e => setNewAdmin(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>Password Awal *</label>
                    <input type="text" style={styles.adminInput} placeholder="Minimal 6 karakter" value={newAdmin.password} onChange={e => setNewAdmin(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                  </div>
                  <button type="submit" style={styles.adminSubmit} disabled={savingAdmin}>
                    {savingAdmin ? 'Membuat...' : '+ Buat Akun Pengelola'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        {activeTab === 'overview' && (
          <div style={styles.fadeIn}>
            {/* Stats Grid */}
            <div className="admin-stats-grid" style={styles.statsGrid}>
              <div style={{ ...styles.statCard, ...styles.statCardAmber }}>
                <div style={styles.statIconWrap}>
                  <Building2 size={22} color="#f59e0b" />
                </div>
                <div>
                  <p style={styles.statLabel}>Total Properti</p>
                  <p style={styles.statVal}>{properties.length}</p>
                </div>
                <div style={styles.statTrend}>
                  <ArrowUpRight size={14} />
                  <span>{totalUnits} unit</span>
                </div>
              </div>

              <div style={{ ...styles.statCard, ...styles.statCardGreen }}>
                <div style={styles.statIconWrap}>
                  <CheckCircle size={22} color="#10b981" />
                </div>
                <div>
                  <p style={styles.statLabel}>Sewa Aktif</p>
                  <p style={styles.statVal}>{totalRents}</p>
                </div>
                <div style={{ ...styles.statTrend, color: '#34d399' }}>
                  <TrendingUp size={14} />
                  <span>aktif</span>
                </div>
              </div>

              <div style={{ ...styles.statCard, ...styles.statCardYellow }}>
                <div style={styles.statIconWrap}>
                  <Clock size={22} color="#f59e0b" />
                </div>
                <div>
                  <p style={styles.statLabel}>Booking Pending</p>
                  <p style={styles.statVal}>{pendingApprovals}</p>
                </div>
                <div style={{ ...styles.statTrend, color: '#fbbf24' }}>
                  <RefreshCw size={14} />
                  <span>menunggu</span>
                </div>
              </div>

              <div style={{ ...styles.statCard, ...styles.statCardBlue }}>
                <div style={styles.statIconWrap}>
                  <DollarSign size={22} color="#3b82f6" />
                </div>
                <div>
                  <p style={styles.statLabel}>Tagihan Pending</p>
                  <p style={styles.statVal}>{pendingPayments}</p>
                </div>
                <div style={{ ...styles.statTrend, color: '#60a5fa' }}>
                  <FileText size={14} />
                  <span>verifikasi</span>
                </div>
              </div>
            </div>

            {/* Recent Bookings Quick View */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Booking Terbaru</h2>
                <button onClick={() => setActiveTab('bookings')} style={styles.viewAllBtn}>
                  Lihat Semua <ArrowUpRight size={14} />
                </button>
              </div>
              {loadingBookings ? (
                <div style={styles.loadingBox}>
                  <div style={styles.adminSpinner}></div>
                  <span style={styles.loadingText}>Memuat data...</span>
                </div>
              ) : bookings.length === 0 ? (
                <p style={styles.emptyText}>Belum ada data pemesanan.</p>
              ) : (
                <div style={styles.miniTableWrap}>
                  <table style={styles.adminTable}>
                    <thead>
                      <tr>
                        <th style={styles.adminTh}>Penyewa</th>
                        <th style={styles.adminTh}>Unit</th>
                        <th style={styles.adminTh}>Status</th>
                        <th style={styles.adminTh}>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map(book => (
                        <tr key={book.id} style={styles.adminTr}>
                          <td style={styles.adminTd}>
                            <div style={styles.cellUser}>
                              <div style={styles.cellAvatar}>{book.user?.name?.[0]?.toUpperCase()}</div>
                              <div>
                                <p style={styles.cellName}>{book.user?.name}</p>
                                <p style={styles.cellSub}>{book.user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={styles.adminTd}>
                            <p style={styles.cellName}>{book.unit?.property?.name}</p>
                            <p style={styles.cellSub}>Unit {book.unit?.unitNumber}</p>
                          </td>
                          <td style={styles.adminTd}>{getStatusBadge(book.status)}</td>
                          <td style={styles.adminTd}>
                            <span style={styles.cellSub}>
                              {new Date(book.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Properties Quick View */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Daftar Properti</h2>
                <button onClick={() => setActiveTab('properties')} style={styles.viewAllBtn}>
                  Kelola <ArrowUpRight size={14} />
                </button>
              </div>
              {loadingProps ? (
                <div style={styles.loadingBox}>
                  <div style={styles.adminSpinner}></div>
                  <span style={styles.loadingText}>Memuat properti...</span>
                </div>
              ) : properties.length === 0 ? (
                <p style={styles.emptyText}>Belum ada properti terdaftar.</p>
              ) : (
                <div style={styles.propGrid}>
                  {properties.slice(0, 4).map(prop => (
                    <div key={prop.id} style={styles.propCard}>
                      <img
                        src={getPropertyImageUrl(prop.coverImage, prop.id || prop.name)}
                        alt=""
                        style={styles.propCardImg}
                        onError={(e) => handleImageError(e, prop.id || prop.name)}
                      />
                      <div style={styles.propCardBody}>
                        <h4 style={styles.propCardName}>{prop.name}</h4>
                        <p style={styles.propCardAddr}>{prop.address}</p>
                        <div style={styles.propCardMeta}>
                          <span style={styles.propCardBadge}>{prop.totalUnits || 0} unit</span>
                          <span style={styles.propCardAvail}>{prop.availableUnitsCount || 0} tersedia</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Revenue Chart ── */}
            {revenueStats && (
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Grafik Pendapatan (12 Bulan Terakhir)</h2>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>Total All-time</p>
                    <p style={{ color: '#34d399', fontWeight: '800', fontFamily: "'Outfit',sans-serif", fontSize: '1.1rem', margin: '0.1rem 0 0' }}>
                      Rp {revenueStats.totalRevenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                {(() => {
                  const maxVal = Math.max(...revenueStats.monthly.map(m => m.total), 1);
                  return (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', paddingBottom: '24px', position: 'relative' }}>
                      {revenueStats.monthly.map((m, i) => {
                        const pct = maxVal > 0 ? (m.total / maxVal) * 100 : 0;
                        const isCurrentMonth = i === revenueStats.monthly.length - 1;
                        return (
                          <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }} title={`${m.label}: Rp ${m.total.toLocaleString('id-ID')}`}>
                            <div style={{
                              width: '100%',
                              height: `${Math.max(pct, m.total > 0 ? 4 : 1)}%`,
                              background: isCurrentMonth
                                ? 'linear-gradient(180deg,#f59e0b,#d97706)'
                                : m.total > 0
                                ? 'linear-gradient(180deg,rgba(59,130,246,0.8),rgba(37,99,235,0.6))'
                                : 'rgba(255,255,255,0.05)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.4s ease',
                              minHeight: '3px',
                            }} />
                            <span style={{ fontSize: '0.55rem', color: isCurrentMonth ? '#f59e0b' : '#4b5563', whiteSpace: 'nowrap', position: 'absolute', bottom: 0 }}>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <p style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: '0.5rem', textAlign: 'center' }}>
                  {revenueStats.paidCount} transaksi lunas · Batang kuning = bulan ini
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ BOOKINGS TAB ═══════════ */}
        {activeTab === 'bookings' && (
          <div style={styles.fadeIn}>
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Riwayat & Pengajuan Booking</h2>
                <button onClick={fetchBookings} style={styles.refreshChip}>
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingBookings ? (
                <div style={styles.loadingBox}>
                  <div style={styles.adminSpinner}></div>
                  <span style={styles.loadingText}>Memuat pemesanan...</span>
                </div>
              ) : bookings.length === 0 ? (
                <div style={styles.emptyState}>
                  <FileText size={48} color="#374151" />
                  <p style={styles.emptyText}>Belum ada data pemesanan terdaftar.</p>
                </div>
              ) : (
                <div style={styles.miniTableWrap}>
                  <table style={styles.adminTable}>
                    <thead>
                      <tr>
                        <th style={styles.adminTh}>Penyewa</th>
                        <th style={styles.adminTh}>Unit Kamar</th>
                        <th style={styles.adminTh}>Masa Sewa</th>
                        <th style={styles.adminTh}>Status</th>
                        <th style={styles.adminTh}>Dokumen KTP</th>
                        <th style={styles.adminTh}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice((bookingPage-1)*ADMIN_PAGE_SIZE, bookingPage*ADMIN_PAGE_SIZE).map((book) => {
                        const pendingPay = book.payments?.find(p => p.status === 'PENDING');
                        return (
                          <tr key={book.id} style={styles.adminTr}>
                            <td style={styles.adminTd}>
                              <div style={styles.cellUser}>
                                <div style={styles.cellAvatar}>{book.user?.name?.[0]?.toUpperCase()}</div>
                                <div>
                                  <p style={styles.cellName}>{book.user?.name}</p>
                                  <p style={styles.cellSub}>{book.user?.phone || book.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td style={styles.adminTd}>
                              <p style={styles.cellName}>{book.unit?.property?.name}</p>
                              <p style={styles.cellSub}>Unit {book.unit?.unitNumber} ({book.unit?.type})</p>
                            </td>
                            <td style={styles.adminTd}>
                              <span style={styles.cellSub}>
                                {new Date(book.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – {new Date(book.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </td>
                            <td style={styles.adminTd}>
                              {getStatusBadge(book.status)}
                            </td>
                            <td style={styles.adminTd}>
                              {book.ktpDocument ? (
                                <a
                                  href={`${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${book.ktpDocument}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={styles.ktpLink}
                                >
                                  <Image size={14} />
                                  <span>Lihat KTP</span>
                                </a>
                              ) : (
                                <span style={styles.cellSub}>Tidak ada</span>
                              )}
                            </td>
                            <td style={styles.adminTd}>
                              <div style={styles.actionRow}>
                                {book.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateBookingStatus(book.id, 'CONFIRMED')}
                                      style={styles.btnAccept}
                                    >
                                      <CheckCircle size={13} /> Terima
                                    </button>
                                    <button
                                      onClick={() => { setRejectModal({ bookingId: book.id }); setRejectReason(''); }}
                                      style={styles.btnReject}
                                    >
                                      <XCircle size={13} /> Tolak
                                    </button>
                                  </>
                                )}

                                {book.status === 'CONFIRMED' && pendingPay && (
                                  <button
                                    onClick={() => handleConfirmManualPayment(pendingPay.id)}
                                    style={styles.btnVerify}
                                  >
                                    <DollarSign size={13} /> Verifikasi
                                  </button>
                                )}

                                {book.status === 'ACTIVE' && (
                                  <span style={styles.activeLabel}>
                                    <CheckCircle size={13} /> Aktif
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination bookings */}
              {bookings.length > ADMIN_PAGE_SIZE && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.75rem' }}>
                  <button disabled={bookingPage === 1} onClick={() => setBookingPage(p => p-1)} style={{ ...styles.refreshChip, opacity: bookingPage===1?0.4:1 }}>← Prev</button>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Hal {bookingPage} / {Math.ceil(bookings.length/ADMIN_PAGE_SIZE)}</span>
                  <button disabled={bookingPage >= Math.ceil(bookings.length/ADMIN_PAGE_SIZE)} onClick={() => setBookingPage(p => p+1)} style={{ ...styles.refreshChip, opacity: bookingPage>=Math.ceil(bookings.length/ADMIN_PAGE_SIZE)?0.4:1 }}>Next →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ COMPLAINTS TAB ═══════════ */}
        {activeTab === 'complaints' && (() => {
          if (!loadingComplaints && complaints.length === 0) fetchComplaints();

          const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

          const statusCfg = {
            PENDING:     { label: 'Pending',     color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  icon: <Clock size={13} /> },
            IN_PROGRESS: { label: 'Diproses',    color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  icon: <Wrench size={13} /> },
            CLOSED:      { label: 'Selesai',     color: '#34d399', bg: 'rgba(16,185,129,0.12)',  icon: <CheckCircle size={13} /> },
          };

          const pending     = complaints.filter(c => c.status === 'PENDING').length;
          const inProgress  = complaints.filter(c => c.status === 'IN_PROGRESS').length;
          const closed      = complaints.filter(c => c.status === 'CLOSED').length;

          return (
            <div style={styles.fadeIn}>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Menunggu', val: pending,    color: '#60a5fa', icon: <MessageSquareWarning size={20} color="#60a5fa" /> },
                  { label: 'Diproses', val: inProgress, color: '#fbbf24', icon: <Wrench size={20} color="#fbbf24" /> },
                  { label: 'Selesai',  val: closed,     color: '#34d399', icon: <CheckCircle size={20} color="#34d399" /> },
                ].map(c => (
                  <div key={c.label} style={{ ...styles.statCard, background: `${c.color}14`, borderColor: `${c.color}33`, flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                    {c.icon}
                    <div>
                      <p style={{ ...styles.statLabel, color: c.color }}>{c.label}</p>
                      <p style={{ ...styles.statVal, fontSize: '1.6rem', color: '#f3f4f6' }}>{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Daftar Keluhan</h2>
                  <button onClick={fetchComplaints} style={styles.refreshChip}><RefreshCw size={14} /><span>Refresh</span></button>
                </div>

                {loadingComplaints ? (
                  <div style={styles.loadingBox}><div style={styles.adminSpinner}></div><span style={styles.loadingText}>Memuat keluhan...</span></div>
                ) : complaints.length === 0 ? (
                  <div style={styles.emptyState}><MessageSquare size={48} color="#374151" /><p style={styles.emptyText}>Belum ada keluhan.</p></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {complaints.map(c => {
                      const st = statusCfg[c.status] || statusCfg.PENDING;
                      const isEditNote = complaintNoteId === c.id;
                      return (
                        <div key={c.id} style={{ borderRadius: '12px', border: `1px solid ${st.color}33`, background: st.bg, padding: '1rem 1.25rem' }}>
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ ...styles.cellName, fontSize: '0.95rem' }}>{c.subject}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: st.bg, color: st.color, border: `1px solid ${st.color}55`, fontSize: '0.72rem', fontWeight: '700' }}>
                                  {st.icon} {st.label}
                                </span>
                              </div>
                              <p style={{ ...styles.cellSub, marginTop: '0.25rem' }}>
                                {c.user?.name} · {c.unitInfo} · {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                              {c.status === 'PENDING' && (
                                <button onClick={() => handleUpdateComplaintStatus(c.id, 'IN_PROGRESS', undefined)} style={styles.btnVerify} title="Tandai sedang diproses">
                                  <Wrench size={13} /> Proses
                                </button>
                              )}
                              {c.status === 'IN_PROGRESS' && (
                                <button onClick={() => { setComplaintNoteId(isEditNote ? null : c.id); setComplaintNote(c.adminNote || ''); }} style={styles.btnAccept} title="Tutup dengan catatan">
                                  <CheckCircle size={13} /> Selesai
                                </button>
                              )}
                              {c.status === 'CLOSED' && (
                                <button onClick={() => handleUpdateComplaintStatus(c.id, 'PENDING', undefined)} style={{ ...styles.refreshChip, fontSize: '0.72rem' }}>
                                  Buka Ulang
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: '0.82rem', color: '#d1d5db', marginTop: '0.6rem', lineHeight: '1.5' }}>{c.description}</p>

                          {/* Photo */}
                          {c.photoUrl && (
                            <a href={`${API_BASE}${c.photoUrl}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', color: '#60a5fa', fontSize: '0.78rem' }}>
                              <Image size={13} /> Lihat Foto Keluhan
                            </a>
                          )}

                          {/* Admin note (existing) */}
                          {c.adminNote && !isEditNote && (
                            <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', borderLeft: `3px solid ${st.color}` }}>
                              <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 0.2rem', fontWeight: '600' }}>CATATAN ADMIN</p>
                              <p style={{ fontSize: '0.82rem', color: '#e5e7eb', margin: 0 }}>{c.adminNote}</p>
                            </div>
                          )}

                          {/* Close + note form */}
                          {isEditNote && (
                            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <textarea
                                style={{ ...styles.adminTextarea, minHeight: '70px', fontSize: '0.82rem' }}
                                placeholder="Tambahkan catatan penyelesaian untuk penyewa (opsional)..."
                                value={complaintNote}
                                onChange={e => setComplaintNote(e.target.value)}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleUpdateComplaintStatus(c.id, 'CLOSED', complaintNote)} style={{ ...styles.adminSubmit, flex: 1, marginTop: 0, padding: '0.55rem', fontSize: '0.82rem' }}>
                                  ✅ Konfirmasi Selesai
                                </button>
                                <button onClick={() => setComplaintNoteId(null)} style={{ ...styles.refreshChip, flex: 0.4, justifyContent: 'center' }}>Batal</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══════════ TENANTS TAB ═══════════ */}
        {activeTab === 'tenants' && (() => {
          // Lazy-load on first open
          if (!loadingTenants && tenants.length === 0) fetchTenants();

          const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');
          const fmt = (n) => n ? 'Rp ' + Number(n).toLocaleString('id-ID') : 'Rp 0';
          const now = new Date();

          const tenantStats = (t) => {
            const active = t.bookings.filter(b => b.status === 'ACTIVE');
            const totalMonths = t.bookings
              .filter(b => ['ACTIVE','COMPLETED'].includes(b.status))
              .reduce((sum, b) => {
                const diff = new Date(b.endDate) - new Date(b.startDate);
                return sum + Math.max(1, Math.ceil(diff / (1000*60*60*24*30)));
              }, 0);
            const thisMonthPaid = t.bookings.flatMap(b => b.payments)
              .filter(p => p.status === 'PAID' && p.paidAt && new Date(p.paidAt).getMonth() === now.getMonth() && new Date(p.paidAt).getFullYear() === now.getFullYear())
              .reduce((s, p) => s + (p.amount || 0), 0);
            const pendingPay = t.bookings.flatMap(b => b.payments).filter(p => p.status === 'PENDING').length;
            return { active: active.length, totalMonths, thisMonthPaid, pendingPay };
          };

          const totalTenants = tenants.length;
          const verifiedCount = tenants.filter(t => t.isVerified).length;
          const activeRenters = tenants.filter(t => t.bookings.some(b => b.status === 'ACTIVE')).length;

          return (
            <div style={styles.fadeIn}>
              {/* Summary chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Penyewa', val: totalTenants, color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', icon: <Users size={20} color="#60a5fa" /> },
                  { label: 'KTP Terverifikasi', val: verifiedCount, color: '#34d399', bg: 'rgba(16,185,129,0.08)', icon: <ShieldCheck size={20} color="#34d399" /> },
                  { label: 'Sedang Sewa', val: activeRenters, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', icon: <CheckCircle size={20} color="#fbbf24" /> },
                ].map(c => (
                  <div key={c.label} style={{ ...styles.statCard, background: c.bg, borderColor: c.color + '33', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                    {c.icon}
                    <div>
                      <p style={{ ...styles.statLabel, color: c.color }}>{c.label}</p>
                      <p style={{ ...styles.statVal, fontSize: '1.6rem', color: '#f3f4f6' }}>{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tenants table */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Daftar Penyewa</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setShowAddTenant(true)} style={{ ...styles.adminSubmit, padding: '0.4rem 0.85rem', fontSize: '0.78rem', marginTop: 0, width: 'auto' }}>
                      + Tambah Penyewa
                    </button>
                    <button onClick={fetchTenants} style={styles.refreshChip}>
                      <RefreshCw size={14} /><span>Refresh</span>
                    </button>
                  </div>
                </div>

                {loadingTenants ? (
                  <div style={styles.loadingBox}><div style={styles.adminSpinner}></div><span style={styles.loadingText}>Memuat data penyewa...</span></div>
                ) : tenants.length === 0 ? (
                  <div style={styles.emptyState}><Users size={48} color="#374151" /><p style={styles.emptyText}>Belum ada penyewa terdaftar.</p></div>
                ) : (
                  <div style={styles.miniTableWrap}>
                    <table style={styles.adminTable}>
                      <thead>
                        <tr>
                          <th style={styles.adminTh}>Penyewa</th>
                          <th style={styles.adminTh}>No. HP</th>
                          <th style={styles.adminTh}>KTP</th>
                          <th style={styles.adminTh}>Sewa Aktif</th>
                          <th style={styles.adminTh}>Total Bulan Sewa</th>
                          <th style={styles.adminTh}>Bayar Bulan Ini</th>
                          <th style={styles.adminTh}>Tagihan Pending</th>
                          <th style={styles.adminTh}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map(t => {
                          const st = tenantStats(t);
                          const isOpen = expandedTenant === t.id;
                          return (
                            <>
                              <tr key={t.id} style={{ ...styles.adminTr, background: isOpen ? 'rgba(245,158,11,0.04)' : undefined }}>
                                <td style={styles.adminTd}>
                                  <div style={styles.cellUser}>
                                    <div style={styles.cellAvatar}>{t.name?.[0]?.toUpperCase()}</div>
                                    <div>
                                      <p style={styles.cellName}>{t.name}</p>
                                      <p style={styles.cellSub}>{t.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td style={styles.adminTd}><span style={styles.cellSub}>{t.phone || '—'}</span></td>
                                <td style={styles.adminTd}>
                                  {t.isVerified
                                    ? <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.72rem', fontWeight:'700', color:'#34d399', background:'rgba(16,185,129,0.1)', padding:'0.2rem 0.55rem', borderRadius:'6px' }}><ShieldCheck size={12} />Verified</span>
                                    : <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.72rem', fontWeight:'700', color:'#fbbf24', background:'rgba(245,158,11,0.1)', padding:'0.2rem 0.55rem', borderRadius:'6px' }}><ShieldAlert size={12} />Belum</span>
                                  }
                                </td>
                                <td style={styles.adminTd}><span style={{ color: st.active > 0 ? '#34d399' : '#6b7280', fontWeight: '700', fontSize: '0.88rem' }}>{st.active} unit</span></td>
                                <td style={styles.adminTd}><span style={{ color: '#e5e7eb', fontSize: '0.82rem' }}>{st.totalMonths} bulan</span></td>
                                <td style={styles.adminTd}>
                                  <span style={{ color: st.thisMonthPaid > 0 ? '#34d399' : '#6b7280', fontSize: '0.82rem', fontWeight: '600' }}>
                                    {st.thisMonthPaid > 0 ? fmt(st.thisMonthPaid) : '—'}
                                  </span>
                                </td>
                                <td style={styles.adminTd}>
                                  {st.pendingPay > 0
                                    ? <span style={{ color:'#fbbf24', fontWeight:'700', fontSize:'0.82rem' }}>{st.pendingPay} tagihan</span>
                                    : <span style={styles.cellSub}>—</span>
                                  }
                                </td>
                                <td style={styles.adminTd}>
                                  <button
                                    onClick={() => setExpandedTenant(isOpen ? null : t.id)}
                                    style={{ ...styles.refreshChip, gap: '0.25rem' }}
                                  >
                                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    <span>{isOpen ? 'Tutup' : 'Detail'}</span>
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded detail row */}
                              {isOpen && (
                                <tr key={t.id + '-detail'}>
                                  <td colSpan={8} style={{ padding: '0 0.5rem 1rem', background: 'rgba(245,158,11,0.03)' }}>
                                    <div style={{ borderRadius: '10px', border: '1px solid rgba(245,158,11,0.15)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                                      {/* KTP link + verify/reject actions */}
                                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                                        {t.ktpPhoto ? (
                                          <a href={`${API_BASE}${t.ktpPhoto}`} target="_blank" rel="noreferrer" style={styles.ktpLink}>
                                            <Image size={13} /> Lihat Foto KTP
                                          </a>
                                        ) : (
                                          <span style={styles.cellSub}>Belum upload KTP</span>
                                        )}
                                        {t.ktpPhoto && !t.isVerified && (
                                          <>
                                            <button
                                              onClick={async () => {
                                                const res = await api.auth.verifyKtp(t.id, true, '').catch(e => alert(e.message));
                                                if (res?.success) fetchTenants();
                                              }}
                                              style={{ ...styles.btnAccept, padding: '0.3rem 0.7rem', fontSize: '0.72rem' }}
                                            >
                                              <ShieldCheck size={13} /> Verifikasi KTP
                                            </button>
                                            <button
                                              onClick={async () => {
                                                const reason = window.prompt('Alasan penolakan KTP:');
                                                if (reason === null) return;
                                                const res = await api.auth.verifyKtp(t.id, false, reason).catch(e => alert(e.message));
                                                if (res?.success) fetchTenants();
                                              }}
                                              style={{ ...styles.btnReject, padding: '0.3rem 0.7rem', fontSize: '0.72rem' }}
                                            >
                                              <ShieldAlert size={13} /> Tolak KTP
                                            </button>
                                          </>
                                        )}
                                        {t.isVerified && (
                                          <span style={{ fontSize:'0.72rem', color:'#34d399', fontWeight:'600' }}>✓ KTP Sudah Terverifikasi</span>
                                        )}
                                      </div>

                                      {/* Booking history */}
                                      {t.bookings.length === 0 ? (
                                        <p style={styles.cellSub}>Belum ada riwayat booking.</p>
                                      ) : (
                                        <table style={{ ...styles.adminTable, fontSize: '0.78rem' }}>
                                          <thead>
                                            <tr>
                                              <th style={styles.adminTh}>Properti / Unit</th>
                                              <th style={styles.adminTh}>Periode Sewa</th>
                                              <th style={styles.adminTh}>Durasi</th>
                                              <th style={styles.adminTh}>Total Biaya</th>
                                              <th style={styles.adminTh}>Status Booking</th>
                                              <th style={styles.adminTh}>Pembayaran</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {t.bookings.map(b => {
                                              const start = new Date(b.startDate);
                                              const end = new Date(b.endDate);
                                              const diffDays = Math.ceil((end - start) / (1000*60*60*24));
                                              const months = Math.ceil(diffDays / 30);
                                              const latestPay = b.payments[0];
                                              return (
                                                <tr key={b.id} style={styles.adminTr}>
                                                  <td style={styles.adminTd}>
                                                    <p style={styles.cellName}>{b.unit?.property?.name}</p>
                                                    <p style={styles.cellSub}>{b.unit?.unitNumber} · {b.unit?.type}</p>
                                                  </td>
                                                  <td style={styles.adminTd}>
                                                    <span style={styles.cellSub}>
                                                      {start.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})} –<br/>
                                                      {end.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
                                                    </span>
                                                  </td>
                                                  <td style={styles.adminTd}>
                                                    <span style={{ color:'#e5e7eb', fontWeight:'600' }}>{months} bln</span>
                                                    <p style={styles.cellSub}>{diffDays} hari</p>
                                                  </td>
                                                  <td style={styles.adminTd}>
                                                    <span style={{ color:'#fbbf24', fontWeight:'700' }}>{fmt(b.totalPrice)}</span>
                                                  </td>
                                                  <td style={styles.adminTd}>{getStatusBadge(b.status)}</td>
                                                  <td style={styles.adminTd}>
                                                    {latestPay ? (
                                                      <div>
                                                        <span style={{ color: latestPay.status === 'PAID' ? '#34d399' : latestPay.status === 'PENDING' ? '#fbbf24' : '#f87171', fontWeight:'700', fontSize:'0.72rem' }}>
                                                          {latestPay.status === 'PAID' ? '✓ Lunas' : latestPay.status === 'PENDING' ? '⏳ Pending' : '✗ Gagal'}
                                                        </span>
                                                        {latestPay.paidAt && <p style={styles.cellSub}>{new Date(latestPay.paidAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</p>}
                                                      </div>
                                                    ) : <span style={styles.cellSub}>—</span>}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══════════ PROPERTIES TAB ═══════════ */}
        {activeTab === 'properties' && (
          <div style={styles.fadeIn}>
            <div style={styles.twoCol}>

              {/* ── LEFT: Properties List (clickable) ── */}
              <div style={{ ...styles.sectionCard, flex: 1.5 }}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Daftar Properti</h2>
                  <button onClick={fetchProperties} style={styles.refreshChip}>
                    <RefreshCw size={14} /><span>Refresh</span>
                  </button>
                </div>
                <p style={styles.propHint}>Klik properti untuk melihat & mengelola kamarnya.</p>
                {loadingProps ? (
                  <div style={styles.loadingBox}>
                    <div style={styles.adminSpinner}></div>
                    <span style={styles.loadingText}>Memuat properti...</span>
                  </div>
                ) : properties.length === 0 ? (
                  <div style={styles.emptyState}>
                    <Building2 size={48} color="#374151" />
                    <p style={styles.emptyText}>Belum ada properti terdaftar.</p>
                  </div>
                ) : (
                  <div className="admin-scroll" style={styles.propListVertical}>
                    {properties.map((prop) => {
                      const isSelected = selectedPropForEdit?.id === prop.id;
                      return (
                        <div
                          key={prop.id}
                          onClick={() => handleSelectPropForEdit(prop)}
                          style={{
                            ...styles.propListItem,
                            cursor: 'pointer',
                            borderColor: isSelected ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.05)',
                            background: isSelected ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <img
                            src={getPropertyImageUrl(prop.coverImage, prop.id || prop.name)}
                            alt=""
                            style={styles.propListThumb}
                            onError={(e) => handleImageError(e, prop.id || prop.name)}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={styles.propListName}>{prop.name}</h4>
                            <p style={styles.propListAddr}>{prop.address.split(',').slice(0,2).join(',')}</p>
                            <div style={styles.propListBadges}>
                              <span style={styles.propListUnitBadge}>{prop.totalUnits || 0} unit</span>
                              <span style={styles.propListAvailBadge}>{prop.availableUnitsCount || 0} tersedia</span>
                            </div>
                          </div>
                          <ChevronRight size={16} color={isSelected ? '#f59e0b' : '#374151'} style={{ flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Unit management OR Add Unit form ── */}
              <div style={{ ...styles.sectionCard, flex: 1 }}>
                {selectedPropForEdit ? (
                  /* Unit management panel */
                  <>
                    <div style={styles.sectionHeader}>
                      <div>
                        <h2 style={styles.sectionTitle}>Kamar — {selectedPropForEdit.name}</h2>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>
                          {selectedPropUnits.length} kamar terdaftar
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPropForEdit(null)}
                        style={styles.refreshChip}
                      >
                        <X size={14} /><span>Tutup</span>
                      </button>
                    </div>

                    {loadingUnits ? (
                      <div style={styles.loadingBox}>
                        <div style={styles.adminSpinner}></div>
                        <span style={styles.loadingText}>Memuat kamar...</span>
                      </div>
                    ) : selectedPropUnits.length === 0 ? (
                      <div style={styles.emptyState}>
                        <p style={styles.emptyText}>Properti ini belum memiliki kamar.</p>
                      </div>
                    ) : (
                      <div className="admin-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '440px', overflowY: 'auto' }}>
                        {selectedPropUnits.map(unit => {
                          const statusStyle = unit.status === 'AVAILABLE'
                            ? { bg: 'rgba(16,185,129,0.1)', color: '#34d399' }
                            : unit.status === 'OCCUPIED'
                            ? { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' }
                            : { bg: 'rgba(239,68,68,0.1)', color: '#f87171' };
                          return (
                            <div key={unit.id} style={styles.unitRow}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span style={styles.unitRowName}>{unit.unitNumber}</span>
                                  <span style={styles.unitRowType}>{unit.type}</span>
                                </div>
                                <p style={styles.unitRowPrice}>
                                  Rp {(unit.price || 0).toLocaleString('id-ID')}/bln
                                </p>
                              </div>

                              {/* Status quick-change */}
                              <select
                                value={unit.status}
                                onChange={(e) => handleQuickStatus(unit, e.target.value)}
                                style={{
                                  ...styles.statusSelect,
                                  background: statusStyle.bg,
                                  color: statusStyle.color,
                                }}
                              >
                                <option value="AVAILABLE">Tersedia</option>
                                <option value="OCCUPIED">Terisi</option>
                                <option value="MAINTENANCE">Perbaikan</option>
                              </select>

                              {/* Edit & Delete */}
                              <button onClick={() => openEditUnit(unit)} style={styles.iconBtnAmber} title="Edit kamar">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDeleteUnit(unit)} style={styles.iconBtnRed} title="Hapus kamar">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add unit to this property shortcut */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        onClick={() => {
                          setSelectedPropIdForUnit(selectedPropForEdit.id);
                          setSelectedPropForEdit(null);
                          setActiveTab('properties');
                        }}
                        style={{ ...styles.adminSubmit, marginTop: 0, fontSize: '0.82rem', padding: '0.6rem' }}
                      >
                        + Tambah Kamar Baru ke Properti Ini
                      </button>
                    </div>
                  </>
                ) : (
                  /* Default: Add Unit form */
                  <>
                    <h2 style={styles.sectionTitle}>+ Tambah Kamar / Unit</h2>
                    <form onSubmit={handleAddUnitSubmit} style={styles.adminForm}>
                      <div style={styles.formGroup}>
                        <label style={styles.adminLabel} htmlFor="propSelector">Pilih Properti</label>
                        <select id="propSelector" style={styles.adminSelect} value={selectedPropIdForUnit} onChange={(e) => setSelectedPropIdForUnit(e.target.value)} required>
                          <option value="">-- Pilih Properti --</option>
                          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.adminLabel} htmlFor="unitNumber">Nomor Kamar / Unit</label>
                        <input id="unitNumber" type="text" style={styles.adminInput} placeholder="Kamar 101" value={unitNum} onChange={(e) => setUnitNum(e.target.value)} required />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.adminLabel} htmlFor="unitType">Tipe Kamar</label>
                        <select id="unitType" style={styles.adminSelect} value={unitType} onChange={(e) => setUnitType(e.target.value)}>
                          <option value="Standard">Standard (KM Luar)</option>
                          <option value="Deluxe">Deluxe (KM Dalam)</option>
                          <option value="Suite">Suite (KM Dalam + AC)</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.adminLabel} htmlFor="unitPrice">Harga Per Bulan (Rp)</label>
                        <input id="unitPrice" type="number" style={styles.adminInput} placeholder="1200000" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.adminLabel} htmlFor="unitDeposit">Deposit Jaminan (Rp)</label>
                        <input id="unitDeposit" type="number" style={styles.adminInput} placeholder="500000" value={unitDeposit} onChange={(e) => setUnitDeposit(e.target.value)} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.adminLabel} htmlFor="unitFacilities">Fasilitas (pisah koma)</label>
                        <input id="unitFacilities" type="text" style={styles.adminInput} placeholder="AC, WiFi, Kasur, Lemari" value={unitFacilities} onChange={(e) => setUnitFacilities(e.target.value)} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.adminLabel} htmlFor="unitDesc">Deskripsi Tambahan</label>
                        <textarea id="unitDesc" style={styles.adminTextarea} placeholder="Deskripsi spesifik kondisi kamar..." value={unitDesc} onChange={(e) => setUnitDesc(e.target.value)} />
                      </div>
                      <button type="submit" style={styles.adminSubmit} disabled={submittingUnit}>
                        {submittingUnit ? 'Menyimpan...' : 'Simpan Unit Kamar'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ EDIT UNIT MODAL ═══════════ */}
        {editingUnit && (
          <div style={styles.editBackdrop} onClick={() => setEditingUnit(null)}>
            <div style={styles.editModal} onClick={e => e.stopPropagation()}>
              <div style={styles.editModalHeader}>
                <h3 style={styles.editModalTitle}>Edit — {editingUnit.unitNumber}</h3>
                <button onClick={() => setEditingUnit(null)} style={styles.editCloseBtn}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveUnit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={styles.editRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>Nomor Kamar</label>
                    <input style={styles.adminInput} value={editForm.unitNumber} onChange={e => setEditForm(f => ({ ...f, unitNumber: e.target.value }))} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>Tipe</label>
                    <select style={styles.adminSelect} value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>
                <div style={styles.editRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>Harga / Bulan (Rp)</label>
                    <input type="number" style={styles.adminInput} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.adminLabel}>Deposit (Rp)</label>
                    <input type="number" style={styles.adminInput} value={editForm.deposit} onChange={e => setEditForm(f => ({ ...f, deposit: e.target.value }))} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Status</label>
                  <select style={styles.adminSelect} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="AVAILABLE">Tersedia</option>
                    <option value="OCCUPIED">Terisi (Sedang Disewa)</option>
                    <option value="MAINTENANCE">Dalam Perbaikan</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Fasilitas (pisah koma)</label>
                  <input style={styles.adminInput} value={editForm.facilities} onChange={e => setEditForm(f => ({ ...f, facilities: e.target.value }))} placeholder="AC, WiFi, Kasur, Lemari" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Deskripsi</label>
                  <textarea style={styles.adminTextarea} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <button type="submit" style={styles.adminSubmit} disabled={savingUnit}>
                  {savingUnit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════ REJECT BOOKING MODAL ═══════════ */}
        {rejectModal && (
          <div style={styles.editBackdrop} onClick={() => setRejectModal(null)}>
            <div style={{ ...styles.editModal, maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <div style={styles.editModalHeader}>
                <h3 style={{ ...styles.editModalTitle, color: '#f87171' }}>❌ Tolak Booking</h3>
                <button onClick={() => setRejectModal(null)} style={styles.editCloseBtn}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>
                Tuliskan alasan penolakan. Alasan ini akan dikirim sebagai notifikasi ke penyewa.
              </p>
              <div style={styles.formGroup}>
                <label style={styles.adminLabel}>Alasan Penolakan</label>
                <textarea
                  style={{ ...styles.adminTextarea, minHeight: '100px', borderColor: 'rgba(239,68,68,0.3)' }}
                  placeholder="Contoh: Dokumen KTP tidak jelas, data tidak sesuai, unit sudah tidak tersedia, dll."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleUpdateBookingStatus(rejectModal.bookingId, 'CANCELLED', rejectReason)}
                  style={{ ...styles.adminSubmit, background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)', flex: 1, marginTop: 0 }}
                >
                  Konfirmasi Tolak
                </button>
                <button onClick={() => setRejectModal(null)} style={{ ...styles.refreshChip, flex: 0.5, justifyContent: 'center', height: 'auto' }}>
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ ADD TENANT MODAL ═══════════ */}
        {showAddTenant && (
          <div style={styles.editBackdrop} onClick={() => setShowAddTenant(false)}>
            <div style={{ ...styles.editModal, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
              <div style={styles.editModalHeader}>
                <h3 style={styles.editModalTitle}>+ Tambah Penyewa Baru</h3>
                <button onClick={() => setShowAddTenant(false)} style={styles.editCloseBtn}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem' }}>
                Buat akun penyewa secara manual (walk-in). Penyewa akan menerima notifikasi bahwa akunnya telah dibuat.
              </p>
              <form onSubmit={handleAddTenant} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Nama Lengkap *</label>
                  <input style={styles.adminInput} placeholder="Budi Santoso" value={newTenant.name} onChange={e => setNewTenant(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Alamat Email *</label>
                  <input type="email" style={styles.adminInput} placeholder="budi@email.com" value={newTenant.email} onChange={e => setNewTenant(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Nomor HP / WhatsApp</label>
                  <input style={styles.adminInput} placeholder="08123456789" value={newTenant.phone} onChange={e => setNewTenant(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Password Awal *</label>
                  <input
                    type="text"
                    style={styles.adminInput}
                    placeholder="Minimal 6 karakter (catat & berikan ke penyewa)"
                    value={newTenant.password}
                    onChange={e => setNewTenant(f => ({ ...f, password: e.target.value }))}
                    required minLength={6}
                  />
                  <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Password ditampilkan agar bisa dicatat dan diberikan langsung ke penyewa.
                  </p>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel}>Foto KTP (opsional)</label>
                  <div style={{ ...styles.fileDropZone, padding: '0.75rem' }}>
                    <input
                      id="adminKtpUpload"
                      type="file"
                      accept="image/*"
                      style={styles.fileInputHidden}
                      onChange={e => setNewTenantKtp(e.target.files[0] || null)}
                    />
                    <label htmlFor="adminKtpUpload" style={styles.fileDropLabel}>
                      <Image size={20} color="#6b7280" />
                      <span style={{ fontSize: '0.8rem' }}>
                        {newTenantKtp ? `✓ ${newTenantKtp.name}` : 'Klik untuk upload KTP penyewa'}
                      </span>
                    </label>
                  </div>
                  {newTenantKtp && (
                    <p style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.25rem' }}>
                      KTP akan langsung diverifikasi otomatis setelah akun dibuat.
                    </p>
                  )}
                </div>
                <button type="submit" style={{ ...styles.adminSubmit, marginTop: '0.25rem' }} disabled={savingTenant}>
                  {savingTenant ? 'Membuat Akun...' : 'Buat Akun Penyewa'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════ SETTINGS TAB ═══════════ */}
        {activeTab === 'settings' && (
          <div style={styles.fadeIn}>

            {/* ── Profil Akun ── */}
            <div style={{ ...styles.sectionCard, maxWidth: '720px', marginBottom: '1.5rem' }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Profil Akun</h2>
                {!adminProfileEditing && (
                  <button
                    onClick={() => { setAdminProfileForm({ name: user?.name || '', phone: user?.phone || '' }); setAdminProfileEditing(true); }}
                    style={styles.refreshChip}
                  >
                    <Pencil size={14} /><span>Edit Profil</span>
                  </button>
                )}
              </div>

              {!adminProfileEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Info display */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                      { label: 'Nama Lengkap', val: user?.name },
                      { label: 'Email', val: user?.email },
                      { label: 'No. HP', val: user?.phone || '—' },
                      { label: 'Role', val: user?.role },
                    ].map(f => (
                      <div key={f.label}>
                        <p style={{ ...styles.adminLabel, marginBottom: '0.25rem' }}>{f.label}</p>
                        <p style={{ fontSize: '0.9rem', color: '#e5e7eb', fontWeight: '600', margin: 0 }}>{f.val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Change password toggle */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => setShowAdminPwdForm(v => !v)}
                      style={{ ...styles.refreshChip, gap: '0.4rem' }}
                    >
                      🔑 {showAdminPwdForm ? 'Batal Ganti Password' : 'Ganti Password'}
                    </button>

                    {showAdminPwdForm && (
                      <form onSubmit={handleSaveAdminPwd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                        <div style={styles.editRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.adminLabel}>Password Lama *</label>
                            <input type="password" style={styles.adminInput} placeholder="Password saat ini" value={adminPwdForm.current} onChange={e => setAdminPwdForm(f => ({ ...f, current: e.target.value }))} required />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.adminLabel}>Password Baru *</label>
                            <input type="password" style={styles.adminInput} placeholder="Min. 6 karakter" value={adminPwdForm.next} onChange={e => setAdminPwdForm(f => ({ ...f, next: e.target.value }))} required minLength={6} />
                          </div>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.adminLabel}>Konfirmasi Password Baru *</label>
                          <input type="password" style={styles.adminInput} placeholder="Ulangi password baru" value={adminPwdForm.confirm} onChange={e => setAdminPwdForm(f => ({ ...f, confirm: e.target.value }))} required />
                        </div>
                        <button type="submit" style={{ ...styles.adminSubmit, marginTop: 0 }} disabled={savingAdminPwd}>
                          {savingAdminPwd ? 'Menyimpan...' : 'Simpan Password Baru'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveAdminProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={styles.editRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.adminLabel}>Nama Lengkap *</label>
                      <input style={styles.adminInput} value={adminProfileForm.name} onChange={e => setAdminProfileForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.adminLabel}>No. HP</label>
                      <input style={styles.adminInput} placeholder="08123456789" value={adminProfileForm.phone} onChange={e => setAdminProfileForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <p style={styles.formHint}>Email tidak bisa diubah. Hubungi SuperAdmin jika perlu ganti email.</p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" style={{ ...styles.adminSubmit, flex: 1, marginTop: 0 }} disabled={savingAdminProfile}>
                      {savingAdminProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                    <button type="button" onClick={() => setAdminProfileEditing(false)} style={{ ...styles.refreshChip, flex: 0.4, justifyContent: 'center' }}>
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Rekening Pembayaran ── */}
            <div style={{ ...styles.sectionCard, maxWidth: '720px' }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Rekening & Dompet Digital Pembayaran</h2>
                <button onClick={fetchPayAccounts} style={styles.refreshChip}><RefreshCw size={14} /><span>Muat Ulang</span></button>
              </div>
              <p style={styles.formHint}>Data ini akan ditampilkan ke penyewa saat memilih metode pembayaran Transfer Manual.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {payAccounts.map((acc, idx) => (
                  <div key={acc.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr auto', gap: '0.6rem', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <select
                      style={{ ...styles.adminSelect, padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}
                      value={acc.type}
                      onChange={e => setPayAccounts(prev => prev.map((a, i) => i === idx ? { ...a, type: e.target.value, label: e.target.value } : a))}
                    >
                      <option value="BANK">Bank</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="DANA">Dana</option>
                      <option value="OVO">OVO</option>
                      <option value="QRIS">QRIS</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                    </select>
                    <input style={{ ...styles.adminInput, padding: '0.45rem 0.6rem', fontSize: '0.8rem' }} placeholder="Nama bank / label" value={acc.label} onChange={e => setPayAccounts(prev => prev.map((a, i) => i === idx ? { ...a, label: e.target.value } : a))} />
                    <input style={{ ...styles.adminInput, padding: '0.45rem 0.6rem', fontSize: '0.8rem' }} placeholder="No. rekening / no. HP" value={acc.accountNumber} onChange={e => setPayAccounts(prev => prev.map((a, i) => i === idx ? { ...a, accountNumber: e.target.value } : a))} />
                    <input style={{ ...styles.adminInput, padding: '0.45rem 0.6rem', fontSize: '0.8rem' }} placeholder="Atas nama" value={acc.accountHolder} onChange={e => setPayAccounts(prev => prev.map((a, i) => i === idx ? { ...a, accountHolder: e.target.value } : a))} />
                    <button onClick={() => setPayAccounts(prev => prev.filter((_, i) => i !== idx))} style={styles.iconBtnRed} title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setPayAccounts(prev => [...prev, { id: String(Date.now()), type: 'BANK', label: '', accountNumber: '', accountHolder: '', isActive: true }])}
                  style={{ ...styles.refreshChip, flex: 1, justifyContent: 'center' }}
                >
                  + Tambah Rekening / Dompet
                </button>
                <button
                  onClick={async () => {
                    setSavingAccounts(true);
                    try {
                      const res = await api.settings.savePaymentAccounts(payAccounts);
                      if (res.success) alert('Rekening pembayaran berhasil disimpan!');
                    } catch (e) { alert(e.message); }
                    finally { setSavingAccounts(false); }
                  }}
                  style={{ ...styles.adminSubmit, flex: 1, marginTop: 0, padding: '0.6rem' }}
                  disabled={savingAccounts}
                >
                  {savingAccounts ? 'Menyimpan...' : '💾 Simpan Semua Rekening'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TENANT CREATED SUCCESS MODAL ═══════════ */}
        {createdTenantInfo && (
          <div style={styles.editBackdrop} onClick={() => setCreatedTenantInfo(null)}>
            <div style={{ ...styles.editModal, maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ ...styles.editModalTitle, marginBottom: '0.5rem', textAlign: 'center' }}>Akun Berhasil Dibuat!</h3>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
                Berikan info berikut langsung kepada penyewa agar bisa login.
              </p>

              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', textAlign: 'left' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600', margin: 0 }}>Nama</p>
                  <p style={{ fontSize: '1rem', color: '#f3f4f6', fontWeight: '700', margin: '0.2rem 0 0' }}>{createdTenantInfo.name}</p>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600', margin: 0 }}>Email (untuk login)</p>
                  <p style={{ fontSize: '0.95rem', color: '#60a5fa', fontWeight: '700', fontFamily: 'monospace', margin: '0.2rem 0 0' }}>{createdTenantInfo.email}</p>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600', margin: 0 }}>Password Awal</p>
                  <p style={{ fontSize: '1.1rem', color: '#fbbf24', fontWeight: '800', fontFamily: 'monospace', margin: '0.2rem 0 0', letterSpacing: '0.05em' }}>{createdTenantInfo.password}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600', margin: 0 }}>Status KTP</p>
                  <p style={{ fontSize: '0.85rem', color: createdTenantInfo.isVerified ? '#34d399' : '#fbbf24', fontWeight: '700', margin: '0.2rem 0 0' }}>
                    {createdTenantInfo.isVerified ? '✅ Terverifikasi (KTP diupload admin)' : '⏳ Belum terverifikasi (upload KTP diperlukan)'}
                  </p>
                </div>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                <p style={{ fontSize: '0.78rem', color: '#fbbf24', margin: 0, lineHeight: '1.5' }}>
                  ⚠️ <strong>Catat sekarang!</strong> Password tidak bisa dilihat lagi setelah modal ini ditutup. Minta penyewa untuk mengganti password setelah login pertama.
                </p>
              </div>

              <button onClick={() => setCreatedTenantInfo(null)} style={{ ...styles.adminSubmit, marginTop: 0 }}>
                Oke, Sudah Dicatat
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ ADD PROPERTY TAB ═══════════ */}
        {activeTab === 'add-property' && (
          <div style={styles.fadeIn}>
            <div style={{ ...styles.sectionCard, maxWidth: '680px' }}>
              <h2 style={styles.sectionTitle}>Tambah Properti Baru</h2>
              <p style={styles.formHint}>Isi data kontrakan baru yang akan ditampilkan di peta dan halaman pencarian.</p>

              {errorMsg && (
                <div style={styles.adminError}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddPropertySubmit} style={styles.adminForm}>
                <div style={styles.formGroup}>
                  <label style={styles.adminLabel} htmlFor="name">Nama Kontrakan / Properti</label>
                  <input
                    id="name"
                    type="text"
                    style={styles.adminInput}
                    placeholder="Kontrakan Dago Asri"
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.adminLabel} htmlFor="address">Alamat Lengkap</label>
                  <input
                    id="address"
                    type="text"
                    style={styles.adminInput}
                    placeholder="Jl. Dago Asri No. 12, Coblong, Bandung"
                    value={propAddress}
                    onChange={(e) => setPropAddress(e.target.value)}
                    required
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.adminLabel} htmlFor="lat">Latitude (GPS)</label>
                    <input
                      id="lat"
                      type="text"
                      style={styles.adminInput}
                      placeholder="-6.88930"
                      value={propLat}
                      onChange={(e) => setPropLat(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.adminLabel} htmlFor="lng">Longitude (GPS)</label>
                    <input
                      id="lng"
                      type="text"
                      style={styles.adminInput}
                      placeholder="107.61610"
                      value={propLng}
                      onChange={(e) => setPropLng(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.adminLabel} htmlFor="coverImage">Foto Cover Properti</label>
                  <div style={styles.fileDropZone}>
                    <input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPropCover(e.target.files[0])}
                      style={styles.fileInputHidden}
                    />
                    <label htmlFor="coverImage" style={styles.fileDropLabel}>
                      <Image size={24} color="#6b7280" />
                      <span>{propCover ? propCover.name : 'Klik untuk memilih gambar'}</span>
                    </label>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.adminLabel} htmlFor="desc">Deskripsi Properti</label>
                  <textarea
                    id="desc"
                    style={styles.adminTextarea}
                    placeholder="Deskripsi detail properti..."
                    value={propDesc}
                    onChange={(e) => setPropDesc(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  style={styles.adminSubmit}
                  disabled={submittingProp}
                >
                  {submittingProp ? 'Menyimpan Properti...' : 'Tambahkan Properti'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ──────── ADMIN-SPECIFIC STYLES ────────
// A professional slate/amber design – distinct from the user-facing violet/cyan glassmorphic theme
const styles = {
  adminLayout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0b0f19',
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px',
    padding: '1.5rem 2rem 3rem',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0b0f19 0%, #111827 100%)',
  },
  fadeIn: {
    animation: 'fadeIn 0.35s ease forwards',
  },

  // ── Top Bar ──
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  pageTitle: {
    fontSize: '1.65rem',
    fontWeight: '800',
    fontFamily: "'Outfit', sans-serif",
    color: '#f9fafb',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '0.3rem',
  },
  topBarRight: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  dateChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.78rem',
    color: '#9ca3af',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '0.45rem 0.85rem',
  },

  // ── Stats Grid ──
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.75rem',
  },
  statCard: {
    padding: '1.25rem',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    position: 'relative',
    overflow: 'hidden',
  },
  statCardAmber: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  statCardGreen: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  statCardYellow: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(180, 120, 10, 0.03) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.12)',
  },
  statCardBlue: {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  statIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '0.72rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.06em',
    margin: 0,
  },
  statVal: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#f3f4f6',
    fontFamily: "'Outfit', sans-serif",
    lineHeight: '1.1',
    margin: 0,
  },
  statTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.7rem',
    color: '#f59e0b',
    fontWeight: '500',
  },

  // ── Section Card ──
  sectionCard: {
    background: 'rgba(17, 24, 39, 0.6)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    backdropFilter: 'blur(10px)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#e5e7eb',
    fontFamily: "'Outfit', sans-serif",
    margin: 0,
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '8px',
    padding: '0.4rem 0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  refreshChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#9ca3af',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '0.4rem 0.75rem',
    cursor: 'pointer',
  },

  // ── Admin Table ──
  miniTableWrap: {
    width: '100%',
    overflowX: 'auto',
  },
  adminTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 2px',
    textAlign: 'left',
  },
  adminTh: {
    padding: '0.75rem 1rem',
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    color: '#6b7280',
    fontWeight: '700',
    letterSpacing: '0.08em',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  adminTr: {
    transition: 'background 0.15s ease',
  },
  adminTd: {
    padding: '0.85rem 1rem',
    fontSize: '0.82rem',
    verticalAlign: 'middle',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  cellUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  cellAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.75rem',
    flexShrink: 0,
  },
  cellName: {
    fontWeight: '600',
    color: '#e5e7eb',
    fontSize: '0.82rem',
    margin: 0,
  },
  cellSub: {
    fontSize: '0.72rem',
    color: '#6b7280',
    margin: 0,
  },
  ktpLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: '#f59e0b',
    textDecoration: 'none',
    fontSize: '0.78rem',
    fontWeight: '500',
  },
  actionRow: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  btnAccept: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.7rem',
    fontSize: '0.72rem',
    fontWeight: '600',
    borderRadius: '7px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  },
  btnReject: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.7rem',
    fontSize: '0.72rem',
    fontWeight: '600',
    borderRadius: '7px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  btnVerify: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.7rem',
    fontSize: '0.72rem',
    fontWeight: '600',
    borderRadius: '7px',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#fbbf24',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  activeLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    color: '#34d399',
    fontSize: '0.75rem',
    fontWeight: '700',
  },

  // ── Properties ──
  twoCol: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  propGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  propCard: {
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.2s ease',
  },
  propCardImg: {
    width: '100%',
    height: '110px',
    objectFit: 'cover',
  },
  propCardBody: {
    padding: '0.85rem',
  },
  propCardName: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#e5e7eb',
    margin: '0 0 0.2rem',
    fontFamily: "'Outfit', sans-serif",
  },
  propCardAddr: {
    fontSize: '0.72rem',
    color: '#6b7280',
    margin: 0,
  },
  propCardMeta: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.6rem',
  },
  propCardBadge: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#fbbf24',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '6px',
    padding: '0.2rem 0.5rem',
  },
  propCardAvail: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '6px',
    padding: '0.2rem 0.5rem',
  },
  propListVertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '520px',
    overflowY: 'auto',
    paddingRight: '0.25rem',
  },
  propListItem: {
    display: 'flex',
    gap: '1rem',
    padding: '0.85rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'all 0.2s ease',
  },
  propListThumb: {
    width: '100px',
    height: '75px',
    objectFit: 'cover',
    borderRadius: '10px',
    flexShrink: 0,
  },
  propListName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#e5e7eb',
    margin: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  propListAddr: {
    fontSize: '0.78rem',
    color: '#6b7280',
    margin: '0.15rem 0 0',
  },
  propListCoords: {
    fontSize: '0.65rem',
    fontFamily: 'monospace',
    color: '#4b5563',
    margin: '0.1rem 0 0',
  },
  propListBadges: {
    display: 'flex',
    gap: '0.4rem',
    marginTop: '0.4rem',
  },
  propListUnitBadge: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#fbbf24',
    background: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '6px',
    padding: '0.15rem 0.45rem',
  },
  propListAvailBadge: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '6px',
    padding: '0.15rem 0.45rem',
  },

  // ── Forms ──
  adminForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  formHint: {
    fontSize: '0.82rem',
    color: '#6b7280',
    marginTop: '0.35rem',
    lineHeight: '1.4',
  },
  adminLabel: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: '0.02em',
  },
  adminInput: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '9px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.3)',
    color: '#e5e7eb',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  adminSelect: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '9px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#0b0f19',
    color: '#e5e7eb',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    outline: 'none',
  },
  adminTextarea: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '9px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.3)',
    color: '#e5e7eb',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    minHeight: '80px',
    resize: 'vertical',
    outline: 'none',
  },
  adminSubmit: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: '700',
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
  },
  fileDropZone: {
    position: 'relative',
    borderRadius: '10px',
    border: '2px dashed rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.2)',
    padding: '1rem',
    textAlign: 'center',
  },
  fileInputHidden: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  fileDropLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.82rem',
    color: '#6b7280',
    cursor: 'pointer',
  },
  adminError: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#f87171',
    fontSize: '0.82rem',
    marginTop: '0.5rem',
  },

  // ── Loading & Empty ──
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2.5rem 0',
  },
  adminSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(245, 158, 11, 0.1)',
    borderTopColor: '#f59e0b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '0.82rem',
    color: '#6b7280',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '3rem 0',
  },
  emptyText: {
    color: '#4b5563',
    fontSize: '0.88rem',
  },

  // ── Property list hint ──
  propHint: {
    fontSize: '0.72rem',
    color: '#4b5563',
    marginBottom: '0.75rem',
    fontStyle: 'italic',
  },

  // ── Unit management row ──
  unitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 0.75rem',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  unitRowName: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#e5e7eb',
    fontFamily: "'Outfit', sans-serif",
  },
  unitRowType: {
    fontSize: '0.7rem',
    color: '#6b7280',
    background: 'rgba(255,255,255,0.05)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
  },
  unitRowPrice: {
    fontSize: '0.75rem',
    color: '#f59e0b',
    fontWeight: '600',
    margin: '0.1rem 0 0',
  },
  statusSelect: {
    border: 'none',
    borderRadius: '7px',
    padding: '0.3rem 0.5rem',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    outline: 'none',
    flexShrink: 0,
  },
  iconBtnAmber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '7px',
    border: '1px solid rgba(245,158,11,0.3)',
    background: 'rgba(245,158,11,0.08)',
    color: '#fbbf24',
    cursor: 'pointer',
    flexShrink: 0,
  },
  iconBtnRed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '7px',
    border: '1px solid rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.08)',
    color: '#f87171',
    cursor: 'pointer',
    flexShrink: 0,
  },

  // ── Edit unit modal ──
  editBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(5px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  editModal: {
    background: '#0f1623',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '1.5rem',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
    animation: 'fadeIn 0.2s ease',
  },
  editModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  editModalTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#f9fafb',
    fontFamily: "'Outfit', sans-serif",
    margin: 0,
  },
  editCloseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  editRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
};

export default AdminDashboard;
