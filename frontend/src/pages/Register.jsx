import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'
import AuthShell from '../components/AuthShell'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', flatNumber: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      const { name, email, flatNumber, password } = form
      await register({ name, email, flatNumber, password })
      // Move to OTP verification.
      navigate('/verify', { state: { email } })
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      reverse
      title="Create Account"
      brand={{
        heading: 'Welcome Back',
        subtitle: 'Already a resident? Sign in to manage your complaints and read notices.',
        linkTo: '/login',
        linkLabel: 'Sign In',
      }}
    >
      <p className="mb-6 text-xs font-medium text-gray-400">Register as a resident</p>
      <form onSubmit={onSubmit} className="w-full max-w-xs space-y-3.5">
        <input placeholder="Full name" value={form.name} required onChange={update('name')} className="input-field text-center" />
        <input type="email" placeholder="Email" value={form.email} required onChange={update('email')} className="input-field text-center" />
        <input placeholder="Flat number (e.g. B-402)" value={form.flatNumber} onChange={update('flatNumber')} className="input-field text-center" />
        <input type="password" placeholder="Password" value={form.password} required minLength={6} onChange={update('password')} className="input-field text-center" />
        <input type="password" placeholder="Confirm password" value={form.confirm} required onChange={update('confirm')} className="input-field text-center" />
        {error && <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
        <div className="flex justify-center pt-2">
          <button type="submit" disabled={loading} className="btn-primary px-12">
            {loading ? 'Sending code…' : 'Sign Up'}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
