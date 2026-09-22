import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { donationQueries } from '../lib/supabase'
import DonationModal from '../components/DonationModal.jsx'
import DonationHistory from '../components/DonationHistory.jsx'

// ── tiny helpers ─────────────────────────────────────────────────────────────
function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone ?? '—'
  return phone.slice(0, 5) + '*'.repeat(phone.length - 6) + phone.slice(-1)
}

function timeAgo(dt) {
  if (!dt) return '—'
  const diff = Date.now() - new Date(dt).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

// ── component ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, donor, signOut, loading } = useAuth()
  const showToast = useToast()
  const navigate  = useNavigate()

  const [stats, setStats]         = useState(null)   // { donation_count, last_donated_at, next_eligible_at }
  const [donations, setDonations] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [showDonationModal, setShowDonationModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/')
  }, [user, loading, navigate])

  const loadDonationData = useCallback(async () => {
    if (!donor) { setStatsLoading(false); return }
    setStatsLoading(true)
    try {
      const [statsData, historyData] = await Promise.all([
        donationQueries.getStats(donor.id),
        donationQueries.getByDonor(donor.id),
      ])
      setStats(statsData)
      setDonations(historyData)
    } catch (err) {
      showToast('Failed to load donation history: ' + err.message, 'danger')
    } finally {
      setStatsLoading(false)
    }
  }, [donor, showToast])

  useEffect(() => { loadDonationData() }, [loadDonationData])

  // Realtime refresh — requirement #14
  useEffect(() => {
    if (!donor) return
    const sub = donationQueries.subscribeToChanges(donor.id, () => loadDonationData())
    return () => { sub?.unsubscribe() }
  }, [donor, loadDonationData])

  const handleSignOut = async () => {
    await signOut()
    showToast('Signed out successfully', 'success')
    navigate('/')
  }

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--softgray)' }}>
      Loading…
    </div>
  )
  if (!user) return null

  const initials = donor
    ? donor.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  const donationCount  = stats?.donation_count ?? 0
  const lastDonatedAt  = stats?.last_donated_at ?? null
  const nextEligibleAt = stats?.next_eligible_at ?? null
  const isEligibleNow  = !nextEligibleAt || new Date(nextEligibleAt) <= new Date()

  // ── styles ──────────────────────────────────────────────────────────────────
  const s = {
    wrap:  { maxWidth: 820, margin: '0 auto', padding: '2rem 1.5rem 4rem' },
    card:  { background: 'white', borderRadius: 14, padding: '1.5rem',
              boxShadow: '0 1px 6px rgba(94,125,126,.08)',
              border: '1px solid rgba(94,125,126,.07)', marginBottom: '1rem' },
    tile:  { background: 'var(--pearl)', borderRadius: 10, padding: '.85rem 1rem' },
    tileLabel: { fontSize: '.75rem', color: 'var(--softgray)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 },
    tileValue: { fontSize: '.95rem', fontWeight: 600, color: 'var(--charcoal)' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
              marginBottom: '1.25rem' },
    btn:   (bg, color, border) => ({
      background: bg, color, border: border ?? 'none',
      borderRadius: 9, padding: '10px 20px',
      fontSize: '.875rem', fontWeight: 600,
      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
      transition: 'opacity .15s'
    }),
  }

  return (
    <div style={s.wrap}>

      {/* ── Profile header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--teal-dark), #4a7172)',
        borderRadius: 14, padding: '1.5rem', color: 'white',
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        marginBottom: '1.25rem', flexWrap: 'wrap'
      }}>
        {/* Avatar */}
        <div style={{
          width: 68, height: 68, borderRadius: 14, flexShrink: 0,
          background: 'rgba(230,230,250,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Sora', sans-serif", fontSize: '1.5rem', fontWeight: 700,
          border: '2px solid rgba(230,230,250,.3)'
        }}>
          {initials}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.2rem',
                        fontWeight: 700 }}>
            {donor?.full_name ?? user.email}
          </div>
          <div style={{ fontSize: '.85rem', opacity: .8, marginTop: 4 }}>
            {donor
              ? `${donor.blood_group} · ${donor.district} · Donor since ${new Date(donor.created_at).getFullYear()}`
              : user.email}
          </div>
          {donor && (
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem',
                          flexWrap: 'wrap' }}>
              {donor.is_verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#e8f0fe', color: '#1a49a0',
                                borderRadius: 6, padding: '2px 8px',
                                fontSize: '.75rem', fontWeight: 600 }}>
                  ✓ Verified
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: donor.is_active
                                ? 'rgba(46,125,94,.25)' : 'rgba(255,255,255,.12)',
                              color: donor.is_active ? '#a8ffcf' : 'rgba(255,255,255,.6)',
                              borderRadius: 6, padding: '2px 8px',
                              fontSize: '.75rem', fontWeight: 600 }}>
                {donor.is_active ? '● Active' : 'Inactive'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {donor && (
            <>
              <button style={s.btn('var(--lavender)', 'var(--teal-dark)')}
                onClick={() => setShowDonationModal(true)}>
                🩸 I Donated Blood
              </button>
              <button style={s.btn('rgba(230,230,250,.2)', 'white',
                                    '1.5px solid rgba(230,230,250,.35)')}
                onClick={() => navigate('/register-donor')}>
                Edit Profile
              </button>
            </>
          )}
          <button style={s.btn('rgba(192,57,43,.3)', '#ffd5d0',
                                '1.5px solid rgba(192,57,43,.4)')}
            onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── No donor profile CTA ── */}
      {!donor && (
        <div style={{
          ...s.card, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
          borderLeft: '4px solid var(--teal)'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--charcoal)',
                          marginBottom: 4, fontSize: '.95rem' }}>
              You are not registered as a donor yet
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--softgray)' }}>
              Register to appear in donor searches and help save lives across Bangladesh.
            </div>
          </div>
          <button style={s.btn('var(--teal-dark)', 'white')}
            onClick={() => navigate('/register-donor')}>
            Become a Donor →
          </button>
        </div>
      )}

      {/* ── Donor stats grid (now derived from donations table) ── */}
      {donor && (
        <>
          <div style={s.grid4}>
            {[
              { label: 'Blood Group',     value: donor.blood_group,
                style: { color: 'var(--teal-dark)', fontSize: '1.4rem',
                          fontFamily: "'Sora', sans-serif" } },
              { label: 'Total Donations', value: statsLoading ? '…' : `${donationCount} times` },
              { label: 'Last Donation',   value: statsLoading ? '…' : timeAgo(lastDonatedAt) },
              { label: 'Next Eligible',
                value: statsLoading
                  ? '…'
                  : isEligibleNow ? 'Eligible now' : formatDate(nextEligibleAt),
                style: { color: isEligibleNow ? 'var(--success)' : 'var(--teal)' } },
            ].map(({ label, value, style }) => (
              <div key={label} style={s.tile}>
                <div style={s.tileLabel}>{label}</div>
                <div style={{ ...s.tileValue, ...(style ?? {}) }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ── Donor details card ── */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700,
                              color: 'var(--charcoal)' }}>
                Donor Details
              </span>
              <button style={s.btn('var(--fog)', 'var(--midgray)')}
                onClick={() => navigate('/register-donor')}>
                Edit
              </button>
            </div>
            <div style={s.grid2}>
              {[
                { label: 'Phone',    value: maskPhone(donor.phone_number) },
                { label: 'Email',    value: user.email },
                { label: 'District', value: donor.district },
                { label: 'Division', value: donor.division || '—' },
                { label: 'Gender',   value: donor.gender   || '—' },
                { label: 'Status',
                  value: donor.is_active ? 'Active — available to donate' : 'Inactive' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '.75rem', color: 'var(--softgray)',
                                fontWeight: 600, textTransform: 'uppercase',
                                letterSpacing: '.04em', marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '.875rem', color: 'var(--charcoal)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Donation History ── */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700,
                              color: 'var(--charcoal)' }}>
                Donation History
              </span>
              <span style={{ fontSize: '.78rem', color: 'var(--softgray)' }}>
                {donationCount} record{donationCount !== 1 ? 's' : ''}
              </span>
            </div>
            {statsLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--softgray)', padding: '2rem' }}>
                Loading…
              </div>
            ) : (
              <DonationHistory donations={donations} />
            )}
          </div>
        </>
      )}

      {/* ── Account card ── */}
      <div style={s.card}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700,
                      color: 'var(--charcoal)', marginBottom: '1rem' }}>
          Account
        </div>
        <div style={s.grid2}>
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--softgray)',
                          fontWeight: 600, textTransform: 'uppercase',
                          letterSpacing: '.04em', marginBottom: 3 }}>
              Email
            </div>
            <div style={{ fontSize: '.875rem', color: 'var(--charcoal)' }}>
              {user.email}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--softgray)',
                          fontWeight: 600, textTransform: 'uppercase',
                          letterSpacing: '.04em', marginBottom: 3 }}>
              Member Since
            </div>
            <div style={{ fontSize: '.875rem', color: 'var(--charcoal)' }}>
              {new Date(user.created_at).toLocaleDateString('en-BD', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
        <button style={s.btn('var(--teal-dark)', 'white')}
          onClick={() => navigate('/request-blood')}>
          + Post Emergency Request
        </button>
        <button style={s.btn('white', 'var(--teal-dark)',
                              '1.5px solid var(--teal-light)')}
          onClick={() => navigate('/emergency')}>
          Emergency Board
        </button>
      </div>

      {/* ── Donation Modal ── */}
      {showDonationModal && donor && (
        <DonationModal
          donorId={donor.id}
          defaultBloodGroup={donor.blood_group}
          onClose={() => setShowDonationModal(false)}
          onSaved={loadDonationData}
        />
      )}

    </div>
  )
}