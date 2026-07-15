import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { apiError } from '../api/client'
import { CATEGORIES, labelize } from '../lib/constants'
import { ImagePlus, ArrowLeft } from 'lucide-react'

export default function NewComplaint() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('PLUMBING')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function onPhoto(e) {
    const file = e.target.files[0]
    setPhoto(file || null)
    setPreview(file ? URL.createObjectURL(file) : '')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('category', category)
      fd.append('description', description)
      if (photo) fd.append('photo', photo)
      await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/complaints')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Raise a Complaint</h1>
      <p className="mb-6 text-sm text-text-secondary">Give us the details so the admin can act quickly.</p>

      <form onSubmit={onSubmit} className="card space-y-5">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div>
          <label className="label">Category</label>
          <select className="select-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{labelize(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="textarea-field" value={description} required
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail…" />
        </div>
        <div>
          <label className="label">Photo (optional)</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-input-bg px-5 py-4 text-sm text-text-secondary transition hover:border-primary/40">
            <ImagePlus className="h-5 w-5 text-primary" />
            <span>{photo ? photo.name : 'Click to attach an image'}</span>
            <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </label>
          {preview && <img src={preview} alt="preview" className="mt-3 h-44 rounded-xl object-cover" />}
        </div>
        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <button className="btn-primary" disabled={loading}>{loading ? 'Submitting…' : 'Submit Complaint'}</button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/complaints')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
