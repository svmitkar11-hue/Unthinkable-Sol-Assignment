export const CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'CLEANLINESS',
  'SECURITY',
  'ELEVATOR',
  'PARKING',
  'CARPENTRY',
  'PEST_CONTROL',
  'OTHER',
]

export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED']
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function labelize(s) {
  return String(s || '').replace(/_/g, ' ')
}
