import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Navbar() {
  const { user, signOut, openAuthModal } = useAuth()
  const navigate = useNavigate()

  const handleDonorClick = () => {
    if (user) navigate('/register-donor')
    else openAuthModal()
  }

  const handleProfileClick = () => {
    if (user) navigate('/profile')
    else openAuthModal()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={{
      background: 'var(--teal-dark)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 2rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '64px',
      boxShadow: '0 2px 12px rgba(62,90,91,.18)'
    }}>

      {/* ── Logo ── */}
      <Link to="/" style={{
        color: 'white', fontFamily: "'Sora', sans-serif",
        fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-.5px',
        display: 'flex', alignItems: 'center', gap: 8,
        textDecoration: 'none'
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2z"
            fill="rgba(255, 0, 0, 1)"
          />
          <path
            d="M12 8v8M8 12h8"
            stroke="#3d5a5b" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
        Rakta{' '}
        <span style={{
          background: 'var(--lavender)', color: 'var(--teal-dark)',
          borderRadius: 6, padding: '2px 7px',
          fontSize: '.85rem', fontWeight: 600
        }}>
          BD
        </span>
      </Link>

      {/* ── Nav links ── */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {[
          ['/',           'Home'],
          ['/donors',     'Find Donors'],
          ['/emergency',  'Emergency'],
          ['/ambulance',  'Ambulance'],
        ].map(([path, label]) => (
          <Link key={path} to={path} style={{
            color: 'rgba(255,255,255,.75)', textDecoration: 'none',
            fontSize: '.875rem', fontWeight: 500, transition: 'color .15s'
          }}
            onMouseEnter={e => e.target.style.color = 'white'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.75)'}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Right side ── */}
      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>

        {/* Become Donor — only when logged out or no donor profile yet */}
        {!user && (
          <button onClick={handleDonorClick} style={{
            background: 'transparent', color: 'white',
            border: '1.5px solid rgba(255,255,255,.4)',
            borderRadius: 8, padding: '7px 16px',
            fontSize: '.82rem', fontWeight: 500, cursor: 'pointer',
            transition: 'border-color .15s'
          }}>
            Become Donor
          </button>
        )}

        {/* Sign In → My Profile toggle */}
        {user ? (
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <button onClick={handleProfileClick} style={{
              background: 'var(--lavender)', color: 'var(--teal-dark)',
              fontWeight: 600, fontSize: '.85rem', border: 'none',
              borderRadius: 8, padding: '8px 18px', cursor: 'pointer'
            }}>
              My Profile
            </button>
            <button onClick={handleSignOut} style={{
              background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.8)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 8, padding: '8px 14px',
              fontSize: '.82rem', fontWeight: 500, cursor: 'pointer'
            }}>
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={openAuthModal} style={{
            background: 'var(--lavender)', color: 'var(--teal-dark)',
            fontWeight: 600, fontSize: '.85rem', border: 'none',
            borderRadius: 8, padding: '8px 18px', cursor: 'pointer'
          }}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  )
}