import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = '', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const icons = { success: '✓', danger: '✕', warn: '⚠' }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        zIndex: 400, display: 'flex', flexDirection: 'column', gap: '.5rem'
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              background: t.type === 'success' ? '#2e7d5e'
                        : t.type === 'danger'  ? '#c0392b'
                        : t.type === 'warn'    ? '#7a6000'
                        : '#2c3e3f',
              color: 'white',
              borderRadius: 10,
              padding: '.75rem 1.1rem',
              fontSize: '.85rem',
              fontWeight: 500,
              minWidth: 240,
              maxWidth: 340,
              boxShadow: '0 4px 16px rgba(44,62,63,.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '.6rem',
              cursor: 'pointer',
              animation: 'raktaSlideIn .25s ease',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <span>{icons[t.type] || 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes raktaSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.showToast
}