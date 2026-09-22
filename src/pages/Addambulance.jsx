import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ambulanceQueries } from '../lib/supabase'
import DistrictInput from '../components/DistrictInput'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

export default function AddAmbulance() {
  const toast = useToast()
  const navigate      = useNavigate()
  const location       = useLocation()
  const { user }      = useAuth()

  const editService = location.state?.editService ?? null
  const isEditMode  = Boolean(editService)

  const [form, setForm] = useState({ service_name: '', phone_number: '', service_type: '', district: '', address: '', available_24_7: true })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (editService) {
      setForm({
        service_name:   editService.service_name   ?? '',
        phone_number:   editService.phone_number    ?? '',
        service_type:   editService.service_type    ?? '',
        district:       editService.district         ?? '',
        address:        editService.address           ?? '',
        available_24_7: editService.available_24_7  ?? true,
      })
    }
  }, [editService])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    if (!user) return
    const req = ['service_name', 'phone_number', 'service_type', 'district']
    if (req.some(k => !form[k])) { toast('Please fill all required fields', 'danger'); return }
    setBusy(true)
    try {
      if (isEditMode) {
        await ambulanceQueries.update(editService.id, { ...form })
        toast('Service updated!', 'success')
      } else {
        await ambulanceQueries.create({ 
          
          
          ...form, user_id: user.id, is_active: true
          
         })
//       await ambulanceQueries.create({
//   ...form,
//   is_active: true
// })
        toast('Ambulance service added!', 'success')
      }
      navigate('/ambulance')
    } catch (e) {
  console.error(e)
  toast(e.message, 'danger')
} finally {
      setBusy(false)
    }
  }

  return (
    <div className="main-wrap" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div className="page-title">{isEditMode ? 'Edit Ambulance Service' : 'Add an Ambulance Service'}</div>
        <div className="page-sub">{isEditMode ? 'Update your service details below' : 'List your service — patients will find you in search results'}</div>
      </div>
      <div className="card">
        <div className="form-section-title">Service Information</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input className="form-input" type="text" value={form.service_name} onChange={set('service_name')} placeholder="e.g. Dhaka Ambulance Service" />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Number *</label>
            <input className="form-input" type="tel" value={form.phone_number} onChange={set('phone_number')} placeholder="+880 1×××××××××" />
          </div>
          <div className="form-group">
            <label className="form-label">Service Type *</label>
            <select className="form-input form-select" value={form.service_type} onChange={set('service_type')}>
              <option value="">Select type</option>
              <option value="Government">Government</option>
              <option value="Private">Private</option>
              <option value="NGO">NGO</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">District *</label>
            <DistrictInput value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} />
          </div>
          <div className="form-group full">
            <label className="form-label">Address</label>
            <input className="form-input" type="text" value={form.address} onChange={set('address')} placeholder="Full address" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 0', marginTop: '.5rem' }}>
          <div>
            <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--charcoal)' }}>Available 24/7</div>
            <div style={{ fontSize: '.78rem', color: 'var(--softgray)' }}>Toggle off if service has limited hours</div>
          </div>
          {/* <button className={`toggle${form.available_24_7 ? ' on' : ''}`}
            onClick={() => setForm(f => ({ ...f, available_24_7: !f.available_24_7 }))} /> */}
            <button
  type="button"
  className={`toggle${form.available_24_7 ? ' on' : ''}`}
  onClick={() =>
    setForm(f => ({
      ...f,
      available_24_7: !f.available_24_7
    }))
  }
/>
        </div>

        <button className="btn-submit" onClick={submit} disabled={busy}>
          {busy ? <span className="spinner" /> : (isEditMode ? 'Save Changes →' : 'Add Ambulance Service →')}
        </button>
      </div>
    </div>
  )
}