import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApply } from '../../context/ApplyContext'
import { portalService } from '../../services/portal'
import CandidateHeader from '../../components/CandidateHeader/CandidateHeader'
import styles from './StepTwo.module.css'

const REC_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PREVIEW: 'preview',
}

export default function Interview() {
  const navigate = useNavigate()
  const { applicationData, resetApplication } = useApply()

  const questions = applicationData?.questions || []
  const invitationId = applicationData?.invitation_id

  // Navigation
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('question') // 'question' | 'summary'

  // Per-question answers: { [question_id]: { blob, skipped, submitted } }
  const [answers, setAnswers] = useState({})

  // Recording state
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
    if (!applicationData || !invitationId || questions.length === 0) {
      navigate('/apply/invitations')
    }
  }, [applicationData, invitationId, questions.length, navigate])

  // Start camera preview in idle state
  useEffect(() => {
    if (phase !== 'question' || recStatus !== REC_STATUS.IDLE) return
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [phase, recStatus, currentIndex])

  const stopStreamAndReset = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null
    if (videoUrl) URL.revokeObjectURL(videoUrl)
  }, [videoUrl])

  const resetRecordingState = useCallback(() => {
    setRecStatus(REC_STATUS.IDLE)
    setVideoBlob(null)
    setVideoUrl(null)
  }, [])

  // ── Recording controls ────────────────────────────────────────────────────

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
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null
  }

  const handleReRecord = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoBlob(null)
    setVideoUrl(null)
    setRecStatus(REC_STATUS.IDLE)
  }

  // ── Submit answer and advance ─────────────────────────────────────────────

  const submitAndAdvance = async (questionId, blob) => {
    setSubmitError(null)
    try {
      await portalService.submitAnswer(invitationId, questionId, blob || null)
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { blob, skipped: !blob, submitted: true },
      }))
      return true
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Error al enviar la respuesta.')
      return false
    }
  }

  const goNext = useCallback(async (blob) => {
    const currentQuestion = questions[currentIndex]
    if (!currentQuestion) return

    const ok = await submitAndAdvance(currentQuestion.id, blob)
    if (!ok) return

    stopStreamAndReset()
    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      setPhase('summary')
    } else {
      setCurrentIndex(nextIndex)
      resetRecordingState()
    }
  }, [currentIndex, questions, invitationId, stopStreamAndReset, resetRecordingState])

  const currentQuestion = questions[currentIndex]

  const handleSkip = () => goNext(null)

  const handleSave = () => goNext(videoBlob)

  const handleGoNext = () => {
    if (recStatus === REC_STATUS.PREVIEW && videoBlob) {
      goNext(videoBlob)
    } else {
      goNext(null)
    }
  }

  const handleBack = () => {
    stopStreamAndReset()
    if (phase === 'summary') {
      // Can't go back once answers are submitted one-by-one
      // Just show summary
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      resetRecordingState()
    }
  }

  // ── Complete interview ────────────────────────────────────────────────────

  const handleComplete = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await portalService.completeInterview(invitationId)
      resetApplication()
      navigate('/apply/thanks')
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Error al completar la entrevista.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!applicationData || questions.length === 0) return null

  const isLastQuestion = currentIndex === questions.length - 1

  // ── Summary screen ────────────────────────────────────────────────────────

  if (phase === 'summary') {
    return (
      <div className={styles.page}>
        <CandidateHeader />
        <main className={styles.main}>
          <div className={styles.container}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Vacante: <span className={styles.vacancyName}>{applicationData.vacancy_name}</span>
              </h2>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Resumen de respuestas</h3>
              <ul className={styles.summaryList}>
                {questions.map((q, i) => {
                  const answer = answers[q.id]
                  const skipped = !answer || answer.skipped
                  return (
                    <li key={q.id} className={styles.summaryItem}>
                      <span className={styles.summaryQuestion}>
                        {i + 1}. {q.text}
                      </span>
                      {skipped ? (
                        <span className={`${styles.badge} ${styles.badgeSkipped}`}>Saltada</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeAnswered}`}>Respondida</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <div className={styles.summaryActions}>
              <button
                className={styles.btnSubmit}
                onClick={handleComplete}
                disabled={submitting}
              >
                {submitting ? 'Finalizando...' : 'Finalizar entrevista'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Question screen ───────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <CandidateHeader />
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Vacante: <span className={styles.vacancyName}>{applicationData.vacancy_name}</span>
            </h2>
          </section>

          <section className={styles.section}>
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

            <div className={styles.questionCard}>
              {currentQuestion?.text}
            </div>

            <div className={styles.recorderArea}>
              {recStatus !== REC_STATUS.PREVIEW && (
                <video
                  ref={videoPreviewRef}
                  className={styles.videoEl}
                  autoPlay
                  muted
                  playsInline
                />
              )}
              {recStatus === REC_STATUS.PREVIEW && videoUrl && (
                <video
                  ref={videoPlaybackRef}
                  className={styles.videoEl}
                  src={videoUrl}
                  controls
                  playsInline
                />
              )}
              {recStatus === REC_STATUS.RECORDING && (
                <div className={styles.recordingBadgeWrap}>
                  <span className={styles.recordingBadge}>Grabando...</span>
                </div>
              )}

              <div className={styles.controls}>
                {recStatus === REC_STATUS.IDLE && (
                  <button className={styles.btnRecord} onClick={handleStartRecording}>
                    Iniciar grabación
                  </button>
                )}
                {recStatus === REC_STATUS.RECORDING && (
                  <button className={styles.btnStop} onClick={handleStopRecording}>
                    Detener
                  </button>
                )}
                {recStatus === REC_STATUS.PREVIEW && (
                  <button className={styles.btnReRecord} onClick={handleReRecord}>
                    Volver a grabar
                  </button>
                )}
              </div>
            </div>

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <div className={styles.navRow}>
              <button
                className={styles.btnNavPrev}
                onClick={handleBack}
                disabled={currentIndex === 0}
              >
                Anterior
              </button>
              <button
                className={isLastQuestion ? styles.btnApply : styles.btnNavNext}
                onClick={handleGoNext}
              >
                {isLastQuestion ? 'Finalizar' : 'Siguiente'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
