import { useState } from 'react'
import './AuthLoginSignup.css'
import { API_BASE } from '../config/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          // Use hash-based route so links in email land back inside the SPA
          frontendUrl: `${window.location.origin}#`,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.message || 'Failed to send reset code')
      }

      setMessage('OTP sent to your email. Check your inbox and proceed to update password.')
    } catch (err) {
      setError(err.message || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-card">
      <h1>Reset password</h1>
      <div className="subhead">Send yourself a one-time code</div>

      {(error || message) && (
        <div className={`banner ${error ? 'banner-error' : 'banner-success'}`}>
          {error || message}
        </div>
      )}

      <form className="form active" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>

      <div className="back-home">
        <a href="#/login">Back to login</a> · <a href="#/update/password">Have an OTP? Update password</a>
      </div>
    </div>
  )
}

export default ForgotPassword
