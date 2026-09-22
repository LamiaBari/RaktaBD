import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthModal({ onClose, toast }) {
  const { signIn, signUp, modalOpen, closeAuthModal } = useAuth()
  const [tab, setTab]     = useState('signin')
  const [err, setErr]     = useState('')
  const [busy, setBusy]   = useState(false)
  const [form, setForm]   = useState({ name: '', email: '', password: '' })
  if (!modalOpen) return null

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    setErr(''); setBusy(true)
    try {
      if (tab === 'signin') {
        await signIn(form.email, form.password)
        toast('Signed in!', 'success')
        closeAuthModal()
      } else {
        if (!form.name) { setErr('Full name is required.'); setBusy(false); return }
        await signUp(form.email, form.password, form.name)
        toast('Account created! Check your email to confirm.', 'success', 6000)
        closeAuthModal()
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,62,63,.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 420, boxShadow: '0 16px 48px rgba(44,62,63,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.25rem' }}>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--charcoal)' }}>Welcome to RaktaBD</div>
            <div style={{ fontSize: '.85rem', color: 'var(--softgray)', marginBottom: '1.5rem' }}>Sign in or create a free account</div>
          </div>
          <button onClick={closeAuthModal} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--softgray)', lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', background: 'var(--fog)', borderRadius: 10, padding: 4 }}>
          {['signin','signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr('') }}
              style={{ flex: 1, padding: 8, textAlign: 'center', fontSize: '.875rem', fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? 'var(--teal-dark)' : 'var(--midgray)',
                boxShadow: tab === t ? '0 1px 4px rgba(94,125,126,.12)' : 'none',
              }}>
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={form.name} onChange={set('name')} placeholder="Your full name" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
        </div>

        {err && <div style={{ marginTop: '.75rem', fontSize: '.82rem', color: 'var(--urgent)' }}>{err}</div>}

        <button className="btn-submit" onClick={submit} disabled={busy}>
          {busy ? <span className="spinner" /> : (tab === 'signin' ? 'Sign In' : 'Create Account')}
        </button>
      </div>
    </div>
  )
}