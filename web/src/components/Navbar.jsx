import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const onLogout = () => {
    logout()
    nav('/login')
  }
  const isAuthPage = loc.pathname === '/login' || loc.pathname === '/register'
  return (
    <nav className="navbar">
      <div className="brand">Veni 2</div>
      {!isAuthPage && (
        <div className="navlinks">
          <Link to="/dashboard">Panel</Link>
          <Link to="/new-trip">Nuevo viaje</Link>
        </div>
      )}
      <div className="spacer" />
      {token ? (
        <div className="userbox">
          <span>{user?.email}</span>
          <button className="link" onClick={onLogout}>Salir</button>
        </div>
      ) : (
        <div className="userbox">
          <Link to="/login">Entrar</Link>
        </div>
      )}
    </nav>
  )}

