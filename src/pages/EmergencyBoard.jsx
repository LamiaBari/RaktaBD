import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { emergencyQueries } from '../lib/supabase'
import EmergencyCard from '../components/EmergencyCard'
import { useAuth } from '../hooks/useAuth'

const FILTERS = ['All', 'Critical', 'Open', 'My District']

export default function EmergencyBoard({ requireAuth, toast }) {
  const navigate          = useNavigate()
  const { user, donor, openAuthModal } = useAuth()
  function requireAuth(callback) {
  if (user) {
    callback()
  } else {
    openAuthModal()
  }
}
  const [requests, setRequests] = useState([])
  const [filter, setFilter]     = useState('All')
  const [blood, setBlood]       = useState('')
  const [loading, setLoading]   = useState(true)
  const subRef                  = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const data = await emergencyQueries.getAll()
      setRequests(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    subRef.current = emergencyQueries.subscribeToChanges(load)
    return () => subRef.current?.unsubscribe()
  }, [])

  function editRequest(r) {
    navigate('/request-blood', { state: { edit: r } })
  }

  const filtered = requests.filter(r => {
    if (filter === 'Critical')    return r.urgency_level === 'Critical'
    if (filter === 'Open')        return r.status === 'Open'
    if (filter === 'My District') return donor && r.district === donor.district
    return true
  }).filter(r => blood ? r.blood_group === blood : true)

  const criticalOpen = requests.filter(r => r.urgency_level === 'Critical' && r.status === 'Open').length

  return (
    <div className="main-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <div className="page-title">Emergency Board</div>
          <div className="page-sub">Active blood requests — updated in real time</div>
        </div>
        <button className="btn-primary" style={{ background: 'var(--teal-dark)', color: 'white' }}
          // onClick={() => requireAuth(() => navigate('/request-blood'))}
onClick={() => navigate('/request-blood')}>
  
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Request
        </button>
      </div>

      <div className="alert-strip danger" style={{ marginBottom: '1.25rem' }}>
        <div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style={{ fontSize: '.85rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>
          <strong style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
            {criticalOpen > 0 ? `${criticalOpen} Critical request${criticalOpen > 1 ? 's' : ''} need donors NOW` : 'All requests shown below'}
          </strong>
          If you are eligible, please respond immediately. Every minute counts.
        </div>
      </div>

      {/* Filter bar */}
      <div className="card-sm" style={{ marginBottom: '1.25rem', display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--midgray)' }}>Filter:</span>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <select className="input-field form-select" style={{ padding: '7px 30px 7px 10px', fontSize: '.8rem' }}
            value={blood} onChange={e => setBlood(e.target.value)}>
            <option value="">All blood groups</option>
            {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--softgray)' }}>Loading...</div>
        : filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--softgray)' }}>No requests match this filter.</div>
          : filtered.map(r => <EmergencyCard key={r.id} request={r} onEdit={editRequest} onRefresh={load} />)
      }
    </div>
  )
}