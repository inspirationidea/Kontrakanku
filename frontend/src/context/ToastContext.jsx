import { createContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} color="#34d399" />,
  error:   <XCircle size={18} color="#f87171" />,
  warning: <AlertTriangle size={18} color="#fbbf24" />,
  info:    <Info size={18} color="#60a5fa" />,
};

const COLORS = {
  success: { border: 'rgba(16,185,129,0.3)',  bg: 'rgba(16,185,129,0.08)',  text: '#34d399' },
  error:   { border: 'rgba(239,68,68,0.35)',   bg: 'rgba(239,68,68,0.08)',   text: '#f87171' },
  warning: { border: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.08)',  text: '#fbbf24' },
  info:    { border: 'rgba(59,130,246,0.35)',  bg: 'rgba(59,130,246,0.08)',  text: '#60a5fa' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.6rem',
        maxWidth: '360px', width: '100%',
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: `rgba(18,14,30,0.97)`,
              border: `1px solid ${c.border}`,
              borderLeft: `4px solid ${c.text}`,
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              animation: 'fadeIn 0.25s ease',
            }}>
              <div style={{ flexShrink: 0, marginTop: '1px' }}>{ICONS[t.type]}</div>
              <p style={{ flex: 1, fontSize: '0.85rem', color: '#f3f4f6', margin: 0, lineHeight: 1.4 }}>{t.message}</p>
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0', flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// useToast hook — import dari useToast.js
export { ToastContext };
