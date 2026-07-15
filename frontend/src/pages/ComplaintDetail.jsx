import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api, { apiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges'
import { fmtDate, labelize, STATUSES, PRIORITIES } from '../lib/constants'
import { ArrowLeft, Lock, Send } from 'lucide-react'

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [c, setC] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [targetStatus, setTargetStatus] = useState(null) // status the admin has selected (not yet sent)
  const [busy, setBusy] = useState(false)

  function load() {
    api.get(`/complaints/${id}`).then((res) => setC(res.data)).catch((err) => setError(apiError(err)))
  }
  useEffect(load, [id])

  // Keep the selected status in sync with the loaded complaint.
  useEffect(() => { if (c) setTargetStatus(c.status) }, [c?.id, c?.status])

  async function sendStatus() {
    setBusy(true); setError('')
    try {
      const { data } = await api.patch(`/complaints/${id}/status`, { status: targetStatus, note: note || null })
      setC(data); setNote('')
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  async function changePriority(priority) {
    setBusy(true); setError('')
    try {
      const { data } = await api.patch(`/complaints/${id}/priority`, { priority })
      setC(data)
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }

  if (error && !c) return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
  if (!c) return <p className="text-text-secondary">Loading…</p>

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-text-primary">#{c.id} · {labelize(c.category)}</h1>
          <StatusBadge status={c.status} />
          <PriorityBadge priority={c.priority} />
          {c.overdue && <OverdueBadge />}
          {c.closed && <span className="badge badge-muted"><Lock className="h-3 w-3" /> Closed</span>}
        </div>
        <p className="mt-3 text-text-primary">{c.description}</p>
        <div className="mt-2 text-xs text-text-muted">
          By {c.residentName}{c.flatNumber ? ` · ${c.flatNumber}` : ''} · Raised {fmtDate(c.createdAt)}
        </div>
        {c.photoUrl && <img src={c.photoUrl} alt="complaint" className="mt-4 max-h-80 rounded-xl object-cover" />}
      </div>

      {isAdmin && !c.closed && (
        <div className="card mt-4">
          <h2 className="mb-4 font-semibold text-text-primary">Admin actions</h2>
          {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <div className="mb-5">
            <label className="label">Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => {
                const active = p === c.priority
                return (
                  <button key={p} disabled={busy} onClick={() => changePriority(p)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-60 ${
                      active
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'border border-border bg-white text-text-secondary hover:border-primary/40 hover:text-primary'
                    }`}>{p}</button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-text-muted">Priority updates instantly.</p>
          </div>

          <div>
            <label className="label">Update status</label>
            {/* Click a status to select it; the change is only applied when you press Send. */}
            <div className="mb-3 flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const selected = s === targetStatus
                const current = s === c.status
                return (
                  <button key={s} type="button" onClick={() => setTargetStatus(s)}
                    className={`relative rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wider transition-all active:scale-[0.98] ${
                      selected
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'border border-border bg-white text-text-secondary hover:border-primary/40 hover:text-primary'
                    }`}>
                    {labelize(s)}
                    {current && (
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold normal-case ${selected ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary'}`}>current</span>
                    )}
                  </button>
                )
              })}
            </div>
            <textarea className="textarea-field mb-3 !min-h-[80px]" value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={targetStatus === c.status
                ? 'Add a progress update note (stays In Progress)…'
                : 'Optional note about this change…'} />
            {(() => {
              const changed = targetStatus !== c.status
              const canSend = changed || note.trim().length > 0
              return (
                <button onClick={sendStatus} disabled={busy || !canSend} className="btn-primary">
                  <Send className="h-4 w-4" />
                  {busy ? 'Sending…' : changed ? `Send: ${labelize(targetStatus)}` : 'Add progress update'}
                </button>
              )
            })()}
            <p className="mt-2 text-xs text-text-muted">
              Keep the same status and add a note to log multiple progress updates. Marking Resolved closes the complaint.
            </p>
          </div>
        </div>
      )}

      <div className="card mt-4">
        <h2 className="mb-5 font-semibold text-text-primary">Status history</h2>
        <ol className="relative border-l-2 border-gray-100 pl-6">
          {(() => {
            let updateNo = 0
            return c.history.map((h) => {
              // old == new (and not the creation row) means a progress update, not a transition.
              const isUpdate = h.oldStatus && h.newStatus && h.oldStatus === h.newStatus
              if (isUpdate) updateNo++
              return (
                <li key={h.id} className="mb-6 last:mb-0">
                  <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full ring-4 ${isUpdate ? 'bg-text-muted ring-gray-100' : 'bg-primary ring-primary/10'}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    {isUpdate ? (
                      <>
                        <StatusBadge status={h.newStatus} />
                        <span className="badge badge-muted">Update #{updateNo}</span>
                      </>
                    ) : (
                      <>
                        {h.oldStatus && <StatusBadge status={h.oldStatus} />}
                        {h.oldStatus && <span className="text-text-muted">→</span>}
                        <StatusBadge status={h.newStatus} />
                      </>
                    )}
                  </div>
                  {h.note && <p className="mt-1.5 text-sm text-text-primary">{h.note}</p>}
                  <p className="mt-1 text-xs text-text-muted">{h.actorName} · {fmtDate(h.timestamp)}</p>
                </li>
              )
            })
          })()}
        </ol>
      </div>
    </div>
  )
}
