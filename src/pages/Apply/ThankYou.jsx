import { useNavigate } from 'react-router-dom'
import styles from './ThankYou.module.css'

export default function ThankYou() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.logoText}>Sofka Tech</span>

        <div className={styles.iconWrapper}>
          <svg
            className={styles.checkIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Aplicacion enviada exitosamente"
          >
            <circle cx="12" cy="12" r="12" fill="#10B981" />
            <path
              d="M7 12.5l3.5 3.5 6.5-7"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className={styles.title}>Aplicacion enviada con exito</h1>

        <p className={styles.body}>
          Hemos recibido tu informacion y tus videos de respuesta. Nuestro equipo los revisara
          y te contactara pronto con los proximos pasos del proceso.
        </p>

        <div className={styles.stepsBox}>
          <p className={styles.stepsTitle}>Proximos pasos</p>
          <ul className={styles.stepsList}>
            <li className={styles.stepItem}>
              <span className={styles.stepDot}>1</span>
              <span>Revision de tu perfil y videos por el equipo de reclutamiento</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepDot}>2</span>
              <span>Evaluacion tecnica automatizada con inteligencia artificial</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepDot}>3</span>
              <span>Contacto por correo electronico con el resultado</span>
            </li>
          </ul>
        </div>

        <button
          className={styles.btnSecondary}
          onClick={() => navigate('/')}
        >
          Aplicar a otra vacante
        </button>
      </div>
    </div>
  )
}
