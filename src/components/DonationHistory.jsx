function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })
}

export default function DonationHistory({ donations }) {
  if (!donations.length) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--softgray)', padding: '2rem 1rem' }}>
        No donations recorded yet.
      </div>
    )
  }

  return (
    <div>
      {donations.map((d, i) => (
        <div
          key={d.id}
          style={{
            display: 'flex', gap: '1rem', alignItems: 'flex-start',
            padding: '1rem 0',
            borderBottom: i < donations.length - 1 ? '1px solid var(--fog)' : 'none'
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: 'var(--lavender)', color: 'var(--teal-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '.8rem', fontFamily: "'Sora', sans-serif"
          }}>
            {d.blood_group}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem' }}>
              {formatDate(d.donated_at)}
            </div>
            <div style={{ fontSize: '.82rem', color: 'var(--midgray)', marginTop: 2 }}>
              {d.recipient_name && <>Recipient: {d.recipient_name} · </>}
              Hospital: {d.hospital_name}
            </div>
            {d.notes && (
              <div style={{ fontSize: '.8rem', color: 'var(--softgray)', marginTop: 4 }}>
                {d.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}