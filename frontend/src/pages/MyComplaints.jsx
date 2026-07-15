import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiError } from '../api/client'
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges'
import { fmtDate, labelize } from '../lib/constants'
import { PlusCircle, Inbox, ChevronRight } from 'lucide-react'

export default function MyComplaints() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/complaints/mine')
      .then((res) => setItems(res.data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Complaints</h1>
          <p className="text-sm text-text-secondary">Track the status and history of every issue you raise.</p>
        </div>
        <Link to="/complaints/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> Raise</Link>
      </div>

      {loading && <p className="text-text-secondary">Loading…</p>}
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center text-text-secondary">
          <Inbox className="mb-3 h-10 w-10 text-text-muted" />
          <p className="font-medium">No complaints yet</p>
          <p className="text-sm">Raise your first one to get started.</p>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((c) => (
          <Link key={c.id} to={`/complaints/${c.id}`} className="card card-hover flex items-center gap-4 !p-4">
            {c.photoUrl
              ? <img src={c.photoUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
              : <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary/5 text-lg font-bold text-primary">#{c.id}</div>}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-text-primary">{labelize(c.category)}</span>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {c.overdue && <OverdueBadge />}
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-text-secondary">{c.description}</p>
              <p className="mt-1 text-xs text-text-muted">Raised {fmtDate(c.createdAt)}</p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-text-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
