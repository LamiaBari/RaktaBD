import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ambulanceQueries } from '../lib/supabase'
import { maskPhone } from '../lib/utils'
import DistrictInput from '../components/DistrictInput'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

const FILTERS = ['All', 'Government', 'Private', 'NGO', '24/7 Available']

export default function Ambulance() {
  const navigate           = useNavigate()
  const { user, openAuthModal } = useAuth()
  const showToast = useToast()
function requireAuth(callback) {
  if (user) {callback() } 
  else {openAuthModal() }}
  const [services, setServices] = useState([])
  const [filter, setFilter]     = useState('All')
  const [district, setDistrict] = useState('')
  const [type, setType]         = useState('')
  const [loading, setLoading]   = useState(true)
  const subRef                  = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const data = await ambulanceQueries.getAll()
      setServices(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    subRef.current = ambulanceQueries.subscribeToChanges(load)
    return () => subRef.current?.unsubscribe()
  }, [])

  async function search() {
    setLoading(true)
    try {
      const data = await ambulanceQueries.getAll({
        district: district || undefined,
        service_type: type || undefined,
        available_247: filter === '24/7 Available' || undefined,
      })
      setServices(data)
    } finally {
      setLoading(false)
    }
  }

async function del(id) {
  if (!confirm('Remove this ambulance service?')) return

  try {
    await ambulanceQueries.delete(id)
    showToast('Removed', 'success')
    load()
  } catch (e) {
    showToast(e.message, 'danger')
  }
}

function edit(service) {
  navigate('/add-ambulance', { state: { editService: service } })
}

  const filtered = services.filter(a => {
    if (filter === '24/7 Available') return a.available_24_7
    if (filter !== 'All')            return a.service_type === filter
    return true
  })

  const typeBadge = { Government: 'pill-verified', Private: 'pill-inactive', NGO: 'pill-active' }

  return (
    <div className="main-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <div className="page-title">Ambulance Services</div>
          <div className="page-sub">Verified ambulances near you — updated in real time</div>
        </div>
        <button className="btn-primary" style={{ background: 'var(--teal-dark)', color: 'white' }}
          onClick={() => requireAuth(() => navigate('/add-ambulance'))}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Service
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--midgray)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>District</div>
            <DistrictInput value={district} onChange={setDistrict} className="input-field" />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--midgray)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Type</div>
            <select className="input-field form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All types</option>
              <option value="Government">Government</option>
              <option value="Private">Private</option>
              <option value="NGO">NGO</option>
            </select>
          </div>
          <button className="btn-search" onClick={search} style={{ alignSelf: 'flex-end' }}>Search</button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="card-sm" style={{ marginBottom: '1.25rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--softgray)' }}>Loading...</div>
        : filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--softgray)' }}>No ambulance services found.</div>
          : filtered.map(a => (
            <div key={a.id} className="amb-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 42, height: 42, background: 'var(--lavender)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal-dark)" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h6l2 5v3h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {a.service_name}
                    <span className={`pill ${typeBadge[a.service_type] || 'pill-inactive'}`} style={{ fontSize: '.72rem' }}>{a.service_type}</span>
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--softgray)', marginTop: 2 }}>
                    {a.district}{a.address ? ` · ${a.address}` : ''} ·{' '}
                    {a.available_24_7
                      ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>24/7 Available</span>
                      : 'Scheduled hours'
                    }
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--softgray)', marginTop: 2 }}>📞 {(a.phone_number)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <a href={`tel:${a.phone_number}`} className="btn-sm btn-sm-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Call</a>
                {user && a.user_id === user.id && (
                  <>
                    <button className="btn-sm btn-sm-ghost" onClick={() => edit(a)}>Edit</button>
                    <button className="btn-sm btn-sm-danger" onClick={() => del(a.id)}>Remove</button>
                  </>
                )}
              </div>
            </div>
          ))
      }
    </div>
  )
}