import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { getPropertyImageUrl, handleImageError } from '../utils/imageHelper';
import { MapPin, Star, Wifi, Tv, Coffee, Wind, Compass, AlertCircle, ArrowLeft } from 'lucide-react';
import UnitDetailModal from '../components/UnitDetailModal';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    const fetchPropertyDetail = async () => {
      try {
        const res = await api.properties.getById(id);
        if (res.success) {
          setProperty(res.data);
        } else {
          setErrorMsg(res.message || 'Gagal memuat detail kontrakan.');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [id]);

  const formatRupiah = (num) => {
    if (!num) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const getFacilityIcon = (facility) => {
    const fac = facility.toLowerCase();
    if (fac.includes('wifi') || fac.includes('internet')) return <Wifi size={16} />;
    if (fac.includes('tv') || fac.includes('televisi')) return <Tv size={16} />;
    if (fac.includes('dapur') || fac.includes('kopi')) return <Coffee size={16} />;
    if (fac.includes('ac') || fac.includes('pendingin')) return <Wind size={16} />;
    return <Compass size={16} />; // fallback
  };


  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Memuat detail properti...</p>
      </div>
    );
  }

  if (errorMsg || !property) {
    return (
      <div className="main-content" style={styles.errorContainer}>
        <div style={styles.errorCard} className="glass-card">
          <AlertCircle size={36} color="var(--color-danger)" />
          <h3>Ada Masalah</h3>
          <p>{errorMsg || 'Properti tidak ditemukan.'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  // Fallback photos if gallery empty
  const photos = property.photos && property.photos.length > 0
    ? property.photos.map(p => `http://localhost:4000${p.url}`)
    : [
        getPropertyImageUrl(property.coverImage, property.id || property.name)
      ];

  return (
    <div className="main-content fade-in" style={styles.container}>
      {/* Breadcrumb / Back nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.4rem 0.85rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '500' }}>
          <ArrowLeft size={15} /> Kembali
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>/ {property?.name || 'Detail Properti'}</span>
      </div>

      {/* Upper Grid: Gallery + Info */}
      <div style={styles.upperGrid}>
        {/* Gallery Carousel */}
        <div style={styles.galleryCard} className="glass-card">
          <div style={styles.mainPhotoWrapper}>
            <img 
              src={photos[activePhotoIndex]} 
              alt={property.name} 
              style={styles.mainPhoto} 
              onError={(e) => handleImageError(e, property.id || property.name)}
            />
          </div>
          {photos.length > 1 && (
            <div style={styles.thumbnails}>
              {photos.map((url, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.thumbnailWrapper,
                    borderColor: idx === activePhotoIndex ? 'var(--secondary)' : 'transparent',
                    opacity: idx === activePhotoIndex ? 1 : 0.6
                  }}
                  onClick={() => setActivePhotoIndex(idx)}
                >
                  <img 
                    src={url} 
                    alt="" 
                    style={styles.thumbnail} 
                    onError={(e) => handleImageError(e, property.id || property.name)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Metadata */}
        <div style={styles.infoCard} className="glass-card">
          <div style={styles.infoHead}>
            <div style={styles.ratingBadge}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <span>{property.avgRating > 0 ? `${property.avgRating.toFixed(1)} / 5.0` : 'Baru'}</span>
              <span style={styles.reviewCount}>({property.totalReviews || 0} Ulasan)</span>
            </div>
            <h1 style={styles.title}>{property.name}</h1>
            <p style={styles.address}>
              <MapPin size={18} color="var(--secondary)" />
              <span>{property.address}</span>
            </p>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.ownerSection}>
            <p style={styles.sectionSubtitle}>Pengelola Kontrakan</p>
            <div style={styles.ownerCard}>
              <div style={styles.ownerAvatar}>{property.admin?.name[0].toUpperCase()}</div>
              <div>
                <p style={styles.ownerName}>{property.admin?.name}</p>
                <p style={styles.ownerContact}>{property.admin?.phone || property.admin?.email}</p>
              </div>
            </div>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.descSection}>
            <p style={styles.sectionSubtitle}>Deskripsi</p>
            <p style={styles.description}>
              {property.description || 'Kontrakan eksklusif dengan fasilitas lengkap, aman, dan nyaman di lokasi strategis.'}
            </p>
          </div>
        </div>
      </div>

      {/* Rented Units Listing */}
      <div style={styles.section} className="glass-card">
        <h2 style={styles.sectionTitle}>Pilih Kamar / Unit Tersedia</h2>
        <div style={styles.unitsGrid}>
          {property.units && property.units.length > 0 ? (
            property.units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                style={{
                  ...styles.unitCard,
                  opacity: unit.status !== 'AVAILABLE' ? 0.75 : 1,
                  cursor: 'pointer',
                }}
              >
                <div style={styles.unitHeader}>
                  <div>
                    <h3 style={styles.unitNum}>{unit.unitNumber}</h3>
                    <p style={styles.unitType}>{unit.type}</p>
                  </div>
                  <span className={`badge ${unit.status === 'AVAILABLE' ? 'badge-available' : 'badge-occupied'}`}>
                    {unit.status === 'AVAILABLE' ? 'Tersedia' : unit.status}
                  </span>
                </div>

                <div style={styles.unitDivider}></div>

                <div style={styles.unitDetails}>
                  <p style={styles.priceLabel}>Biaya Sewa Bulanan</p>
                  <p style={styles.unitPrice}>
                    {formatRupiah(unit.price)}
                    <span style={styles.unitPeriod}>/bulan</span>
                  </p>
                  {unit.deposit > 0 && (
                    <p style={styles.depositInfo}>+ Deposit Jaminan: {formatRupiah(unit.deposit)} (Kembali saat check-out)</p>
                  )}
                </div>

                {unit.facilities && unit.facilities.length > 0 && (
                  <div style={styles.facilitiesSection}>
                    <p style={styles.facLabel}>Fasilitas Kamar</p>
                    <div style={styles.facilitiesList}>
                      {unit.facilities.map((fac, i) => (
                        <span key={i} style={styles.facBadge} title={fac}>
                          {getFacilityIcon(fac)}
                          <span>{fac}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {unit.description && (
                  <p style={styles.unitDesc}>{unit.description}</p>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedUnit(unit); }}
                  className="btn btn-secondary"
                  style={styles.bookBtn}
                >
                  <Compass size={16} />
                  <span>Lihat Foto & Detail</span>
                </button>
              </div>
            ))
          ) : (
            <p style={styles.emptyUnits}>Tidak ada unit kamar terdaftar untuk properti ini.</p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div style={styles.section} className="glass-card">
        <h2 style={styles.sectionTitle}>Ulasan Penyewa ({property.reviews?.length || 0})</h2>
        <div style={styles.reviewsList}>
          {property.reviews && property.reviews.length > 0 ? (
            property.reviews.map((rev) => (
              <div key={rev.id} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewUser}>
                    <div style={styles.userAvatar}>{rev.user?.name[0].toUpperCase()}</div>
                    <div>
                      <p style={styles.userName}>{rev.user?.name}</p>
                      <p style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div style={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} color={i < rev.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)'} fill={i < rev.rating ? '#f59e0b' : 'transparent'} />
                    ))}
                  </div>
                </div>
                {rev.comment && <p style={styles.reviewComment}>{rev.comment}</p>}
              </div>
            ))
          ) : (
            <p style={styles.emptyReviews}>Belum ada ulasan untuk kontrakan ini. Jadilah penyewa pertama yang memberikan ulasan!</p>
          )}
        </div>
      </div>

      {/* Unit Detail Modal */}
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          property={property}
          onClose={() => setSelectedUnit(null)}
          onBook={() => {
            setSelectedUnit(null);
            navigate('/booking', { state: { unitId: selectedUnit.id } });
          }}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
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
  upperGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '1.5rem',
  },
  galleryCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  mainPhotoWrapper: {
    width: '100%',
    height: '380px',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnails: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
    paddingBottom: '0.25rem',
  },
  thumbnailWrapper: {
    width: '80px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'var(--transition-smooth)',
    flexShrink: 0,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  infoCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  infoHead: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#fbbf24',
    padding: '0.3rem 0.65rem',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    alignSelf: 'flex-start',
  },
  reviewCount: {
    color: 'var(--text-muted)',
    fontWeight: 'normal',
    fontSize: '0.8rem',
  },
  title: {
    fontSize: '2rem',
    fontFamily: 'var(--font-display)',
  },
  address: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-light)',
    margin: '1.25rem 0',
  },
  ownerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionSubtitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    fontWeight: 'bold',
  },
  ownerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255,255,255,0.02)',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
  },
  ownerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  ownerName: {
    fontWeight: '600',
    fontSize: '0.95rem',
    color: 'var(--text-white)',
  },
  ownerContact: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  descSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  description: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.35rem',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '0.75rem',
  },
  unitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  unitCard: {
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-light)',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'var(--transition-smooth)',
  },
  unitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  unitNum: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  unitType: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  unitDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.05)',
    margin: '1rem 0',
  },
  unitDetails: {
    marginBottom: '1rem',
  },
  priceLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  unitPrice: {
    fontSize: '1.4rem',
    color: 'var(--secondary)',
    fontWeight: '800',
  },
  unitPeriod: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 'normal',
  },
  depositInfo: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  facilitiesSection: {
    marginBottom: '1.25rem',
  },
  facLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  facilitiesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  facBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '0.3rem 0.6rem',
    fontSize: '0.75rem',
    color: 'var(--text-main)',
  },
  unitDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '1.25rem',
    fontStyle: 'italic',
  },
  bookBtn: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '10px',
  },
  emptyUnits: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    gridColumn: '1 / -1',
    padding: '2rem 0',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  reviewCard: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-light)',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  },
  reviewUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--text-white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    border: '1px solid var(--border-light)',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  stars: {
    display: 'flex',
    gap: '0.1rem',
  },
  reviewComment: {
    fontSize: '0.9rem',
    color: 'var(--text-main)',
  },
  emptyReviews: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '1.5rem 0',
  },
};

export default PropertyDetail;
