import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'
import AuthShell from '../components/AuthShell'
import { Terminal, CheckCircle } from 'lucide-react'

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Reached without an email in state → nothing to verify.
  if (!email) return <Navigate to="/register" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    setLoading(true)
    try {
      const user = await verifyOtp(email, otp.trim())
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/complaints')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    setError(''); setInfo('')
    try {
      const res = await resendOtp(email)
      setInfo(res.message || 'A new code was sent. Check the server terminal.')
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <AuthShell
      title="Verify Email"
      brand={{
        heading: 'One Last Step',
        subtitle: 'Enter the 6-digit code to activate your account and start raising complaints.',
        linkTo: '/login',
        linkLabel: 'Back to Sign In',
      }}
    >
      <p className="mb-3 text-sm text-text-secondary">
        Code sent to <span className="font-semibold text-text-primary">{email}</span>
      </p>
      <div className="mb-5 flex w-full max-w-xs items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-700">
        <Terminal className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>No email service is configured — your OTP is printed in the <b>backend terminal</b> where the server is running.</span>
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-xs space-y-4">
        <input
          inputMode="numeric" maxLength={6} placeholder="______" value={otp} required
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="input-field text-center text-2xl font-bold tracking-[0.5em]"
        />
        {info && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2.5 text-xs text-green-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />{info}
          </div>
        )}
        {error && <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}
        <div className="flex justify-center pt-1">
          <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary px-12">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </form>
      <button onClick={onResend} className="mt-4 text-xs font-medium text-text-secondary hover:text-primary">
        Didn’t get it? Resend code
      </button>
    </AuthShell>
  )
}
