import { NavLink } from 'react-router-dom'
import styles from './AdminNavbar.module.css'

export default function AdminNavbar() {
  return (
    <nav className={styles.navbar}>
      <span className={styles.brand}>Sofka Admin</span>
      <div className={styles.links}>
        <NavLink
          to="/admin/vacantes"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Vacantes
        </NavLink>
        <NavLink
          to="/admin/preguntas"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Preguntas
        </NavLink>
        <NavLink
          to="/admin/aplicaciones"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Aplicaciones
        </NavLink>
      </div>
    </nav>
  )
}
