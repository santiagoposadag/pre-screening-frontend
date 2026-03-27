import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApply } from '../../context/ApplyContext'
import { portalService } from '../../services/portal'
import CandidateHeader from '../../components/CandidateHeader/CandidateHeader'
import styles from './Invitations.module.css'

export default function Invitations() {
  const navigate = useNavigate()
  const { setApplicationData } = useApply()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(null) // invitation id being started

  useEffect(() => {
    if (!portalService.isAuthenticated()) {
      navigate('/')
      return
    }
    portalService
      .getInvitations()
      .then(setInvitations)
      .catch((err) => {
        if (err.response?.status === 401) {
          portalService.logout()
          navigate('/')
        } else {
          setError('No se pudieron cargar las invitaciones.')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const handleStart = async (invitation) => {
    setStarting(invitation.id)
    setError(null)
    try {
      const data = await portalService.startInterview(invitation.id)
      setApplicationData({
        invitation_id: invitation.id,
        application_id: data.application_id,
        vacancy_id: invitation.vacancy_id,
        vacancy_name: invitation.vacancy_name,
        questions: data.questions,
      })
      navigate('/apply/interview')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar la entrevista.')
      setStarting(null)
    }
  }

  const handleLogout = () => {
    portalService.logout()
    navigate('/')
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <CandidateHeader />
        <main className={styles.main}>
          <p className={styles.loadingText}>Cargando invitaciones...</p>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <CandidateHeader />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Tus entrevistas</h1>
              <p className={styles.subtitle}>Selecciona una invitación para comenzar tu entrevista.</p>
            </div>
            <button className={styles.btnLogout} onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          {invitations.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No tienes entrevistas pendientes en este momento.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {invitations.map((inv) => (
                <div key={inv.id} className={styles.card}>
                  <div className={styles.cardBody}>
                    <h3 className={styles.vacancyName}>{inv.vacancy_name}</h3>
                    <span className={styles.statusBadge}>{inv.status}</span>
                  </div>
                  <button
                    className={styles.btnStart}
                    onClick={() => handleStart(inv)}
                    disabled={starting === inv.id}
                  >
                    {starting === inv.id ? 'Iniciando...' : 'Comenzar entrevista'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
