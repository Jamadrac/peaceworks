import { useMemo, useState } from 'react'
import { useRecoilValue } from 'recoil'
import './Navbar.css'
import { authState, userState } from '../state/authAtoms'

function Navbar() {
  const isAuthenticated = useRecoilValue(authState)
  const user = useRecoilValue(userState)
  const [open, setOpen] = useState(false)

  const navLinks = useMemo(
    () => [
      { label: 'Browse Tasks', href: '#tasks' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'For You', href: '#features' },
      { label: 'Community', href: '#community' },
      { label: 'FAQ', href: '#faq' },
    ],
    [],
  )

  return (
    <nav className="site-nav">
      <div className="nav-container">
        <a className="logo" href="#/">
          PIECEWORKS <strong>ZAMBIA</strong>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`nav-links ${open ? 'nav-open' : ''}`}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
          {isAuthenticated ? (
            <a href="#/profile" className="btn-secondary">
              {user?.username || 'Profile'}
            </a>
          ) : (
            <a href="#/login" className="btn-secondary">
              Log In
            </a>
          )}
          <a href={isAuthenticated ? '#/post' : '#/login'} className="btn-primary">
            Get Started
          </a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
