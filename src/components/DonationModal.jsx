import { useState } from 'react'
import { donationQueries } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function DonationModal({ donorId, defaultBloodGroup, onClose, onSaved }) {
  const showToast = useToast()
  const [form, setForm] = useState({
    recipient_name: '',
    hospital_name: '',
    blood_group: defaultBloodGroup || '',
    notes: '',
    donated_at: todayISO(),
  })
  const [busy, setBusy] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.hospital_name || !form.blood_group || !form.donated_at) {
      showToast('Please fill hospital, blood group, and date', 'danger')
      return
    }
    setBusy(true)
    try {
      await donationQueries.create({
        donor_id: donorId,
        donated_at: new Date(form.donated_at).toISOString(),
        recipient_name: form.recipient_name.trim() || null,
        hospital_name: form.hospital_name.trim(),
        blood_group: form.blood_group,
        notes: form.notes.trim() || null,
      })
      showToast('Donation recorded — thank you!', 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(44,62,63,.45)',
        zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 18, padding: '2rem',
          width: '100%', maxWidth: 460, margin: '1rem',
          boxShadow: '0 16px 48px rgba(44,62,63,.2)'
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: 'right', background: 'none', border: 'none',
            fontSize: '1.3rem', cursor: 'pointer', color: 'var(--softgray)',
            marginTop: -4
          }}
        >
          ×
        </button>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.2rem',
                      fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4 }}>
          I Donated Blood
        </div>
        <div style={{ fontSize: '.85rem', color: 'var(--softgray)', marginBottom: '1.5rem' }}>
          Record your donation — this updates your donation history and eligibility.
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">Donation Date *</label>
              <input className="form-input" type="date" value={form.donated_at}
                max={todayISO()} onChange={set('donated_at')} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group *</label>
              <select className="form-input form-select" value={form.blood_group}
                onChange={set('blood_group')}>
                <option value="">Select group</option>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hospital Name *</label>
              <input className="form-input" type="text" value={form.hospital_name}
                onChange={set('hospital_name')} placeholder="e.g. Dhaka Medical College" />
            </div>
            <div className="form-group full">
              <label className="form-label">Recipient Name</label>
              <input className="form-input" type="text" value={form.recipient_name}
                onChange={set('recipient_name')} placeholder="Optional" />
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} value={form.notes}
                onChange={set('notes')} placeholder="Optional" style={{ resize: 'vertical' }} />
            </div>
          </div>

          <button className="btn-submit" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : 'Save Donation →'}
          </button>
        </form>
      </div>
    </div>
  )
}