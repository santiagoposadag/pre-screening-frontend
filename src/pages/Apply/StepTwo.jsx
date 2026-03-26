import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApply } from '../../context/ApplyContext'
import { questionsService } from '../../services/questions'
import { applicationsService } from '../../services/applications'
import styles from './StepTwo.module.css'

const REC_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PREVIEW: 'preview',
}

export default function StepTwo() {
  const navigate = useNavigate()
  const { applicationData } = useApply()

  // Questions
  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [questionsError, setQuestionsError] = useState(null)

  // Navigation
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('question') // 'question' | 'summary'

  // Per-question answers: { [question_id]: { blob: Blob|null, skipped: boolean } }
  const [answers, setAnswers] = useState({})

  // Recording state — reset on each question change
  const [recStatus, setRecStatus] = useState(REC_STATUS.IDLE)
  const [videoBlob, setVideoBlob] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Refs
  const videoPreviewRef = useRef(null)
  const videoPlaybackRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  useEffect(() => {
    if (!applicationData) {
      navigate('/')
      return
    }
    questionsService
      .getAll(applicationData.vacancy_id)
      .then((data) => {
        setQuestions(data)
        if (data.length === 0) setPhase('summary')
      })
      .catch(() => setQuestionsError('No se pudieron cargar las preguntas.'))
      .finally(() => setLoadingQuestions(false))
  }, [applicationData, navigate])

  // Start camera preview whenever we are in idle phase on a question screen
  useEffect(() => {
    if (phase !== 'question' || recStatus !== REC_STATUS.IDLE) return

    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream
        }
      })
      .catch(() => {
        // Camera access denied — we still show the UI; recording will fail gracefully
      })

    return () => {
      cancelled = true
    }
  }, [phase, recStatus, currentIndex])

  const stopStreamAndReset = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  const resetRecordingState = useCallback(() => {
    setRecStatus(REC_STATUS.IDLE)
    setVideoBlob(null)
    setVideoUrl(null)
  }, [])

  // ── Recording controls ──────────────────────────────────────────────────────

  const handleStartRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    mediaRecorderRef.current = new MediaRecorder(streamRef.current)
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      setRecStatus(REC_STATUS.PREVIEW)
    }
    mediaRecorderRef.current.start()
    setRecStatus(REC_STATUS.RECORDING)
  }

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
  }

  const handleReRecord = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoBlob(null)
    setVideoUrl(null)
    setRecStatus(REC_STATUS.IDLE)
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    stopStreamAndReset()
    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      setPhase('summary')
    } else {
      setCurrentIndex(nextIndex)
      resetRecordingState()
    }
  }, [currentIndex, questions.length, stopStreamAndReset, resetRecordingState])

  const currentQuestion = questions[currentIndex]

  const handleSkip = () => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { blob: null, skipped: true },
    }))
    goNext()
  }

  const handleSave = () => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { blob: videoBlob, skipped: false },
    }))
    goNext()
  }

  const handleBack = () => {
    stopStreamAndReset()
    if (phase === 'summary') {
      setCurrentIndex(questions.length - 1)
      setPhase('question')
      resetRecordingState()
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      resetRecordingState()
    }
  }

  const isLastQuestion = currentIndex === questions.length - 1

  // → arrow: saves if there's a recorded video, otherwise marks as skipped, then advances
  const handleGoNext = () => {
    if (!currentQuestion) return
    if (recStatus === REC_STATUS.PREVIEW && videoBlob) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: { blob: videoBlob, skipped: false },
      }))
    } else {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: { blob: null, skipped: true },
      }))
    }
    goNext()
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!applicationData) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const formData = new FormData()
      formData.append('full_name', applicationData.full_name)
      formData.append('email', applicationData.email)
      formData.append('vacancy_id', applicationData.vacancy_id)

      const questionIds = questions.map((q) => q.id)
      formData.append('question_ids', JSON.stringify(questionIds))

      for (const q of questions) {
        const answer = answers[q.id]
        if (answer && !answer.skipped && answer.blob) {
          formData.append(`video_q${q.id}`, answer.blob, `q${q.id}.webm`)
        }
      }

      await applicationsService.submit(formData)
      navigate('/apply/thanks')
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail || 'Error al enviar la aplicación. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!applicationData) return null

  if (loadingQuestions) {
    return (
      <div className={styles.page}>
        <AppHeader applicationData={applicationData} />
        <main className={styles.main}>
          <p className={styles.statusText}>Cargando preguntas...</p>
        </main>
      </div>
    )
  }

  if (questionsError) {
    return (
      <div className={styles.page}>
        <AppHeader applicationData={applicationData} />
        <main className={styles.main}>
          <p className={styles.errorText}>{questionsError}</p>
        </main>
      </div>
    )
  }

  // ── Summary screen ──────────────────────────────────────────────────────────

  if (phase === 'summary') {
    return (
      <div className={styles.page}>
        <AppHeader applicationData={applicationData} />
        <main className={styles.main}>
          <div className={styles.container}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Vacante: <span className={styles.vacancyName}>{applicationData.vacancy_name}</span>
              </h2>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Resumen de respuestas</h3>
              {questions.length === 0 ? (
                <p className={styles.statusText}>Esta vacante no tiene preguntas de video.</p>
              ) : (
                <ul className={styles.summaryList}>
                  {questions.map((q, i) => {
                    const answer = answers[q.id]
                    const skipped = !answer || answer.skipped
                    return (
                      <li key={q.id ?? i} className={styles.summaryItem}>
                        <span className={styles.summaryQuestion}>
                          {i + 1}. {q.text || q.texto || q.question}
                        </span>
                        {skipped ? (
                          <span className={`${styles.badge} ${styles.badgeSkipped}`}>Saltada</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeAnswered}`}>
                            Respondida ✓
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <div className={styles.summaryActions}>
              {questions.length > 0 && (
                <button className={styles.btnBack} onClick={handleBack}>
                  ← Volver
                </button>
              )}
              <button
                className={styles.btnSubmit}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar aplicación'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Question screen ─────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <AppHeader applicationData={applicationData} />
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Vacante: <span className={styles.vacancyName}>{applicationData.vacancy_name}</span>
            </h2>
          </section>

          <section className={styles.section}>
            {/* Progress */}
            <p className={styles.questionCounter}>
              Pregunta {currentIndex + 1} de {questions.length}
            </p>
            <div className={styles.progressDots}>
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>

            {/* Question card */}
            <div className={styles.questionCard}>
              {currentQuestion?.text || currentQuestion?.texto || currentQuestion?.question}
            </div>

            {/* Recorder area */}
            <div className={styles.recorderArea}>
              {/* Camera preview — shown in idle and recording */}
              {recStatus !== REC_STATUS.PREVIEW && (
                <video
                  ref={videoPreviewRef}
                  className={styles.videoEl}
                  autoPlay
                  muted
                  playsInline
                />
              )}

              {/* Playback — shown only in preview */}
              {recStatus === REC_STATUS.PREVIEW && videoUrl && (
                <video
                  ref={videoPlaybackRef}
                  className={styles.videoEl}
                  src={videoUrl}
                  controls
                  playsInline
                />
              )}

              {/* Recording badge */}
              {recStatus === REC_STATUS.RECORDING && (
                <div className={styles.recordingBadgeWrap}>
                  <span className={styles.recordingBadge}>● Grabando...</span>
                </div>
              )}

              {/* Recording controls */}
              <div className={styles.controls}>
                {recStatus === REC_STATUS.IDLE && (
                  <button className={styles.btnRecord} onClick={handleStartRecording}>
                    ● Iniciar grabación
                  </button>
                )}
                {recStatus === REC_STATUS.RECORDING && (
                  <button className={styles.btnStop} onClick={handleStopRecording}>
                    ■ Detener
                  </button>
                )}
                {recStatus === REC_STATUS.PREVIEW && (
                  <button className={styles.btnReRecord} onClick={handleReRecord}>
                    ↺ Volver a grabar
                  </button>
                )}
              </div>
            </div>

            {/* Navigation arrows */}
            <div className={styles.navRow}>
              <button
                className={styles.btnNavPrev}
                onClick={handleBack}
                disabled={currentIndex === 0}
              >
                ← Anterior
              </button>
              <button
                className={isLastQuestion ? styles.btnApply : styles.btnNavNext}
                onClick={handleGoNext}
              >
                {isLastQuestion ? 'Aplicar a la vacante →' : 'Siguiente →'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

// ── Shared header subcomponent ─────────────────────────────────────────────────
function AppHeader({ applicationData }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Sofka</span>
          <span className={styles.headerTitle}>Prescreening</span>
        </div>
        <span className={styles.candidateName}>{applicationData.full_name}</span>
      </div>
    </header>
  )
}
