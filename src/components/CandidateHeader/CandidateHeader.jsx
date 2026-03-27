import { Link } from 'react-router-dom'
import { useApply } from '../../context/ApplyContext'
import styles from './CandidateHeader.module.css'

export default function CandidateHeader() {
  const { resetApplication } = useApply()

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Sofka Tech</span>
          <span className={styles.headerTitle}>Prescreening</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.btnReset} onClick={resetApplication}>
            Reiniciar
          </button>
          <Link to="/admin" className={styles.adminLink}>
            Admin →
          </Link>
        </div>
      </div>
    </header>
  )
}
