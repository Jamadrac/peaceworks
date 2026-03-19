import { useEffect, useMemo, useState } from 'react'
import './AuthLoginSignup.css'
import { API_BASE } from '../config/api'

function VerifyEmail({ route }) {
  // route example: /verify/email/123456
  const prefilledToken = useMemo(() => {
    const parts = route?.split('/') || []
    return parts.length >= 4 ? parts[3] : ''
  }, [route])

  const [form, setForm] = useState({ email: '', token: prefilledToken })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (prefilledToken) {
      setForm((prev) => ({ ...prev, token: prefilledToken }))
    }
  }, [prefilledToken])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/user/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          token: form.token.trim(),
          frontendUrl: `${window.location.origin}#`,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.message || 'Verification failed')
      }

      setMessage('Email verified successfully. You can now log in.')
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-card">
      <h1>Verify email</h1>
      <div className="subhead">Enter the code we emailed you</div>

      {(error || message) && (
        <div className={`banner ${error ? 'banner-error' : 'banner-success'}`}>
          {error || message}
        </div>
      )}

      <form className="form active" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Verification code"
          value={form.token}
          onChange={(event) => setForm((prev) => ({ ...prev, token: event.target.value }))}
          required
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify email'}
        </button>
      </form>

      <div className="back-home">
        <a href="#/login">Back to login</a>
      </div>
    </div>
  )
}

export default VerifyEmail
