import { useEffect, useState } from 'react'
import api, { apiError } from '../api/client'
import { fmtDate } from '../lib/constants'
import { Pin, Trash2, Send } from 'lucide-react'

export default function AdminNotices() {
  const [notices, setNotices] = useState([])
  const [form, setForm] = useState({ title: '', body: '', important: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    api.get('/notices').then((res) => setNotices(res.data)).catch((err) => setError(apiError(err)))
  }
  useEffect(load, [])

  async function post(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api.post('/notices', form)
      setForm({ title: '', body: '', important: false })
      load()
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  async function remove(id) {
    if (!confirm('Delete this notice?')) return
    try { await api.delete(`/notices/${id}`); load() } catch (err) { setError(apiError(err)) }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Notice Board</h1>
      <p className="mb-6 text-sm text-text-secondary">Post announcements. Important ones are pinned and emailed to all residents.</p>

      <form onSubmit={post} className="card mb-6 space-y-4">
        <h2 className="font-semibold text-text-primary">Post a notice</h2>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div>
          <label className="label">Title</label>
          <input className="input-field !rounded-xl !text-left" value={form.title} required
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Body</label>
          <textarea className="textarea-field" value={form.body} required
            onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.important}
            onChange={(e) => setForm({ ...form, important: e.target.checked })} />
          Mark important (pin to top &amp; email all residents)
        </label>
        <button className="btn-primary" disabled={busy}><Send className="h-4 w-4" /> {busy ? 'Posting…' : 'Post notice'}</button>
      </form>

      <div className="grid gap-3">
        {notices.map((n) => (
          <div key={n.id} className={`card ${n.important ? 'border-l-4 border-l-danger-dark' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-text-primary">{n.title}</h2>
              <div className="flex items-center gap-2">
                {n.important && <span className="badge badge-danger"><Pin className="h-3 w-3" /> Important</span>}
                <button className="btn-danger !px-2.5 !py-1.5" onClick={() => remove(n.id)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{n.body}</p>
            <p className="mt-3 text-xs text-text-muted">{n.authorName} · {fmtDate(n.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
