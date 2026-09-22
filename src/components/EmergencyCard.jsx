import { bloodBadgeClass, timeAgo } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { emergencyQueries } from '../lib/supabase'

export default function EmergencyCard({ request: r, onEdit, onRefresh, compact = false }) {
  const { user, openAuthModal } = useAuth()
  function requireAuth(callback) {
  if (user) {
    callback()
  } else {
    openAuthModal()
  }
}
  const isOwn    = user && r.user_id === user.id
  const isClosed = r.status === 'Closed'
  const border   = r.urgency_level === 'Critical' ? '#c0392b' : r.status === 'Open' ? '#2e7d5e' : 'var(--fog)'

  async function close() {
    await emergencyQueries.update(r.id, { status: 'Closed' })
    onRefresh?.()
  }
  async function del() {
    if (!confirm('Delete this request? This cannot be undone.')) return
    await emergencyQueries.delete(r.id)
    onRefresh?.()
  }

  if (compact) return (
    <div style={{ borderRadius: 12, padding: '1.1rem 1.25rem', border: `1.5px solid ${border}`, marginBottom: '.75rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center', background: r.urgency_level === 'Critical' ? '#fff8f7' : r.status === 'Open' ? '#f5fbf7' : 'var(--pearl)' }}>
      <div className={`bg-badge ${bloodBadgeClass(r.blood_group)}`} style={{ width: 38, height: 38, borderRadius: 9, fontSize: '.85rem' }}>{r.blood_group}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--charcoal)', marginBottom: 3 }}>{r.blood_group} needed — {r.hospital_name}</div>
        <div style={{ fontSize: '.8rem', color: 'var(--softgray)', display: 'flex', gap: '1rem' }}>
          <span>📍 {r.district}</span>
          <span>🩸 {r.units_required} unit{r.units_required > 1 ? 's' : ''}</span>
        </div>
      </div>
      <span className={`pill ${r.urgency_level === 'Critical' ? 'pill-critical' : 'pill-open'}`}>{r.urgency_level === 'Critical' ? '🔴 ' : ''}{r.urgency_level}</span>
    </div>
  )

  return (
    <div className="card" style={{ marginBottom: '.75rem', borderLeft: `4px solid ${border}`, opacity: isClosed ? .65 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className={`bg-badge ${bloodBadgeClass(r.blood_group)}`} style={{ width: 48, height: 48, borderRadius: 10, fontSize: '1rem' }}>{r.blood_group}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontFamily: 'Sora, sans-serif', fontSize: '.95rem' }}>{r.patient_name}</span>
              {r.urgency_level === 'Critical' && <span className="pill pill-critical">🔴 Critical</span>}
              <span className={`pill ${r.status === 'Open' ? 'pill-open' : 'pill-closed'}`}>{r.status}</span>
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--charcoal)', marginBottom: 6, fontWeight: 500 }}>{r.hospital_name}</div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.8rem', color: 'var(--midgray)' }}>📍 {r.district}</span>
              <span style={{ fontSize: '.8rem', color: 'var(--midgray)' }}>🩸 {r.units_required} unit{r.units_required > 1 ? 's' : ''}</span>
              <span style={{ fontSize: '.8rem', color: 'var(--softgray)' }}>⏱ {timeAgo(r.created_at)}</span>
            </div>
            {r.description && <div style={{ marginTop: 8, fontSize: '.8rem', color: 'var(--softgray)' }}>{r.description}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end' }}>
          {!isClosed
            ? <a href={`tel:${r.contact_number}`} className="btn-sm btn-sm-primary" style={{ padding: '9px 18px', fontSize: '.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>📞 Call Now</a>
            : <button className="btn-sm btn-sm-ghost" disabled>Closed</button>
          }
          {isOwn && (
            <>
              <button className="btn-sm btn-sm-ghost" onClick={() => onEdit?.(r)}>Edit</button>
              {r.status === 'Open' && <button className="btn-sm btn-sm-ghost" onClick={close}>Close</button>}
              <button className="btn-sm btn-sm-danger" onClick={del}>Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}