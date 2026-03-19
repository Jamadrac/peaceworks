import { useState } from 'react'
import './AuthLoginSignup.css'
import { API_BASE } from '../config/api'

function UpdatePassword() {
  const [form, setForm] = useState({ email: '', otp: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/user/update/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          otp: form.otp.trim(),
          password: form.password.trim(),
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.message || 'Failed to update password')
      }

      setMessage('Password updated successfully. You can now log in.')
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-card">
      <h1>Update password</h1>
      <div className="subhead">Use the OTP we emailed you</div>

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
          placeholder="OTP code"
          value={form.otp}
          onChange={(event) => setForm((prev) => ({ ...prev, otp: event.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <div className="back-home">
        <a href="#/forgot-password">Need a new code?</a> · <a href="#/login">Back to login</a>
      </div>
    </div>
  )
}

export default UpdatePassword
