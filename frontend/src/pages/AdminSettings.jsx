import { useEffect, useState } from 'react'
import api, { apiError } from '../api/client'
import { Clock, RefreshCw, CheckCircle } from 'lucide-react'

export default function AdminSettings() {
  const [days, setDays] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => setDays(res.data.overdueThresholdDays))
      .catch((err) => setError(apiError(err)))
  }, [])

  async function save(e) {
    e.preventDefault()
    setBusy(true); setError(''); setMsg('')
    try {
      await api.put('/admin/settings', { overdueThresholdDays: Number(days) })
      setMsg('Saved. Overdue flags recalculated.')
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  async function recompute() {
    setBusy(true); setError(''); setMsg('')
    try {
      const { data } = await api.post('/admin/overdue/recompute')
      setMsg(`Recomputed. ${data.overdueCount} complaint(s) currently overdue.`)
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Settings</h1>
      <p className="mb-6 text-sm text-text-secondary">Tune how the system flags overdue complaints.</p>

      <form onSubmit={save} className="card space-y-5">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        {msg && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />{msg}
          </div>
        )}
        <div>
          <label className="label flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Overdue threshold (days)</label>
          <input type="number" min="1" className="input-field !rounded-xl !text-left" value={days}
            onChange={(e) => setDays(e.target.value)} required />
          <p className="mt-1.5 text-xs text-text-muted">
            Unresolved complaints older than this are flagged overdue and surface at the top of the admin list.
          </p>
        </div>
        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <button className="btn-primary" disabled={busy}>Save</button>
          <button type="button" className="btn-ghost" onClick={recompute} disabled={busy}>
            <RefreshCw className="h-4 w-4" /> Recompute now
          </button>
        </div>
      </form>
    </div>
  )
}
