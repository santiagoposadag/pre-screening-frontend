import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApply } from '../../context/ApplyContext'
import { vacanciesService } from '../../services/vacancies'
import CandidateHeader from '../../components/CandidateHeader/CandidateHeader'
import styles from './StepOne.module.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function StepOne() {
  const navigate = useNavigate()
  const { applicationData, setApplicationData } = useApply()

  const [fullName, setFullName] = useState(applicationData?.full_name || '')
  const [email, setEmail] = useState(applicationData?.email || '')
  const [vacancyId, setVacancyId] = useState(applicationData?.vacancy_id || '')
  const [vacancies, setVacancies] = useState([])
  const [loadingVacancies, setLoadingVacancies] = useState(true)
  const [vacanciesError, setVacanciesError] = useState(null)
  const [touched, setTouched] = useState({ fullName: false, email: false, vacancyId: false })

  useEffect(() => {
    vacanciesService
      .getAll()
      .then((data) => setVacancies(data))
      .catch(() => setVacanciesError('No se pudieron cargar las vacantes'))
      .finally(() => setLoadingVacancies(false))
  }, [])

  const emailValid = EMAIL_REGEX.test(email)
  const isValid = fullName.trim() !== '' && emailValid && vacancyId !== ''

  const handleBlur = (field) => setTouched((prev) => ({ ...prev, [field]: true }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    const selected = vacancies.find((v) => String(v.id) === String(vacancyId))
    setApplicationData({
      full_name: fullName.trim(),
      email: email.trim(),
      vacancy_id: vacancyId,
      vacancy_name: selected?.name || selected?.nombre || '',
    })
    navigate('/apply/step2')
  }

  return (
    <div className={styles.page}>
      <CandidateHeader />

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Comienza tu proceso</h1>
          <p className={styles.subtitle}>Completa el formulario para iniciar tu proceso de seleccion como desarrollador en Sofka Tech.</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="fullName">
                Nombre completo <span className={styles.required}>*</span>
              </label>
              <input
                id="fullName"
                className={`${styles.input} ${touched.fullName && fullName.trim() === '' ? styles.inputError : ''}`}
                type="text"
                placeholder="Ej. María García López"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur('fullName')}
                required
              />
              {touched.fullName && fullName.trim() === '' && (
                <span className={styles.errorMsg}>El nombre es obligatorio.</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Correo electrónico <span className={styles.required}>*</span>
              </label>
              <input
                id="email"
                className={`${styles.input} ${touched.email && !emailValid ? styles.inputError : ''}`}
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                required
              />
              {touched.email && !emailValid && (
                <span className={styles.errorMsg}>Ingresa un correo válido.</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="vacancy">
                Vacante <span className={styles.required}>*</span>
              </label>
              {loadingVacancies ? (
                <p className={styles.loadingText}>Cargando vacantes...</p>
              ) : vacanciesError ? (
                <p className={styles.errorMsg}>{vacanciesError}</p>
              ) : (
                <select
                  id="vacancy"
                  className={`${styles.select} ${touched.vacancyId && vacancyId === '' ? styles.inputError : ''}`}
                  value={vacancyId}
                  onChange={(e) => setVacancyId(e.target.value)}
                  onBlur={() => handleBlur('vacancyId')}
                  required
                >
                  <option value="">-- Selecciona una vacante --</option>
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name || v.nombre}
                    </option>
                  ))}
                </select>
              )}
              {touched.vacancyId && vacancyId === '' && !loadingVacancies && !vacanciesError && (
                <span className={styles.errorMsg}>Selecciona una vacante.</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={!isValid}
            >
              Continuar →
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
