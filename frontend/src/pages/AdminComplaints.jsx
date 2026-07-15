import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiError } from '../api/client'
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges'
import { fmtDate, labelize, CATEGORIES, STATUSES } from '../lib/constants'
import { Filter, ChevronRight } from 'lucide-react'

export default function AdminComplaints() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ category: '', status: '', from: '', to: '' })

  function load(f = filters) {
    setLoading(true)
    const params = {}
    Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v })
    api.get('/complaints', { params })
      .then((res) => setItems(res.data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => setFilters({ ...filters, [key]: e.target.value })

  function clearFilters() {
    const cleared = { category: '', status: '', from: '', to: '' }
    setFilters(cleared)
    load(cleared)
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-text-primary">All Complaints</h1>
      <p className="mb-6 text-sm text-text-secondary">Overdue items are pinned to the top.</p>

      <div className="card mb-4 !p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <select className="select-field" value={filters.category} onChange={update('category')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{labelize(c)}</option>)}
          </select>
          <select className="select-field" value={filters.status} onChange={update('status')}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </select>
          <input type="date" className="select-field" value={filters.from} onChange={update('from')} />
          <input type="date" className="select-field" value={filters.to} onChange={update('to')} />
          <div className="flex gap-2">
            <button className="btn-primary !px-4" onClick={() => load()}>Apply</button>
            <button className="btn-ghost" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </div>

      {loading && <p className="text-text-secondary">Loading…</p>}
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      {!loading && items.length === 0 && (
        <div className="card py-12 text-center text-text-secondary">No complaints match these filters.</div>
      )}

      <div className="grid gap-3">
        {items.map((c) => (
          <Link key={c.id} to={`/complaints/${c.id}`}
            className={`card card-hover flex items-center gap-4 !p-4 ${c.overdue ? 'border-l-4 border-l-danger-dark' : ''}`}>
            {c.photoUrl
              ? <img src={c.photoUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
              : <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary/5 text-sm font-bold text-primary">#{c.id}</div>}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-text-primary">{labelize(c.category)}</span>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {c.overdue && <OverdueBadge />}
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-text-secondary">{c.description}</p>
              <p className="mt-1 text-xs text-text-muted">{c.residentName}{c.flatNumber ? ` · ${c.flatNumber}` : ''} · {fmtDate(c.createdAt)}</p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-text-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
