import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'
import AuthShell from '../components/AuthShell'
import { CheckCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const flash = location.state?.message

  const [email, setEmail] = useState(location.state?.email || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/complaints')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Sign In"
      brand={{
        heading: 'Society Maintenance Tracker',
        subtitle: 'Raise complaints, track progress, and stay informed — all in one place.',
        linkTo: '/register',
        linkLabel: 'Create Account',
      }}
    >
      {flash && (
        <div className="mb-4 flex w-full max-w-xs items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{flash}</span>
        </div>
      )}
      <p className="mb-6 text-xs font-medium text-gray-400">Use your account</p>
      <form onSubmit={onSubmit} className="w-full max-w-xs space-y-4">
        <input type="email" placeholder="Email" value={email} required
          onChange={(e) => setEmail(e.target.value)} className="input-field text-center" />
        <input type="password" placeholder="Password" value={password} required
          onChange={(e) => setPassword(e.target.value)} className="input-field text-center" />
        {error && <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
        <div className="flex justify-center pt-2">
          <button type="submit" disabled={loading} className="btn-primary px-12">
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
