import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { donorQueries, supabase } from '../lib/supabase'
import { bloodBadgeClass, maskPhone, timeAgo, initials } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import DistrictInput from '../components/DistrictInput'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

// export default function Donors({ toast }) {
import { useToast } from '../hooks/useToast'
export default function Donors() {
const toast = useToast()
  const [params]            = useSearchParams()
  const { user }            = useAuth()
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [district, setDistrict] = useState(params.get('district') || '')
  const [blood, setBlood]   = useState(params.get('blood') || '')
  const [activeOnly, setActiveOnly] = useState(true)
  const [revealed, setRevealed]     = useState({}) // donorId -> true

  useEffect(() => {
    if (district || blood) search()
  }, [])

  // async function search() {
  //   setLoading(true)
  //   try {
  //     const data = await donorQueries.search({ district: district || undefined, blood_group: blood || undefined, active_only: activeOnly })
  //     setDonors(data)
  //   } catch (e) {
  //     toast(e.message, 'danger')
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  async function search() {
  setLoading(true)

  try {
    const data = await donorQueries.search({
      district: district || undefined,
      blood_group: blood || undefined,
      active_only: activeOnly
    })

    console.log('DONORS RETURNED:', data)

    setDonors(data)
  } catch (e) {
    console.error(e)
    toast(e.message, 'danger')
  } finally {
    setLoading(false)
  }
}

  async function revealContact(donorRecord) {
    if (!user) { toast('Please sign in first', 'warn'); return }
    const hasReq = await donorQueries.checkActiveRequest(user.id)
    if (!hasReq) {
      toast('You must have an active emergency blood request before revealing donor contact information.', 'warn', 7000)
      return
    }
    // Get user's active request id
    const { data: req } = await supabase
      .from('emergency_requests').select('id').eq('user_id', user.id).eq('status', 'Open').limit(1).single()
    if (req) {
      await donorQueries.logReveal({ donor_id: donorRecord.id, viewer_id: user.id, request_id: req.id })
      // Notify the donor
      await supabase.from('notifications').insert({
        user_id: donorRecord.user_id,
        title: 'Contact Revealed',
        message: 'Someone with an active emergency request viewed your phone number.',
        is_read: false,
      })
    }
    setRevealed(prev => ({ ...prev, [donorRecord.id]: true }))
    toast('Phone number revealed', 'success')
  }

  return (
    <div className="main-wrap">
      <div className="page-header">
        <div className="page-title">Donor Search Results</div>
        <div className="page-sub">Verified, active donors — patients contact donors directly</div>
      </div>

      {/* Search bar */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--midgray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>District</div>
            <DistrictInput value={district} onChange={setDistrict} className="input-field" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--midgray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Blood Group</div>
            <select className="input-field form-select" value={blood} onChange={e => setBlood(e.target.value)}>
              <option value="">Any group</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--midgray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Availability</div>
            <select className="input-field form-select" value={activeOnly ? 'active' : 'all'} onChange={e => setActiveOnly(e.target.value === 'active')}>
              <option value="active">Active only</option>
              <option value="all">All donors</option>
            </select>
          </div>
          <button className="btn-search" onClick={search} style={{ alignSelf: 'flex-end' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
        </div>
      </div>

      <div className="alert-strip info" style={{ marginBottom: '1.25rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E7D7E" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{ fontSize: '.85rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>
          <strong style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Privacy notice</strong>
          Phone numbers are partially hidden. To reveal a full number, you must have an active emergency blood request. Every reveal is logged.
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>
            {loading ? 'Searching...' : donors.length > 0 ? `${donors.length} donor${donors.length !== 1 ? 's' : ''} found` : 'Use search above to find donors'}
          </div>
          {donors.length > 0 && <span className="pill pill-active" style={{ fontSize: '.75rem' }}>● Live</span>}
        </div>

        {loading
          ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--softgray)' }}>Loading...</div>
          : donors.length === 0
            ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--softgray)' }}>No donors found. Try a different district or blood group.</div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--fog)' }}>
                      {['Donor','Blood','District','Status','Donations','Phone',''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '.78rem', fontWeight: 600, color: 'var(--softgray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--fog)', opacity: d.is_active ? 1 : .6 }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--teal-dark)', fontSize: '.8rem', flexShrink: 0 }}>{initials(d.full_name)}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{d.full_name}</div>
                              {d.is_verified
                                ? <div className="verify-badge" style={{ marginTop: 2 }}>✓ Verified</div>
                                : <div style={{ fontSize: '.75rem', color: 'var(--softgray)', marginTop: 2 }}>Pending verification</div>
                              }
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}><div className={`bg-badge ${bloodBadgeClass(d.blood_group)}`}>{d.blood_group}</div></td>
                        <td style={{ padding: '12px 14px' }}>{d.district}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`pill ${d.is_active ? 'pill-active' : 'pill-inactive'}`}>{d.is_active ? '● Active' : 'Inactive'}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--teal-dark)' }}>{d.donation_count || 0}</span>
                          <span style={{ fontSize: '.78rem', color: 'var(--softgray)' }}> times</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '.85rem' }}>
                          {revealed[d.id]
                            ? <span style={{ color: 'var(--charcoal)', fontWeight: 600 }}>{d.phone_number}</span>
                            : <span style={{ color: 'var(--midgray)' }}>{maskPhone(d.phone_number)}</span>
                          }
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {d.is_active
                            ? revealed[d.id]
                              ? <a href={`tel:${d.phone_number}`} className="btn-sm btn-sm-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Call</a>
                              : <button style={{ background: 'var(--lavender)', color: 'var(--teal-dark)', border: '1px solid var(--lavender-dark)', borderRadius: 7, padding: '5px 11px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => revealContact(d)}>Reveal</button>
                            : <button className="btn-sm btn-sm-ghost" disabled>Unavailable</button>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>
    </div>
  )
}