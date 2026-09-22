import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { notificationQueries } from '../lib/supabase'

export default function Navbar({ onAuthClick }) {
  const { user, signOut }               = useAuth()
  const navigate                        = useNavigate()
  const location                        = useLocation()
  const [notifOpen, setNotifOpen]       = useState(false)
  const [notifications, setNotifications] = useState([])
  const notifRef                        = useRef(null)

  const unread = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!user) return
    notificationQueries.getAll(user.id).then(setNotifications)
    const sub = notificationQueries.subscribeToChanges(user.id, payload => {
      setNotifications(prev => [payload.new, ...prev])
    })
    return () => sub.unsubscribe()
  }, [user])

  useEffect(() => {
    function handle(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function markRead(id) {
    await notificationQueries.markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAll() {
    if (!user) return
    await notificationQueries.markAllRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const nav = [
    { label: 'Home',      path: '/' },
    { label: 'Find Donors', path: '/donors' },
    { label: 'Emergency', path: '/emergency' },
    { label: 'Ambulance', path: '/ambulance' },
  ]

  return (
    <nav style={{ background: 'var(--teal-dark)', position: 'sticky', top: 0, zIndex: 100, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, boxShadow: '0 2px 12px rgba(62,90,91,.18)' }}>
      {/* Logo */}
      <div onClick={() => navigate('/')} style={{ color: 'white', fontFamily: 'Sora, sans-serif', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-.5px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2z" fill="rgba(230,230,250,.9)"/>
          <path d="M12 8v8M8 12h8" stroke="#3d5a5b" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Rakta
        <span style={{ background: 'var(--lavender)', color: 'var(--teal-dark)', borderRadius: 6, padding: '2px 7px', fontSize: '.85rem', fontWeight: 600 }}>BD</span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }} className="hidden md:flex">
        {nav.map(({ label, path }) => (
          <span key={path} onClick={() => navigate(path)}
            style={{ color: location.pathname === path ? 'white' : 'rgba(255,255,255,.75)', textDecoration: 'none', fontSize: '.875rem', fontWeight: 500, cursor: 'pointer', transition: 'color .15s' }}>
            {label}
          </span>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
        {user && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(o => !o)}
              style={{ position: 'relative', background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#e74c3c', border: '1.5px solid var(--teal-dark)' }} />
              )}
            </button>

            {notifOpen && (
              <div style={{ position: 'absolute', top: 48, right: 0, width: 340, background: 'white', borderRadius: 14, boxShadow: '0 8px 32px rgba(62,90,91,.18)', zIndex: 200, overflow: 'hidden' }}>
                <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--fog)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--charcoal)' }}>Notifications</span>
                  <button onClick={markAll} style={{ fontSize: '.78rem', color: 'var(--teal)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0
                    ? <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--softgray)', fontSize: '.85rem' }}>No notifications yet</div>
                    : notifications.slice(0, 10).map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        style={{ padding: '.75rem 1.1rem', borderBottom: '1px solid var(--fog)', fontSize: '.82rem', cursor: 'pointer', background: !n.is_read ? '#f0f4ff' : 'white', borderLeft: !n.is_read ? '3px solid var(--teal)' : '3px solid transparent' }}>
                        <div style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ color: 'var(--midgray)', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '.73rem', color: 'var(--softgray)', marginTop: 3 }}>
                          {new Date(n.created_at).toLocaleString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate('/register-donor')}
          style={{ background: 'transparent', color: 'white', fontWeight: 500, fontSize: '.82rem', border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 10, padding: '7px 16px', cursor: 'pointer' }}>
          Become Donor
        </button>

        <button className="nav-cta"
          onClick={() => user ? navigate('/profile') : onAuthClick()}
          style={{ background: 'var(--lavender)', color: 'var(--teal-dark)', fontWeight: 600, fontSize: '.85rem', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>
          {user ? 'My Profile' : 'Sign In'}
        </button>
      </div>
    </nav>
  )
}