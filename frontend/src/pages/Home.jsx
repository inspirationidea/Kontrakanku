import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../utils/api';
import { getPropertyImageUrl, handleImageError } from '../utils/imageHelper';
import {
  Search, MapPin, Star, ArrowRight, RefreshCw,
  ChevronLeft, ChevronRight, Map, X, SlidersHorizontal,
  Smartphone, Download,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
};

const PAGE_SIZE = 9; // 3×3 grid

const CHIPS = [
  { id: 'all',      label: 'Semua',        filter: () => true },
  { id: 'available',label: '● Tersedia',   filter: p => p.availableUnitsCount > 0 },
  { id: 'cheap',    label: '< Rp 1 Juta',  filter: p => (p.startPrice || 0) < 1000000 },
  { id: 'topRated', label: '⭐ Rating 4+', filter: p => (p.avgRating || 0) >= 4 },
];

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [mapCenter, setMapCenter] = useState([-6.8893, 107.6161]);
  const [activePropertyId, setActivePropertyId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [activeChip, setActiveChip] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  // Proper React pattern: fetch inside useEffect, setState only from async callback
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (searchQuery) filters.search = searchQuery;
        if (minPrice)    filters.minPrice = minPrice;
        if (maxPrice)    filters.maxPrice = maxPrice;
        const res = await api.properties.getAll(filters);
        if (!cancelled && res.success) {
          setProperties(res.data);
          setCurrentPage(1);
          if (res.data.length > 0) setMapCenter([res.data[0].lat, res.data[0].lng]);
        }
      } catch (err) {
        if (!cancelled) console.error('Error fetching properties:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [searchQuery, minPrice, maxPrice, refreshKey]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // trigger re-fetch by flushing state (already dep of useEffect above)
  };

  const formatFull = (num) => num ? 'Rp ' + num.toLocaleString('id-ID') : 'Rp 0';

  const sortedProperties = useMemo(() => {
    const chip = CHIPS.find(c => c.id === activeChip);
    let arr = chip ? properties.filter(chip.filter) : [...properties];
    if (sortBy === 'price_asc')  arr.sort((a, b) => (a.startPrice || 0) - (b.startPrice || 0));
    if (sortBy === 'price_desc') arr.sort((a, b) => (b.startPrice || 0) - (a.startPrice || 0));
    if (sortBy === 'rating')     arr.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    if (sortBy === 'available')  arr.sort((a, b) => (b.availableUnitsCount || 0) - (a.availableUnitsCount || 0));
    return arr;
  }, [properties, sortBy, activeChip]);

  const totalPages = Math.ceil(sortedProperties.length / PAGE_SIZE);
  const paginatedProperties = useMemo(
    () => sortedProperties.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedProperties, currentPage]
  );

  // Hitung stats dari data real (semua properti tanpa filter chip)
  const platformStats = useMemo(() => {
    const totalUnit = properties.reduce((s, p) => s + (p.availableUnitsCount || 0), 0);
    const ratedProps = properties.filter(p => p.avgRating > 0);
    const avgRating = ratedProps.length > 0
      ? (ratedProps.reduce((s, p) => s + p.avgRating, 0) / ratedProps.length).toFixed(1)
      : '4.8';
    return {
      total: properties.length,
      available: totalUnit,
      rating: avgRating,
    };
  }, [properties]);

  const createPriceIcon = (price, isActive) => {
    const formatted = price > 0 ? `${(price / 1000).toLocaleString('id-ID')}k` : 'N/A';
    const bg = isActive ? '#06b6d4' : '#8b5cf6';
    return L.divIcon({
      className: 'price-marker',
      html: `<div style="background:${bg};color:white;font-family:'Outfit',sans-serif;font-weight:700;font-size:11px;padding:4px 8px;border-radius:12px;border:2px solid rgba(255,255,255,0.8);white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.3);">${formatted}</div>`,
      iconSize: [50, 26], iconAnchor: [25, 13],
    });
  };

  const handleChipClick = (chipId) => {
    setActiveChip(chipId);
    setCurrentPage(1);
  };

  return (
    <div style={s.page}>

      {/* ══════════════ HERO SECTION ══════════════ */}
      <div style={s.hero}>
        {/* Dot pattern overlay */}
        <div style={s.heroDots} />
        {/* Radial glows */}
        <div style={s.heroGlow1} />
        <div style={s.heroGlow2} />

        <div style={s.heroContent}>
          <div style={s.heroTag}>🏠 Platform Kontrakan #1 di Bandung</div>
          <h1 style={s.heroTitle}>
            Temukan Kontrakan<br />
            <span className="gradient-text">Impian Anda</span>
          </h1>
          <p style={s.heroSub}>
            Ribuan pilihan kontrakan & kost nyaman, harga transparan, booking online mudah.
          </p>

          {/* Search box */}
          <form onSubmit={handleSearchSubmit} style={s.searchBox}>
            <div style={s.searchInputWrap}>
              <Search size={18} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cari nama kontrakan atau alamat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={s.searchInput}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} style={s.clearBtn}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div style={s.searchDivider} />

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
              style={s.sortSelect}
            >
              <option value="default">Urutkan</option>
              <option value="price_asc">Harga Termurah</option>
              <option value="price_desc">Harga Termahal</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="available">Paling Tersedia</option>
            </select>

            <div style={s.searchDivider} />

            {/* Map toggle */}
            <button
              type="button"
              onClick={() => setShowMap(v => !v)}
              style={{ ...s.iconBtn, color: showMap ? 'var(--secondary)' : 'var(--text-muted)' }}
              title={showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
            >
              <Map size={18} />
              <span style={{ fontSize: '0.8rem' }}>{showMap ? 'Tutup' : 'Peta'}</span>
            </button>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilter(v => !v)}
              style={{ ...s.iconBtn, color: (minPrice || maxPrice) ? 'var(--primary)' : 'var(--text-muted)' }}
              title="Filter harga"
            >
              <SlidersHorizontal size={18} />
              <span style={{ fontSize: '0.8rem' }}>Filter</span>
            </button>

            <button type="submit" className="btn btn-primary" style={s.searchBtn}>
              Cari
            </button>
          </form>

          {/* Price filter (expandable) */}
          {showFilter && (
            <div style={s.priceFilterRow}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Harga / bulan:</span>
              <input
                type="number" placeholder="Min (Rp)" value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                style={s.priceInput}
              />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input
                type="number" placeholder="Max (Rp)" value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                style={s.priceInput}
              />
              {(minPrice || maxPrice) && (
                <button type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); }} style={s.clearBtn}>
                  <X size={14} /> Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div style={s.heroStats}>
          {[
            { val: loading ? '...' : `${platformStats.total}+`, label: 'Kontrakan' },
            { val: loading ? '...' : `${platformStats.available}+`, label: 'Unit Tersedia' },
            { val: loading ? '...' : `${platformStats.rating}★`, label: 'Rating Rata-rata' },
          ].map(st => (
            <div key={st.label} style={s.statItem}>
              <span style={s.statVal}>{st.val}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* Download APK button */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: '1.25rem' }}>
          <a
            href="/KontrakanKu.apk"
            download="KontrakanKu.apk"
            style={s.downloadBtn}
          >
            <Smartphone size={18} />
            <span>Download Aplikasi Android</span>
            <span style={s.downloadBadge}>
              <Download size={13} /> APK
            </span>
          </a>
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.5rem' }}>
            Android 7.0+ · Gratis · Tidak perlu Play Store
          </p>
        </div>
      </div>

      {/* ══════════════ CONTENT AREA ══════════════ */}
      <div style={s.content}>

        {/* Quick filter chips + results bar */}
        <div style={s.filtersRow}>
          <div style={s.chips}>
            {CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip.id)}
                style={{
                  ...s.chip,
                  ...(activeChip === chip.id ? s.chipActive : {}),
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div style={s.resultsInfo}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text-white)' }}>{sortedProperties.length}</strong> kontrakan ditemukan
            </span>
            <button onClick={() => setRefreshKey(k => k + 1)} style={s.refreshBtn} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Map toggle section */}
        {showMap && (
          <div style={s.mapContainer} className="fade-in">
            {properties.length > 0 ? (
              <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com">CARTO</a>'
                />
                <MapRecenter center={mapCenter} />
                {properties.map(prop => (
                  <Marker
                    key={prop.id}
                    position={[prop.lat, prop.lng]}
                    icon={createPriceIcon(prop.startPrice, activePropertyId === prop.id)}
                    eventHandlers={{
                      click: () => {
                        setActivePropertyId(prop.id);
                        setMapCenter([prop.lat, prop.lng]);
                        const idx = sortedProperties.findIndex(p => p.id === prop.id);
                        if (idx !== -1) setCurrentPage(Math.floor(idx / PAGE_SIZE) + 1);
                      },
                    }}
                  >
                    <Popup>
                      <div style={{ width: 180 }}>
                        <img
                          src={getPropertyImageUrl(prop.coverImage, prop.id)}
                          alt={prop.name}
                          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8 }}
                          onError={e => handleImageError(e, prop.id)}
                        />
                        <p style={{ fontWeight: 'bold', color: '#fff', margin: '0.35rem 0 0.1rem', fontSize: '0.88rem' }}>{prop.name}</p>
                        <p style={{ color: '#06b6d4', fontWeight: '700', fontSize: '0.82rem', margin: 0 }}>{formatFull(prop.startPrice)} /bln</p>
                        <button onClick={() => navigate(`/properties/${prop.id}`)} style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', padding: '0.3rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '0.35rem' }}>
                          Lihat Detail
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Tidak ada properti untuk ditampilkan di peta.
              </div>
            )}
          </div>
        )}

        {/* Property Grid */}
        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.spinner} />
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Mencari kontrakan terbaik...</p>
          </div>
        ) : sortedProperties.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
            <h3 style={{ color: 'var(--text-white)', marginBottom: '0.5rem' }}>Tidak ada kontrakan ditemukan</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Coba ubah kata kunci atau hapus filter yang aktif.</p>
            <button onClick={() => { setSearchQuery(''); setMinPrice(''); setMaxPrice(''); setActiveChip('all'); }} className="btn btn-secondary" style={{ marginTop: '1.25rem' }}>
              Hapus Semua Filter
            </button>
          </div>
        ) : (
          <>
            <div className="property-grid">
              {paginatedProperties.map(prop => (
                <div
                  key={prop.id}
                  className="glass-card glass-card-interactive"
                  onClick={() => navigate(`/properties/${prop.id}`)}
                  style={{
                    ...s.card,
                    borderColor: activePropertyId === prop.id ? 'var(--secondary)' : 'var(--border-light)',
                    boxShadow: activePropertyId === prop.id ? '0 0 20px rgba(6,182,212,0.2)' : 'var(--shadow-premium)',
                  }}
                >
                  {/* Image with overlay badges */}
                  <div style={s.cardImgWrap}>
                    <img
                      src={getPropertyImageUrl(prop.coverImage, prop.id || prop.name)}
                      alt={prop.name}
                      style={s.cardImg}
                      onError={e => handleImageError(e, prop.id || prop.name)}
                    />

                    {/* Availability badge — bottom left overlay */}
                    <div style={{
                      ...s.imgBadge,
                      left: '0.6rem', bottom: '0.6rem',
                      background: prop.availableUnitsCount > 0 ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.85)',
                    }}>
                      {prop.availableUnitsCount > 0 ? `● ${prop.availableUnitsCount} tersedia` : '● Penuh'}
                    </div>

                    {/* Rating badge — top right overlay */}
                    <div style={{ ...s.imgBadge, right: '0.6rem', top: '0.6rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ marginLeft: '0.2rem' }}>{prop.avgRating > 0 ? prop.avgRating.toFixed(1) : 'Baru'}</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={s.cardBody}>
                    <h3 style={s.cardName}>{prop.name}</h3>
                    <p style={s.cardAddr}>
                      <MapPin size={12} style={{ flexShrink: 0, marginRight: '3px' }} />
                      {prop.address.split(',').slice(0, 2).join(',')}
                    </p>

                    <div style={s.cardFooter}>
                      <div>
                        <p style={s.cardPriceLabel}>Mulai dari</p>
                        <p style={s.cardPrice}>
                          {formatFull(prop.startPrice)}
                          <span style={s.cardPricePer}>/bln</span>
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/properties/${prop.id}`); }}
                        className="btn btn-primary"
                        style={s.cardBtn}
                      >
                        Detail <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={s.pagination}>
                <button
                  style={{ ...s.pageBtn, opacity: currentPage === 1 ? 0.35 : 1 }}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>

                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        ...s.pageNum,
                        background: page === currentPage ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
                        color: page === currentPage ? '#fff' : 'var(--text-muted)',
                        border: page === currentPage ? 'none' : '1px solid var(--border-light)',
                        fontWeight: page === currentPage ? '700' : '400',
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  style={{ ...s.pageBtn, opacity: currentPage === totalPages ? 0.35 : 1 }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  // Hero
  hero: {
    position: 'relative',
    background: 'linear-gradient(160deg, #0d0a1f 0%, #0a0712 60%, #0c0f1a 100%)',
    padding: '4rem 1.5rem 2.5rem',
    overflow: 'hidden',
  },
  heroDots: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: 'radial-gradient(rgba(139,92,246,0.18) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    pointerEvents: 'none',
  },
  heroGlow1: {
    position: 'absolute', top: '-80px', right: '-80px', width: 400, height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  heroGlow2: {
    position: 'absolute', bottom: '-60px', left: '10%', width: 300, height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  heroContent: {
    position: 'relative', zIndex: 1,
    maxWidth: '860px', margin: '0 auto',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
  },
  heroTag: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    background: 'rgba(139,92,246,0.12)',
    border: '1px solid rgba(139,92,246,0.3)',
    borderRadius: '20px', padding: '0.3rem 1rem',
    fontSize: '0.78rem', fontWeight: '600', color: '#a78bfa',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    lineHeight: '1.15',
    letterSpacing: '-0.03em',
    margin: 0,
    color: '#fff',
  },
  heroSub: {
    fontSize: '1rem',
    color: 'var(--text-muted)',
    maxWidth: '520px',
    lineHeight: 1.6,
    margin: 0,
  },

  // Search box
  searchBox: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(18,14,30,0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding: '0.5rem 0.5rem 0.5rem 1.25rem',
    gap: '0.5rem',
    width: '100%',
    maxWidth: '800px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    marginTop: '0.5rem',
  },
  searchInputWrap: {
    display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1,
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text-white)', fontFamily: 'inherit', fontSize: '0.92rem',
    minWidth: 0,
  },
  searchDivider: {
    width: '1px', height: '24px',
    background: 'rgba(255,255,255,0.1)', flexShrink: 0,
  },
  sortSelect: {
    background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: '0.82rem',
    cursor: 'pointer', padding: '0 0.25rem', whiteSpace: 'nowrap',
  },
  iconBtn: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0.5rem 0.6rem', borderRadius: '8px',
    transition: 'var(--transition-smooth)',
    flexShrink: 0,
  },
  searchBtn: {
    padding: '0.6rem 1.5rem', borderRadius: '10px',
    fontSize: '0.88rem', flexShrink: 0,
  },
  clearBtn: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    background: 'rgba(255,255,255,0.06)', border: 'none',
    borderRadius: '6px', padding: '0.25rem 0.5rem',
    cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem',
    flexShrink: 0,
  },
  priceFilterRow: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    background: 'rgba(18,14,30,0.85)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', padding: '0.55rem 1rem',
    width: '100%', maxWidth: '800px',
    animation: 'fadeIn 0.2s ease',
  },
  priceInput: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '7px', padding: '0.35rem 0.6rem',
    color: 'var(--text-white)', fontSize: '0.82rem', width: '130px',
    outline: 'none', fontFamily: 'inherit',
  },
  heroStats: {
    position: 'relative', zIndex: 1,
    display: 'flex', gap: '2rem',
    marginTop: '0.5rem',
    justifyContent: 'center',
  },
  downloadBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    borderRadius: '30px',
    padding: '0.7rem 1.6rem',
    fontSize: '0.92rem', fontWeight: '600',
    fontFamily: 'var(--font-display)',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  downloadBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
    background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
    borderRadius: '20px', padding: '0.15rem 0.6rem',
    fontSize: '0.7rem', fontWeight: '800',
    letterSpacing: '0.05em',
  },
  statItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem',
  },
  statVal: {
    fontSize: '1.25rem', fontWeight: '800',
    fontFamily: 'var(--font-display)', color: '#fff',
  },
  statLabel: {
    fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },

  // Content
  content: {
    maxWidth: '1400px', margin: '0 auto', width: '100%',
    padding: '1.5rem 1.5rem 3rem',
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
    flex: 1,
  },
  filtersRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
  },
  chips: {
    display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
  },
  chip: {
    padding: '0.4rem 1rem', borderRadius: '20px',
    fontSize: '0.82rem', fontWeight: '600',
    border: '1px solid var(--border-light)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-muted)',
    cursor: 'pointer', transition: 'var(--transition-smooth)',
  },
  chipActive: {
    background: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.45)',
    color: '#a78bfa',
  },
  resultsInfo: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
  },
  refreshBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)',
    borderRadius: '8px', padding: '0.4rem', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
  },

  // Map
  mapContainer: {
    height: '350px', borderRadius: '16px', overflow: 'hidden',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-premium)',
  },

  // Card
  card: {
    borderRadius: '16px', overflow: 'hidden',
    padding: 0, cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    transition: 'var(--transition-smooth)',
  },
  cardImgWrap: {
    position: 'relative', width: '100%',
    height: '200px', flexShrink: 0, overflow: 'hidden',
  },
  cardImg: {
    width: '100%', height: '100%', objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.4s ease',
  },
  imgBadge: {
    position: 'absolute',
    display: 'inline-flex', alignItems: 'center',
    padding: '0.25rem 0.6rem',
    borderRadius: '20px', fontSize: '0.68rem', fontWeight: '700',
    color: '#fff', backdropFilter: 'blur(4px)',
  },
  cardBody: {
    padding: '1rem 1.1rem 1.1rem',
    display: 'flex', flexDirection: 'column', gap: '0.35rem',
    flex: 1,
  },
  cardName: {
    fontSize: '0.97rem', fontWeight: '700', fontFamily: 'var(--font-display)',
    color: 'var(--text-white)', margin: 0,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    lineHeight: '1.3',
  },
  cardAddr: {
    display: 'flex', alignItems: 'center',
    fontSize: '0.75rem', color: 'var(--text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    margin: 0,
  },
  cardFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: '0.5rem', paddingTop: '0.65rem',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  cardPriceLabel: {
    fontSize: '0.65rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    margin: 0,
  },
  cardPrice: {
    fontSize: '1.05rem', fontWeight: '800',
    color: 'var(--secondary)', fontFamily: 'var(--font-display)',
    margin: '0.1rem 0 0',
  },
  cardPricePer: {
    fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '400',
    marginLeft: '2px',
  },
  cardBtn: {
    padding: '0.4rem 0.85rem', fontSize: '0.78rem',
    borderRadius: '8px', gap: '0.3rem',
  },

  // Loading / Empty
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '5rem 1rem',
  },
  spinner: {
    width: 48, height: 48,
    border: '3px solid rgba(139,92,246,0.15)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center', padding: '4rem 1rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },

  // Pagination
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    paddingTop: '1rem',
  },
  pageBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '36px', height: '36px', borderRadius: '10px',
    border: '1px solid var(--border-light)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-main)', cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  pageNum: {
    width: '36px', height: '36px', borderRadius: '10px',
    fontSize: '0.82rem', cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

export default Home;
