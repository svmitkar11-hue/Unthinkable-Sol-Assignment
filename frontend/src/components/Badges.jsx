import { labelize } from '../lib/constants'

const STATUS_CLASS = {
  OPEN: 'badge-warning',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  RESOLVED: 'badge-success',
}

const PRIORITY_CLASS = {
  LOW: 'badge-muted',
  MEDIUM: 'bg-indigo-100 text-indigo-700',
  HIGH: 'badge-danger',
}

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || 'badge-muted'}`}>{labelize(status)}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={`badge ${PRIORITY_CLASS[priority] || 'badge-muted'}`}>{priority}</span>
}

export function OverdueBadge() {
  return <span className="badge bg-red-600 text-white">Overdue</span>
}
