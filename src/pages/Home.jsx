import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { emergencyQueries, supabase } from '../lib/supabase'
import EmergencyCard from '../components/EmergencyCard'
import DistrictInput from '../components/DistrictInput'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const navigate             = useNavigate()
  // const { user, openAuthModal } = useAuth()
  const { user, donor, openAuthModal } = useAuth()

  function requireAuth(callback) {
    if (user) {
      callback()
    } else {
      openAuthModal()
    }
  }
  const [recent, setRecent]  = useState([])
  const [stats, setStats]    = useState({ donors: '—', fulfilled: '—', active: '—' })
  const [district, setDistrict] = useState('')
  const [blood, setBlood]    = useState('')

  useEffect(() => {
    emergencyQueries.getAll({ status: 'Open' })
      .then(d => setRecent(d.slice(0, 3)))
      .catch(() => {})

    Promise.all([
      supabase.from('donors').select('id', { count: 'exact', head: true }).eq('is_verified', true).eq('is_active', true),
      supabase.from('emergency_requests').select('id', { count: 'exact', head: true }).eq('status', 'Closed'),
      supabase.from('emergency_requests').select('id', { count: 'exact', head: true }).eq('status', 'Open'),
    ]).then(([d, f, a]) => setStats({
      donors:    (d.count ?? 0).toLocaleString(),
      fulfilled: (f.count ?? 0).toLocaleString(),
      active:    (a.count ?? 0).toLocaleString(),
    })).catch(() => {})
  }, [])

  function search() {
    navigate(`/donors?district=${encodeURIComponent(district)}&blood=${encodeURIComponent(blood)}`)
  }

  const quickActions = [
    { icon: <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2z"/>, label: 'Request Blood', action: () => requireAuth(() => navigate('/request-blood')) },
{
  icon: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  label: donor ? 'My Donor Profile' : 'Become Donor',
  action: () => requireAuth(() =>
    navigate(donor ? '/profile' : '/register-donor')
  )
},  { icon: <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h6l2 5v3h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>, label: 'Ambulance', action: () => navigate('/ambulance') },
    { icon: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.18 1.2 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.17 6.17l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/></>, label: 'Emergency Call', action: () => window.open('tel:999') },
    { icon: <><path d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2 12 2z"/></>, label: 'Emergency Board', action: () => navigate('/emergency') },
    { icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, label: 'My Profile', action: () => requireAuth(() => navigate('/profile')) },
  ]

  return (
    <div className="main-wrap">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#3d5a5b 0%,#4a7172 60%,#5e7d7e 100%)', borderRadius: 18, padding: '3rem 2.5rem', color: 'white', position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(230,230,250,.08)' }}/>
        <div style={{ position: 'absolute', right: 40, bottom: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(230,230,250,.05)' }}/>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(230,230,250,.15)', border: '1px solid rgba(230,230,250,.25)', borderRadius: 20, padding: '4px 12px', fontSize: '.8rem', fontWeight: 500, marginBottom: '1.2rem' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(230,230,250,.9)"><circle cx="12" cy="12" r="10"/></svg>
          Live donor matching · Bangladesh
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '.75rem', margin: '0 0 .75rem' }}>Every drop counts.<br/>Every life matters.</h1>
        <p style={{ color: 'rgba(255,255,255,.78)', fontSize: '.95rem', lineHeight: 1.6, maxWidth: 480, margin: '0 0 1.5rem' }}>
          RaktaBD connects verified blood donors with patients in real time. Find donors near you or post an emergency request — fast, trusted, free.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/donors')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Find a Donor
          </button>
          <button className="btn-outline" onClick={() => requireAuth(() => navigate('/request-blood'))}>
            Post Emergency Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { n: stats.donors,    l: 'Verified Donors' },
          { n: stats.fulfilled, l: 'Requests Fulfilled' },
          { n: '64',            l: 'Districts Covered' },
          { n: stats.active,    l: 'Active Requests' },
        ].map(s => (
          <div key={s.l} style={{ background: 'white', borderRadius: 12, padding: '1.1rem 1.25rem', textAlign: 'center', boxShadow: '0 1px 5px rgba(94,125,126,.08)' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--teal-dark)' }}>{s.n}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--softgray)', fontWeight: 500, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>Search Donors</div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--midgray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>District</div>
            <DistrictInput value={district} onChange={setDistrict} className="input-field" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--midgray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Blood Group</div>
            <select className="input-field form-select" value={blood} onChange={e => setBlood(e.target.value)}>
              <option value="">Any group</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <button className="btn-search" onClick={search} style={{ alignSelf: 'flex-end' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
        </div>
      </div>

      {/* Quick Actions + Recent Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>Quick Actions</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
            {quickActions.map(({ icon, label, action }) => (
              <div key={label} onClick={action} style={{ background: 'white', borderRadius: 12, padding: '1.25rem 1rem', textAlign: 'center', cursor: 'pointer', border: '1.5px solid transparent', transition: 'all .18s', boxShadow: '0 1px 4px rgba(94,125,126,.07)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal-light)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .7rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal-dark)" strokeWidth="2">{icon}</svg>
                </div>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--charcoal)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>Recent Emergency Requests</div>
            <span onClick={() => navigate('/emergency')} style={{ fontSize: '.8rem', color: 'var(--teal)', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
          </div>
          {recent.length === 0
            ? <div style={{ color: 'var(--softgray)', fontSize: '.85rem', padding: '1rem' }}>No active requests right now.</div>
            : recent.map(r => <EmergencyCard key={r.id} request={r} compact />)
          }
        </div>
      </div>
    </div>
  )
}