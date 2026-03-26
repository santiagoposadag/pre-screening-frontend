import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../../../services/api'
import styles from './ApplicationDetail.module.css'

export default function ApplicationDetail() {
  const { id } = useParams()
  const { state: app } = useLocation()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [loadingQ, setLoadingQ] = useState(true)

  const [evaluation, setEvaluation] = useState(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalError, setEvalError] = useState(null)

  useEffect(() => {
    if (!app) {
      navigate('/admin/aplicaciones', { replace: true })
      return
    }
    api
      .get('/questions/', { params: { vacancy_id: app.vacancy_id } })
      .then(({ data }) => setQuestions(data))
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQ(false))
  }, [app, navigate])

  // Carga evaluación existente al montar
  useEffect(() => {
    if (!app) return
    api.get(`/applications/${app.id}/evaluation`)
      .then(({ data }) => setEvaluation(data))
      .catch(() => {}) // 404 = no hay evaluación aún, silencioso
  }, [app])

  if (!app) return null

  const formatDate = (str) => {
    if (!str) return '-'
    try {
      return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(str))
    } catch {
      return str
    }
  }

  const [downloading, setDownloading] = useState(false)

  const handleDownloadTranscript = async () => {
    setDownloading(true)
    try {
      const response = await api.get(`/applications/${app.id}/transcript`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/plain' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `transcripcion_${app.full_name.replace(/\s+/g, '_')}_${app.id}.txt`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Error al generar la transcripción. Intenta de nuevo.')
    } finally {
      setDownloading(false)
    }
  }

  const handleEvaluate = async () => {
    setEvalLoading(true)
    setEvalError(null)
    try {
      const { data } = await api.post(`/applications/${app.id}/evaluate`)
      setEvaluation(data)
    } catch (err) {
      setEvalError(err.response?.data?.detail || 'Error al evaluar. Intenta de nuevo.')
    } finally {
      setEvalLoading(false)
    }
  }

  // Map question_id → answer
  const answerMap = {}
  for (const ans of app.answers ?? []) {
    answerMap[ans.question_id] = ans
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.btnBack} onClick={() => navigate('/admin/aplicaciones')}>
          ← Volver
        </button>
        <div style={{ flex: 1 }}>
          <h1 className={styles.pageTitle}>{app.full_name}</h1>
          <p className={styles.pageSubtitle}>{app.email} · {app.vacancy_name} · {formatDate(app.applied_at)}</p>
        </div>
        <button
          className={styles.btnDownload}
          onClick={handleDownloadTranscript}
          disabled={downloading}
        >
          {downloading ? '⏳ Generando...' : '↓ Descargar transcripción'}
        </button>
      </div>

      {/* Evaluación IA */}
      <div className={styles.evalCard}>
        <div className={styles.evalCardHeader}>
          <h2 className={styles.evalTitle}>Evaluación IA</h2>
          {evaluation ? (
            <button
              className={styles.btnReEvaluate}
              onClick={handleEvaluate}
              disabled={evalLoading}
            >
              {evalLoading ? '⏳ Analizando...' : '↺ Re-evaluar'}
            </button>
          ) : (
            <button
              className={styles.btnEvaluate}
              onClick={handleEvaluate}
              disabled={evalLoading}
            >
              {evalLoading ? '⏳ Analizando...' : '✦ Evaluar con IA'}
            </button>
          )}
        </div>

        {evaluation ? (
          <>
            {/* Score + Match Level */}
            <div className={styles.evalScoreRow}>
              <div className={styles.evalScore}>
                <span className={styles.evalScoreNum}>{evaluation.overall_score.toFixed(1)}</span>
                <span className={styles.evalScoreMax}>/10</span>
              </div>
              <span className={`${styles.evalBadge} ${
                evaluation.match_level === 'Alto' ? styles.evalBadgeAlto :
                evaluation.match_level === 'Medio' ? styles.evalBadgeMedio :
                styles.evalBadgeBajo
              }`}>
                {evaluation.match_level} match
              </span>
            </div>

            {/* Recommendation */}
            <p className={styles.evalRecommendation}>{evaluation.recommendation}</p>

            {/* Strengths + Weaknesses */}
            <div className={styles.evalDetails}>
              <div className={styles.evalSection}>
                <h4 className={styles.evalSectionTitle}>✓ Fortalezas</h4>
                <ul className={styles.evalList}>
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className={styles.evalListItem}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.evalSection}>
                <h4 className={styles.evalSectionTitle}>⚠ Áreas de mejora</h4>
                <ul className={styles.evalList}>
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className={styles.evalListItemWeak}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className={styles.evalDate}>
              Evaluado el {new Date(evaluation.evaluated_at).toLocaleString('es-CO')}
            </p>
          </>
        ) : (
          <>
            {evalLoading && (
              <p className={styles.evalHint}>
                Transcribiendo videos y evaluando con Claude... esto puede tardar hasta 60 segundos.
              </p>
            )}
            {evalError && <p className={styles.evalError}>{evalError}</p>}
            {!evalLoading && !evalError && (
              <p className={styles.evalEmpty}>Aún no se ha evaluado este candidato.</p>
            )}
          </>
        )}
      </div>

      {/* Questions + videos */}
      {loadingQ ? (
        <p className={styles.status}>Cargando preguntas...</p>
      ) : questions.length === 0 ? (
        <p className={styles.status}>Esta vacante no tiene preguntas registradas.</p>
      ) : (
        <div className={styles.questionList}>
          {questions.map((q, i) => {
            const answer = answerMap[q.id]
            const text = q.text || q.texto || q.question
            const videoUrl = answer?.video_url
            const skipped = !answer || answer.skipped || !videoUrl

            return (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNum}>Pregunta {i + 1}</span>
                  {skipped ? (
                    <span className={`${styles.badge} ${styles.badgeSkipped}`}>Saltada</span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeAnswered}`}>Respondida ✓</span>
                  )}
                </div>

                <p className={styles.questionText}>{text}</p>

                {skipped ? (
                  <div className={styles.skippedBox}>
                    El candidato no respondió esta pregunta.
                  </div>
                ) : (
                  <video
                    className={styles.videoEl}
                    src={`/api/v1/applications/${app.id}/answers/${q.id}/video`}
                    controls
                    playsInline
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
