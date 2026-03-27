import { NavLink, useNavigate } from 'react-router-dom'
import authService from '../../services/auth'
import styles from './Sidebar.module.css'

const menuItems = [
  { to: '/admin', label: 'Dashboard', icon: '⬡', end: true },
  { to: '/admin/vacantes', label: 'Vacantes', icon: '◈' },
  { to: '/admin/aplicaciones', label: 'Aplicaciones', icon: '◉' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    authService.logout()
    navigate('/admin/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>S</div>
        <div>
          <div className={styles.brandName}>Sofka Tech</div>
          <div className={styles.brandSub}>Prescreening</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navLabel}>Menú</div>
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <a href="/" target="_blank" rel="noreferrer" className={styles.candidateLink}>
          <span>↗</span>
          <span>Portal del candidato</span>
        </a>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
