import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { supabase } from '../lib/supabase'
import DistrictInput from '../components/DistrictInput.jsx'

export default function RegisterDonor() {
  const { user, donor, refreshDonor } = useAuth()
  const showToast = useToast()
  const navigate  = useNavigate()

  const [form, setForm] = useState({
    full_name:       '',
    phone_number:    '',
    blood_group:     '',
    district:        '',
    division:        '',
    gender:          '',
    last_donated_at: '',
    is_active:       true,
  })
  const [saving, setSaving] = useState(false)

  // Pre-fill if donor profile already exists
  useEffect(() => {
    if (!user) { navigate('/'); return }
    if (donor) {
      setForm({
        full_name:       donor.full_name       ?? '',
        phone_number:    donor.phone_number    ?? '',
        blood_group:     donor.blood_group     ?? '',
        district:        donor.district        ?? '',
        division:        donor.division        ?? '',
        gender:          donor.gender          ?? '',
        last_donated_at: donor.last_donated_at
                           ? donor.last_donated_at.slice(0, 10)
                           : '',
        is_active:       donor.is_active       ?? true,
      })
    }
  }, [user, donor, navigate])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone_number || !form.blood_group || !form.district) {
      showToast('Please fill all required fields', 'danger')
      return
    }

    setSaving(true)
    const payload = {
      user_id:         user.id,
      full_name:       form.full_name.trim(),
      phone_number:    form.phone_number.trim(),
      blood_group:     form.blood_group,
      district:        form.district.trim(),
      division:        form.division.trim(),
      gender:          form.gender,
      last_donated_at: form.last_donated_at || null,
      is_active:       form.is_active,
    }

    // upsert on user_id — creates or updates, never duplicates
    const { error } = await supabase
      .from('donors')
      .upsert(payload, { onConflict: 'user_id' })

    setSaving(false)

    if (error) {
      showToast('Failed to save: ' + error.message, 'danger')
      return
    }

    await refreshDonor(user.id)
    showToast(donor ? 'Profile updated!' : 'Registered as donor!', 'success')
    navigate('/profile')
  }

  // ── styles ────────────────────────────────────────────────────────────────
  const s = {
    wrap:   { maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem 4rem' },
    card:   { background: 'white', borderRadius: 14, padding: '1.75rem',
               boxShadow: '0 1px 6px rgba(94,125,126,.08)',
               border: '1px solid rgba(94,125,126,.07)' },
    grid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    group:  { display: 'flex', flexDirection: 'column', gap: 5 },
    label:  { fontSize: '.8rem', fontWeight: 600, color: 'var(--midgray)',
               textTransform: 'uppercase', letterSpacing: '.04em' },
    input:  { border: '1.5px solid var(--fog)', borderRadius: 9,
               padding: '10px 14px', fontSize: '.875rem',
               fontFamily: "'Inter', sans-serif", color: 'var(--charcoal)',
               background: 'white', outline: 'none' },
    select: { appearance: 'none',
               backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a6b6c' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
               backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
               paddingRight: 32 },
    sectionTitle: {
      fontSize: '.8rem', fontWeight: 700, color: 'var(--teal-dark)',
      textTransform: 'uppercase', letterSpacing: '.06em',
      margin: '1.25rem 0 .75rem',
      paddingBottom: '.5rem', borderBottom: '1px solid var(--fog)'
    },
    submit: { width: '100%', marginTop: '1.25rem',
               background: saving ? 'var(--teal-light)' : 'var(--teal-dark)',
               color: 'white', fontWeight: 600, fontSize: '.9rem',
               border: 'none', borderRadius: 10, padding: '13px 28px',
               cursor: saving ? 'not-allowed' : 'pointer',
               fontFamily: "'Inter', sans-serif" },
    toggle: { width: 44, height: 24, borderRadius: 12,
               background: form.is_active ? 'var(--teal)' : 'var(--fog)',
               border: 'none', cursor: 'pointer', position: 'relative',
               transition: 'background .2s', flexShrink: 0 },
  }

  const inputStyle = { ...s.input }
  const selectStyle = { ...s.input, ...s.select }

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.4rem',
                     fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4 }}>
          {donor ? 'Edit Donor Profile' : 'Become a Verified Donor'}
        </h1>
        <p style={{ fontSize: '.875rem', color: 'var(--softgray)' }}>
          {donor
            ? 'Update your details below — changes take effect immediately.'
            : 'Your registration will be visible to patients in your district.'}
        </p>
      </div>

      {/* Info strip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem',
                    padding: '.9rem 1.1rem', borderRadius: 10, marginBottom: '1.5rem',
                    background: 'var(--lavender)', border: '1px solid var(--lavender-dark)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="#5E7D7E" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ fontSize: '.85rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>
          <strong style={{ display: 'block', marginBottom: 2 }}>Your data is secure</strong>
          Phone numbers are partially hidden by default. Only patients with an active
          emergency request can reveal them.
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={s.card}>

          {/* Personal */}
          <div style={s.sectionTitle}>Personal Information</div>
          <div style={s.grid}>
            <div style={s.group}>
              <label style={s.label}>Full Name *</label>
              <input style={inputStyle} value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="As per NID / Birth Certificate" />
            </div>
            <div style={s.group}>
              <label style={s.label}>Gender</label>
              <select style={selectStyle} value={form.gender}
                onChange={e => set('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Contact */}
          <div style={s.sectionTitle}>Contact Details</div>
          <div style={s.grid}>
            <div style={s.group}>
              <label style={s.label}>Phone Number *</label>
              <input style={inputStyle} type="tel" value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)}
                placeholder="+880 1×××××××××" />
            </div>
            <div style={s.group}>
              <label style={s.label}>Division</label>
              <select style={selectStyle} value={form.division}
                onChange={e => set('division', e.target.value)}>
                <option value="">Select division</option>
                {['Dhaka','Chittagong','Rajshahi','Khulna',
                  'Barisal','Sylhet','Mymensingh','Rangpur'].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div style={{ ...s.group, gridColumn: 'span 2' }}>
              <label style={s.label}>District *</label>
              <DistrictInput
                value={form.district}
                onChange={val => set('district', val)}
                inputStyle={inputStyle}
              />
            </div>
          </div>

          {/* Medical */}
          <div style={s.sectionTitle}>Medical Information</div>
          <div style={s.grid}>
            <div style={s.group}>
              <label style={s.label}>Blood Group *</label>
              <select style={selectStyle} value={form.blood_group}
                onChange={e => set('blood_group', e.target.value)}>
                <option value="">Select blood group</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div style={s.group}>
              <label style={s.label}>Last Donation Date</label>
              <input style={inputStyle} type="date" value={form.last_donated_at}
                onChange={e => set('last_donated_at', e.target.value)} />
              <span style={{ fontSize: '.76rem', color: 'var(--softgray)', marginTop: 2 }}>
                Leave blank if never donated
              </span>
            </div>
          </div>

          {/* Availability */}
          <div style={s.sectionTitle}>Availability</div>
          <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', padding: '.75rem 0' }}>
            <div>
              <div style={{ fontSize: '.875rem', fontWeight: 600,
                            color: 'var(--charcoal)' }}>
                Mark me as available now
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--softgray)', marginTop: 2 }}>
                You can change this any time from your profile
              </div>
            </div>
            <button type="button" style={s.toggle}
              onClick={() => set('is_active', !form.is_active)}>
              <span style={{
                position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                background: 'white', top: 3,
                left: form.is_active ? 23 : 3,
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,.15)'
              }} />
            </button>
          </div>

          {/* Consent note */}
          <div style={{ marginTop: '1rem', padding: '.9rem 1rem',
                        background: 'var(--lavender)', borderRadius: 10,
                        fontSize: '.82rem', color: 'var(--teal-dark)', lineHeight: 1.5 }}>
            By clicking Register, you confirm your details are accurate and
            consent to be contacted by patients in need.
          </div>

          <button type="submit" style={s.submit} disabled={saving}>
            {saving ? 'Saving…' : donor ? 'Save Changes →' : 'Register as Donor →'}
          </button>
        </div>
      </form>
    </div>
  )
}