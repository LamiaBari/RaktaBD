import { useToast } from '../hooks/useToast'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { emergencyQueries, supabase } from '../lib/supabase'
import DistrictInput from '../components/DistrictInput'
import { useAuth } from '../hooks/useAuth'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export default function RequestBlood() {
  const toast = useToast()
  const navigate         = useNavigate()
  const location         = useLocation()
  const { user, donor }  = useAuth()
  const editData         = location.state?.edit || null

  const blank = { blood_group: '', patient_name: '', hospital_name: '', district: '', address: '', contact_number: '', units_required: 1, urgency_level: 'Critical', description: '' }
  const [form, setForm] = useState(blank)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        blood_group:    editData.blood_group,
        patient_name:   editData.patient_name,
        hospital_name:  editData.hospital_name,
        district:       editData.district,
        address:        editData.address || '',
        contact_number: editData.contact_number,
        units_required: editData.units_required,
        urgency_level:  editData.urgency_level,
        description:    editData.description || '',
      })
    }
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    if (!user) return
    const required = ['blood_group', 'patient_name', 'hospital_name', 'district', 'contact_number']
    if (required.some(k => !form[k])) { toast('Please fill all required fields', 'danger'); return }
    setBusy(true)
    try {
      if (editData) {
        await emergencyQueries.update(editData.id, form)
        toast('Request updated!', 'success')
      } else {
        await emergencyQueries.create({ ...form, user_id: user.id, status: 'Open' })
        // Notify matching donors
        notifyDonors(form.blood_group, form.district, form.hospital_name)
        toast('Request posted to Emergency Board!', 'success')
      }
      navigate('/emergency')
    } catch (e) {
      toast(e.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  async function notifyDonors(bloodGroup, district, hospital) {
    try {
      const { data: prefs } = await supabase
        .from('user_preferences').select('user_id').eq('receive_emergency_notifications', true)
      if (!prefs?.length) return
      const uids = prefs.map(p => p.user_id)
      const { data: donors } = await supabase
        .from('donors').select('user_id').eq('blood_group', bloodGroup).eq('district', district).eq('is_active', true).in('user_id', uids)
      if (!donors?.length) return
      await supabase.from('notifications').insert(
        donors.map(d => ({ user_id: d.user_id, title: `🩸 Blood Needed: ${bloodGroup}`, message: `Emergency ${bloodGroup} request at ${hospital}, ${district}. Please respond if you are able to donate.`, is_read: false }))
      )
    } catch (_) {}
  }

  const isEdit = !!editData

  return (
    <div className="main-wrap" style={{ maxWidth: 780 }}>
      <div className="page-header">
        <div className="page-title">{isEdit ? 'Edit Blood Request' : 'Post a Blood Request'}</div>
        <div className="page-sub">Donors near you will see this on the Emergency Board</div>
      </div>

      <div className="alert-strip warn" style={{ marginBottom: '1.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a6000" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{ fontSize: '.85rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>
          <strong style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Fill all required fields carefully</strong>
          Accurate information helps us match the right donors as fast as possible.
        </div>
      </div>

      <div className="card">
        <div className="form-section-title">Contact Information</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Contact Person Name *</label>
            <input className="form-input" type="text" value={form.patient_name} onChange={set('patient_name')} placeholder="Who donors should call" />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone *</label>
            <input className="form-input" type="tel" value={form.contact_number} onChange={set('contact_number')} placeholder="+880 1×××××××××" />
          </div>
        </div>

        <div className="form-section-title">Blood Requirement</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Blood Group *</label>
            <select className="form-input form-select" value={form.blood_group} onChange={set('blood_group')}>
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Units Required *</label>
            <input className="form-input" type="number" value={form.units_required} onChange={set('units_required')} min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Urgency Level *</label>
            <select className="form-input form-select" value={form.urgency_level} onChange={set('urgency_level')}>
              <option value="Critical">Critical — within 2 hours</option>
              <option value="Normal">Normal — today or tomorrow</option>
            </select>
          </div>
        </div>

        <div className="form-section-title">Location</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Hospital / Clinic *</label>
            <input className="form-input" type="text" value={form.hospital_name} onChange={set('hospital_name')} placeholder="Full hospital name" />
          </div>
          <div className="form-group">
            <label className="form-label">District *</label>
            <DistrictInput value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} />
          </div>
          <div className="form-group full">
            <label className="form-label">Local Address</label>
            <input className="form-input" type="text" value={form.address} onChange={set('address')} placeholder="Ward, floor, room number if known" />
          </div>
        </div>

        <div className="form-section-title">Additional Details</div>
        <div className="form-grid">
          <div className="form-group full">
            <label className="form-label">Case Summary (Optional)</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={set('description')} placeholder="Brief description of the patient's condition" style={{ resize: 'vertical' }} />
          </div>
        </div>

        <button className="btn-submit" onClick={submit} disabled={busy}>
          {busy ? <span className="spinner" /> : isEdit ? 'Update Request →' : 'Post to Emergency Board →'}
        </button>
      </div>
    </div>
  )
}