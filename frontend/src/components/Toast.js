import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let globalAddToast = null;

export function showToast(message, type = 'error') {
  if (globalAddToast) globalAddToast(message, type);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map((toast, i) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: toast.type === 'error'
                ? 'rgba(225,29,72,0.95)'
                : 'rgba(5,150,105,0.95)',
              color: '#fff',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 500,
              maxWidth: 400,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              animation: 'slideIn 0.3s ease',
              backdropFilter: 'blur(8px)',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                flexShrink: 0, background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                padding: 0, lineHeight: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
