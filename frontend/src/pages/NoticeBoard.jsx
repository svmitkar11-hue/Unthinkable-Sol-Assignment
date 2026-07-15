import { useEffect, useState } from 'react'
import api, { apiError } from '../api/client'
import { fmtDate } from '../lib/constants'
import { Megaphone, Pin } from 'lucide-react'

export default function NoticeBoard() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/notices')
      .then((res) => setNotices(res.data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Megaphone className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notice Board</h1>
          <p className="text-sm text-text-secondary">Announcements from your society admin.</p>
        </div>
      </div>

      {loading && <p className="text-text-secondary">Loading…</p>}
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      {!loading && notices.length === 0 && (
        <div className="card py-16 text-center text-text-secondary">No notices posted yet.</div>
      )}

      <div className="grid gap-3">
        {notices.map((n) => (
          <div key={n.id} className={`card ${n.important ? 'border-l-4 border-l-danger-dark' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-text-primary">{n.title}</h2>
              {n.important && <span className="badge badge-danger"><Pin className="h-3 w-3" /> Important</span>}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{n.body}</p>
            <p className="mt-3 text-xs text-text-muted">{n.authorName} · {fmtDate(n.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
