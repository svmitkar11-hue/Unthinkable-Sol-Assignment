import { useEffect, useState } from 'react'
import api, { apiError } from '../api/client'
import { labelize } from '../lib/constants'
import StatsCard from '../components/ui/StatsCard'
import { ListChecks, DoorOpen, Loader, AlertTriangle } from 'lucide-react'

function BreakdownCard({ title, data }) {
  const entries = Object.entries(data || {})
  const max = Math.max(1, ...entries.map(([, v]) => v))
  return (
    <div className="card">
      <h3 className="mb-4 font-semibold text-text-primary">{title}</h3>
      {entries.length === 0 && <p className="text-sm text-text-muted">No data</p>}
      <div className="space-y-3">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{labelize(k)}</span>
              <span className="font-semibold text-text-primary">{v}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setData(res.data)).catch((err) => setError(apiError(err)))
  }, [])

  if (error) return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
  if (!data) return <p className="text-text-secondary">Loading…</p>

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Dashboard</h1>
      <p className="mb-6 text-sm text-text-secondary">A live overview of society maintenance.</p>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard icon={ListChecks} label="Total" value={data.totalComplaints} />
        <StatsCard icon={DoorOpen} label="Open" value={data.byStatus?.OPEN || 0} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatsCard icon={Loader} label="In Progress" value={data.byStatus?.IN_PROGRESS || 0} iconBg="bg-indigo-100" iconColor="text-indigo-600" />
        <StatsCard icon={AlertTriangle} label="Overdue" value={data.overdueCount} iconBg="bg-red-100" iconColor="text-red-600" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <BreakdownCard title="By status" data={data.byStatus} />
        <BreakdownCard title="By category" data={data.byCategory} />
        <BreakdownCard title="By priority" data={data.byPriority} />
      </div>
    </div>
  )
}
