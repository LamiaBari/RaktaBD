// ── Blood group badge CSS class ──────────────────────────
export function bloodBadgeClass(bg) {
  const map = {
    'O+': 'bg-O_pos', 'O-': 'bg-O_neg',
    'A+': 'bg-A_pos', 'A-': 'bg-A_neg',
    'B+': 'bg-B_pos', 'B-': 'bg-B_neg',
    'AB+': 'bg-AB_pos', 'AB-': 'bg-AB_neg',
  }
  return map[bg] || 'bg-O_pos'
}

// ── Mask phone number  e.g. 01712*****8 ─────────────────
export function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone || '—'
  return phone.slice(0, 5) + '*'.repeat(Math.max(phone.length - 6, 3)) + phone.slice(-1)
}

// ── Relative time (2h ago / 3d ago) ─────────────────────
export function timeAgo(dt) {
  if (!dt) return '—'
  const diff = Date.now() - new Date(dt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dt).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })
}

// ── Calculate eligibility (120-day rule) ─────────────────
export function calcEligibility(lastDonatedAt) {
  if (!lastDonatedAt) return { eligible: true, nextDate: null, daysLeft: 0, daysSince: null }
  const last = new Date(lastDonatedAt)
  const next = new Date(last.getTime() + 120 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24))
  const daysLeft = Math.max(0, Math.ceil((next - now) / (1000 * 60 * 60 * 24)))
  return { eligible: now >= next, nextDate: next, daysLeft, daysSince }
}

// ── Donation badges ──────────────────────────────────────
export function getDonationBadges(count) {
  const badges = []
  if (count >= 1)  badges.push({ label: '🌱 First Time Donor', cls: 'badge-first' })
  if (count >= 5)  badges.push({ label: '❤️ Regular Donor',    cls: 'badge-regular' })
  if (count >= 10) badges.push({ label: '🏆 Hero Donor',       cls: 'badge-hero' })
  if (count >= 20) badges.push({ label: '⭐ Lifesaver',         cls: 'badge-lifesaver' })
  return badges
}

// ── Donor initials ────────────────────────────────────────
export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── All 64 Bangladesh districts ──────────────────────────
export const BD_DISTRICTS = [
  'Bagerhat','Bandarban','Barguna','Barishal','Bhola','Bogura','Brahmanbaria',
  'Chandpur','Chapainawabganj','Chattogram','Chuadanga','Cox\'s Bazar','Cumilla',
  'Dhaka','Dinajpur','Faridpur','Feni','Gaibandha','Gazipur','Gopalganj',
  'Habiganj','Jamalpur','Jashore','Jhalokathi','Jhenaidah','Joypurhat',
  'Khagrachhari','Khulna','Kishoreganj','Kurigram','Kushtia','Lakshmipur',
  'Lalmonirhat','Madaripur','Magura','Manikganj','Meherpur','Moulvibazar',
  'Munshiganj','Mymensingh','Naogaon','Narail','Narayanganj','Narsingdi',
  'Natore','Netrokona','Nilphamari','Noakhali','Pabna','Panchagarh',
  'Patuakhali','Pirojpur','Rajbari','Rajshahi','Rangamati','Rangpur',
  'Satkhira','Shariatpur','Sherpur','Sirajganj','Sunamganj','Sylhet',
  'Tangail','Thakurgaon',
]