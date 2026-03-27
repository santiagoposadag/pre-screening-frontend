import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalService } from '../../services/portal'
import CandidateHeader from '../../components/CandidateHeader/CandidateHeader'
import styles from './CandidateLogin.module.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CandidateLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const emailValid = EMAIL_REGEX.test(email)

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!emailValid) return
    setLoading(true)
    setError(null)
    try {
      const data = await portalService.requestOtp(email.trim())
      setMessage(data.message)
      setStep('code')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar el código.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      await portalService.verifyOtp(email.trim(), code.trim())
      navigate('/apply/invitations')
    } catch (err) {
      setError(err.response?.data?.detail || 'Código inválido o expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <CandidateHeader />
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Accede a tu entrevista</h1>
          <p className={styles.subtitle}>
            Ingresa tu correo electrónico para verificar tu identidad y acceder a tus entrevistas pendientes.
          </p>

          {step === 'email' ? (
            <form className={styles.form} onSubmit={handleRequestOtp} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  className={styles.input}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={!emailValid || loading}
              >
                {loading ? 'Enviando...' : 'Enviar código de verificación'}
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleVerifyOtp} noValidate>
              {message && <p className={styles.infoMsg}>{message}</p>}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="code">
                  Código de verificación
                </label>
                <input
                  id="code"
                  className={styles.codeInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoComplete="one-time-code"
                  required
                />
                <span className={styles.hint}>
                  Revisa tu correo electrónico ({email})
                </span>
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={code.length !== 6 || loading}
              >
                {loading ? 'Verificando...' : 'Verificar código'}
              </button>

              <button
                type="button"
                className={styles.btnLink}
                onClick={() => { setStep('email'); setCode(''); setError(null) }}
              >
                Cambiar correo
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
