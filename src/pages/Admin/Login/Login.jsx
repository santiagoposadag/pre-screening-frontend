import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../../services/auth'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    const result = authService.login(username, password)
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>S</div>
          <div>
            <div className={styles.brandName}>Sofka Tech</div>
            <div className={styles.brandSub}>Prescreening Admin</div>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Usuario</label>
            <input
              id="username"
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Contraseña</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btnSubmit}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
