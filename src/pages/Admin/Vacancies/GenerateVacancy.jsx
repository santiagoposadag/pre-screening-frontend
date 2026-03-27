import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { vacanciesService } from '../../../services/vacancies'
import styles from './GenerateVacancy.module.css'

export default function GenerateVacancy() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState('input')
  const [formData, setFormData] = useState({
    job_description: '',
    num_questions: 12,
    questions_per_interview: 5,
  })
  const [draft, setDraft] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [regenerating, setRegenerating] = useState(null)
  const [regenerateLoading, setRegenerateLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [highlightedCard, setHighlightedCard] = useState(null)

  // Navigation guard — warn before closing tab if draft exists
  useEffect(() => {
    if (phase !== 'review' || !draft) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase, draft])

  // ── Error helper ───────────────────────────────────────────────────────────

  const handleApiError = (err, defaultMsg) => {
    if (err.response?.status === 404) {
      setError('La sesión de generación expiró. Por favor, genera de nuevo.')
      setPhase('input')
      setDraft(null)
      setRegenerating(null)
      setFeedback('')
    } else {
      setError(err.response?.data?.detail || defaultMsg)
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (formData.job_description.length < 50) {
      setError('La descripción debe tener al menos 50 caracteres.')
      return
    }
    setError(null)
    setGenerating(true)
    try {
      const result = await vacanciesService.generateVacancy(formData)
      setDraft(result)
      setPhase('review')
    } catch (err) {
      handleApiError(err, 'Error al generar con IA. Por favor, intenta de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  const handleStartRegenerate = (part) => {
    setRegenerating(part)
    setFeedback('')
    setError(null)
  }

  const handleCancelRegenerate = () => {
    setRegenerating(null)
    setFeedback('')
  }

  const handleSubmitRegeneration = async () => {
    setError(null)
    setRegenerateLoading(true)
    try {
      const payload = { parts: [regenerating] }
      if (feedback.trim()) payload.feedback = feedback.trim()
      const result = await vacanciesService.regenerateVacancyParts(draft.thread_id, payload)
      const part = regenerating
      setDraft(result)
      setRegenerating(null)
      setFeedback('')
      setHighlightedCard(part)
      setTimeout(() => setHighlightedCard(null), 1500)
    } catch (err) {
      handleApiError(err, 'Error al regenerar. Intenta de nuevo.')
    } finally {
      setRegenerateLoading(false)
    }
  }

  const handleApprove = async () => {
    setError(null)
    setApproving(true)
    try {
      await vacanciesService.approveVacancy(draft.thread_id)
      navigate('/admin/vacantes')
    } catch (err) {
      handleApiError(err, 'Error al guardar la vacante. Intenta de nuevo.')
      setApproving(false)
    }
  }

  const handleReset = () => {
    if (!window.confirm('¿Deseas descartar el borrador y empezar de nuevo?')) return
    setPhase('input')
    setDraft(null)
    setError(null)
    setRegenerating(null)
    setFeedback('')
    setExpanded(false)
  }

  const handleCancel = () => {
    if (draft && !window.confirm('Tienes un borrador sin aprobar. ¿Estás seguro de que quieres salir?')) return
    navigate('/admin/vacantes')
  }

  const cardClass = (part) =>
    `${styles.card} ${highlightedCard === part ? styles.cardHighlight : ''}`

  // ── Render: Input phase ────────────────────────────────────────────────────

  if (phase === 'input' && generating) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Generar Vacante con IA</h1>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>
            Generando vacante con IA... esto puede tardar unos segundos.
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'input') {
    const charLen = formData.job_description.length
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Generar Vacante con IA</h1>
        </div>

        {error && <p className={styles.errorBanner}>{error}</p>}

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleGenerate}>
            <div className={styles.field}>
              <label className={styles.label}>
                Descripción del puesto <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                rows={6}
                value={formData.job_description}
                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                placeholder="Pega o escribe la descripción del puesto de trabajo..."
              />
              <span className={charLen >= 50 ? styles.charCount : styles.charCountError}>
                {charLen}/50 caracteres mínimos
              </span>
            </div>

            <div className={styles.numberRow}>
              <div className={styles.field}>
                <label className={styles.label}>Número de preguntas</label>
                <input
                  className={styles.input}
                  type="number"
                  min={5}
                  max={20}
                  value={formData.num_questions}
                  onChange={(e) => setFormData({ ...formData, num_questions: Number(e.target.value) })}
                />
                <span className={styles.charCount}>5–20 (default 12)</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Preguntas por entrevista</label>
                <input
                  className={styles.input}
                  type="number"
                  min={3}
                  max={10}
                  value={formData.questions_per_interview}
                  onChange={(e) => setFormData({ ...formData, questions_per_interview: Number(e.target.value) })}
                />
                <span className={styles.charCount}>3–10 (default 5)</span>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.btnCancel} onClick={handleCancel}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={charLen < 50}>
                Generar con IA
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── Render: Review phase ───────────────────────────────────────────────────

  const promptPreview = draft.evaluation_prompt.length > 200
    ? draft.evaluation_prompt.slice(0, draft.evaluation_prompt.lastIndexOf(' ', 200)) + '...'
    : draft.evaluation_prompt

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Borrador de Vacante</h1>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {/* Title card */}
      <div className={cardClass('title')} aria-busy={regenerating === 'title' && regenerateLoading}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Título</h3>
          <button
            className={styles.btnRegenerate}
            onClick={() => handleStartRegenerate('title')}
            disabled={regenerateLoading}
          >
            Refinar título ↻
          </button>
        </div>
        <p className={styles.titleText}>{draft.title}</p>
      </div>

      {/* Questions card */}
      <div className={cardClass('questions')} aria-busy={regenerating === 'questions' && regenerateLoading}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Preguntas</h3>
          <button
            className={styles.btnRegenerate}
            onClick={() => handleStartRegenerate('questions')}
            disabled={regenerateLoading}
          >
            Refinar preguntas ↻
          </button>
        </div>
        <span className={styles.badge}>
          {draft.questions.length} preguntas generadas, {draft.questions_per_interview} por entrevista
        </span>
        <ol className={styles.questionsList}>
          {draft.questions.map((q, i) => (
            <li key={i} className={styles.questionItem}>{q}</li>
          ))}
        </ol>
      </div>

      {/* Evaluation prompt card */}
      <div className={cardClass('evaluation_prompt')} aria-busy={regenerating === 'evaluation_prompt' && regenerateLoading}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Prompt de Evaluación</h3>
          <button
            className={styles.btnRegenerate}
            onClick={() => handleStartRegenerate('evaluation_prompt')}
            disabled={regenerateLoading}
          >
            Refinar prompt ↻
          </button>
        </div>
        <p className={styles.promptText}>
          {expanded ? draft.evaluation_prompt : promptPreview}
        </p>
        {draft.evaluation_prompt.length > 200 && (
          <button className={styles.toggleBtn} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>

      {/* Feedback section */}
      {regenerating && (
        <div className={styles.feedbackSection}>
          <p className={styles.feedbackTitle}>
            Refinando: {regenerating === 'title' ? 'título' : regenerating === 'questions' ? 'preguntas' : 'prompt de evaluación'}
          </p>
          <textarea
            className={styles.textarea}
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe qué cambios quieres (ej: haz la pregunta 3 más técnica, enfoca más en liderazgo, simplifica el lenguaje...)"
            disabled={regenerateLoading}
          />
          <div className={styles.feedbackActions}>
            <button
              className={styles.btnCancel}
              onClick={handleCancelRegenerate}
              disabled={regenerateLoading}
            >
              Cancelar
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleSubmitRegeneration}
              disabled={regenerateLoading}
            >
              {regenerateLoading ? 'Refinando...' : 'Aplicar cambios'}
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className={styles.actionBar}>
        <button className={styles.btnGhost} onClick={handleReset}>
          Volver a empezar
        </button>
        <div className={styles.actionBarRight}>
          <button className={styles.btnCancel} onClick={handleCancel}>
            Cancelar
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleApprove}
            disabled={approving || regenerateLoading}
          >
            {approving ? 'Guardando...' : 'Aprobar y crear vacante'}
          </button>
        </div>
      </div>
    </div>
  )
}
