import { Navigate } from 'react-router-dom'
import authService from '../../services/auth'
import Sidebar from '../Sidebar/Sidebar'
import styles from './AdminLayout.module.css'

export default function AdminLayout({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
