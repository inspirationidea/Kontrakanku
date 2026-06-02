import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BedDouble, Wifi, Wind, Tv, Coffee, ShowerHead, Thermometer, ArrowRight, MapPin } from 'lucide-react';
import { getPlaceholderImage, getPropertyImageUrl } from '../utils/imageHelper';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

// Room-interior placeholders (different from property exteriors)
const ROOM_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80',
];

const getRoomPlaceholder = (seed) => {
  if (!seed) return ROOM_PLACEHOLDERS[0];
  const sum = String(seed).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return ROOM_PLACEHOLDERS[sum % ROOM_PLACEHOLDERS.length];
};

const getUnitImageUrl = (url, seed) => {
  if (!url) return getRoomPlaceholder(seed);
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const FACILITY_ICONS = {
  'AC': <Wind size={14} />,
  'WiFi': <Wifi size={14} />,
  'TV': <Tv size={14} />,
  'Kasur': <BedDouble size={14} />,
  'Water Heater': <Thermometer size={14} />,
  'Kamar Mandi Dalam': <ShowerHead size={14} />,
  'Dapur': <Coffee size={14} />,
};

const UnitDetailModal = ({ unit, property, onClose, onBook }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  // Build photo list: real photos first, pad with placeholders to show at least 3 thumbs
  const realPhotos = (unit.photos || []).map(p => ({
    url: getUnitImageUrl(p.url, unit.id),
    caption: p.caption || '',
  }));

  const photos = realPhotos.length > 0
    ? realPhotos
    : [
        { url: getRoomPlaceholder(unit.id), caption: `${unit.unitNumber} — tampak dalam` },
        { url: getRoomPlaceholder((unit.id || '') + '1'), caption: 'Area kamar tidur' },
        { url: getRoomPlaceholder((unit.id || '') + '2'), caption: 'Fasilitas kamar' },
      ];

  const prev = useCallback(() => setActiveIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setActiveIdx(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const formatRupiah = (n) => n ? 'Rp ' + n.toLocaleString('id-ID') : 'Rp 0';

  const statusColor = unit.status === 'AVAILABLE'
    ? { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' }
    : { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' };

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button style={s.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div style={s.body}>
          {/* ── LEFT: Photo Gallery ── */}
          <div style={s.galleryCol}>
            {/* Main photo */}
            <div style={s.mainPhotoWrap}>
              <img
                key={activeIdx}
                src={photos[activeIdx].url}
                alt={photos[activeIdx].caption}
                style={s.mainPhoto}
                onError={e => { e.target.onerror = null; e.target.src = getRoomPlaceholder(unit.id + activeIdx); }}
              />

              {/* Prev / Next arrows */}
              {photos.length > 1 && (
                <>
                  <button style={{ ...s.navBtn, left: '0.75rem' }} onClick={prev}>
                    <ChevronLeft size={20} />
                  </button>
                  <button style={{ ...s.navBtn, right: '0.75rem' }} onClick={next}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Counter */}
              <div style={s.counter}>{activeIdx + 1} / {photos.length}</div>

              {/* Caption */}
              {photos[activeIdx].caption && (
                <div style={s.caption}>{photos[activeIdx].caption}</div>
              )}
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div style={s.thumbRow}>
                {photos.map((ph, i) => (
                  <div
                    key={i}
                    style={{
                      ...s.thumb,
                      borderColor: i === activeIdx ? 'var(--secondary)' : 'transparent',
                      opacity: i === activeIdx ? 1 : 0.55,
                    }}
                    onClick={() => setActiveIdx(i)}
                  >
                    <img
                      src={ph.url}
                      alt=""
                      style={s.thumbImg}
                      onError={e => { e.target.onerror = null; e.target.src = getRoomPlaceholder(unit.id + i); }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Unit Info ── */}
          <div style={s.infoCol}>
            {/* Header */}
            <div style={s.infoHeader}>
              <div>
                <h2 style={s.unitTitle}>{unit.unitNumber}</h2>
                <p style={s.unitType}>{unit.type} · <span style={s.propName}>{property?.name}</span></p>
                {property?.address && (
                  <p style={s.propAddr}>
                    <MapPin size={12} style={{ marginRight: 4, flexShrink: 0 }} />
                    {property.address.split(',').slice(0, 2).join(',')}
                  </p>
                )}
              </div>
              <span style={{ ...s.statusBadge, background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}` }}>
                {unit.status === 'AVAILABLE' ? '● Tersedia' : '● Terisi'}
              </span>
            </div>

            <div style={s.divider} />

            {/* Price */}
            <div style={s.priceBlock}>
              <div>
                <p style={s.priceLabel}>Harga Sewa</p>
                <p style={s.priceVal}>{formatRupiah(unit.price)}<span style={s.pricePer}>/bulan</span></p>
              </div>
              {unit.deposit > 0 && (
                <div style={s.depositBlock}>
                  <p style={s.priceLabel}>Deposit</p>
                  <p style={s.depositVal}>{formatRupiah(unit.deposit)}</p>
                </div>
              )}
            </div>

            <div style={s.divider} />

            {/* Facilities */}
            {unit.facilities?.length > 0 && (
              <div style={s.facilSection}>
                <p style={s.sectionLabel}>Fasilitas</p>
                <div style={s.facilGrid}>
                  {unit.facilities.map((f, i) => (
                    <span key={i} style={s.facilBadge}>
                      {FACILITY_ICONS[f] || <BedDouble size={14} />}
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {unit.description && (
              <div style={s.descSection}>
                <p style={s.sectionLabel}>Deskripsi</p>
                <p style={s.descText}>{unit.description}</p>
              </div>
            )}

            {/* CTA */}
            <div style={s.ctaBlock}>
              {unit.status === 'AVAILABLE' ? (
                <button className="btn btn-primary" style={s.bookBtn} onClick={onBook}>
                  Pesan Kamar Ini
                  <ArrowRight size={18} />
                </button>
              ) : (
                <div style={s.occupiedNote}>
                  Kamar ini sedang terisi. Cek kamar lain yang tersedia.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'rgba(18,14,30,0.97)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
    animation: 'fadeIn 0.25s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    zIndex: 10,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-main)',
    transition: 'var(--transition-smooth)',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: 0,
  },
  // Gallery
  galleryCol: {
    padding: '1.5rem',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mainPhotoWrap: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.4)',
    aspectRatio: '4/3',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'background 0.2s',
  },
  counter: {
    position: 'absolute',
    bottom: '0.6rem',
    right: '0.75rem',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: '600',
    padding: '0.2rem 0.55rem',
    borderRadius: '20px',
    backdropFilter: 'blur(4px)',
  },
  caption: {
    position: 'absolute',
    bottom: '0.6rem',
    left: '0.75rem',
    background: 'rgba(0,0,0,0.55)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.72rem',
    padding: '0.2rem 0.55rem',
    borderRadius: '20px',
    maxWidth: '70%',
    backdropFilter: 'blur(4px)',
  },
  thumbRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  thumb: {
    width: '72px',
    height: '54px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  // Info
  infoCol: {
    padding: '1.75rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    overflowY: 'auto',
  },
  infoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  unitTitle: {
    fontSize: '1.5rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    color: 'var(--text-white)',
    margin: 0,
  },
  unitType: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    margin: '0.2rem 0 0',
  },
  propName: {
    color: 'var(--secondary)',
  },
  propAddr: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.3rem',
  },
  statusBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '0.25rem 0.65rem',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    margin: '0.85rem 0',
  },
  priceBlock: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-end',
    marginBottom: '0.5rem',
  },
  priceLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    fontWeight: '600',
    margin: 0,
  },
  priceVal: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--secondary)',
    fontFamily: 'var(--font-display)',
    margin: '0.1rem 0 0',
    lineHeight: 1.1,
  },
  pricePer: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '400',
    marginLeft: '2px',
  },
  depositBlock: {},
  depositVal: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    margin: '0.1rem 0 0',
  },
  facilSection: {
    marginBottom: '0.25rem',
  },
  sectionLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginBottom: '0.6rem',
  },
  facilGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  facilBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.65rem',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '500',
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.2)',
    color: 'var(--text-main)',
  },
  descSection: {
    marginTop: '0.75rem',
  },
  descText: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    fontStyle: 'italic',
    margin: 0,
  },
  ctaBlock: {
    marginTop: 'auto',
    paddingTop: '1.25rem',
  },
  bookBtn: {
    width: '100%',
    padding: '0.85rem',
    fontSize: '1rem',
    justifyContent: 'center',
  },
  occupiedNote: {
    textAlign: 'center',
    padding: '0.85rem',
    borderRadius: '10px',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
    color: '#fbbf24',
    fontSize: '0.82rem',
  },
};

export default UnitDetailModal;
