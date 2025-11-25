import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  if (loc.pathname === '/login' || loc.pathname === '/register') return null

  const onLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <header className="topbar nav-global">
      <div className="topbar-left">
        <h1 className="brand-title">
          VENI <span>2</span>
        </h1>
        <nav className="topbar-nav">
          <Link to="/" className={`topbar-link ${loc.pathname === '/' || loc.pathname === '/dashboard' ? 'active' : ''}`}>
            Inicio
          </Link>
          <Link to="/new-trip" className={`topbar-link ${loc.pathname === '/new-trip' ? 'active' : ''}`}>
            Solicitar viaje
          </Link>
          <Link to="/profile" className={`topbar-link ${loc.pathname === '/profile' ? 'active' : ''}`}>
            Perfil
          </Link>
        </nav>
      </div>
      <div className="topbar-right">
        {token ? (
          <>
            <Link to="/profile" className="user-pill">
              <span className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              <span className="user-name">{user?.name || user?.email}</span>
            </Link>
            <button className="topbar-logout" onClick={onLogout}>Salir</button>
          </>
        ) : (
          <div className="userbox">
            <Link to="/login">Entrar</Link>
          </div>
        )}
      </div>
    </header>
  )
}
