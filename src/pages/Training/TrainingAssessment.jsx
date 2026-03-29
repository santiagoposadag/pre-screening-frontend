import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTraining } from '../../context/TrainingContext'
import useVideoRecorder, { REC_STATUS } from '../../hooks/useVideoRecorder'
import trainingService from '../../services/training'

export default function TrainingAssessment() {
  const navigate = useNavigate()
  const { trainingData, resetTraining } = useTraining()

  const topics = trainingData?.topics || []
  const sessionId = trainingData?.session_id

  const [currentTopicIdx, setCurrentTopicIdx] = useState(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [completedTopics, setCompletedTopics] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const { recStatus, videoBlob, videoUrl, videoPreviewRef, videoPlaybackRef,
    startCamera, startRecording, stopRecording, reRecord,
    stopStreamAndReset, resetRecordingState } = useVideoRecorder()

  useEffect(() => {
    if (!trainingData || !sessionId || topics.length === 0) {
      navigate('/training/invitations')
    }
  }, [trainingData, sessionId, topics.length, navigate])

  // Start camera when on a question
  useEffect(() => {
    if (currentTopicIdx !== null && recStatus === REC_STATUS.IDLE) {
      startCamera()
    }
  }, [currentTopicIdx, currentQuestionIdx, recStatus, startCamera])

  const currentTopic = currentTopicIdx !== null ? topics[currentTopicIdx] : null
  const currentQuestions = currentTopic?.questions || []
  const currentQuestion = currentQuestions[currentQuestionIdx]

  const submitAndAdvance = useCallback(async (blob) => {
    if (!currentTopic || !currentQuestion) return
    setError(null); setSubmitting(true)
    try {
      await trainingService.submitAnswer(sessionId, currentTopic.id, currentQuestion.id, blob || null)

      stopStreamAndReset()
      const nextIdx = currentQuestionIdx + 1
      if (nextIdx >= currentQuestions.length) {
        // Topic completed
        setCompletedTopics(prev => new Set([...prev, currentTopicIdx]))
        setCurrentTopicIdx(null)
        setCurrentQuestionIdx(0)
        resetRecordingState()
      } else {
        setCurrentQuestionIdx(nextIdx)
        resetRecordingState()
      }
    } catch (err) { setError(err.response?.data?.detail || 'Error al enviar') }
    finally { setSubmitting(false) }
  }, [currentTopic, currentQuestion, currentQuestionIdx, currentQuestions.length, sessionId, stopStreamAndReset, resetRecordingState])

  const handleComplete = async () => {
    setSubmitting(true); setError(null)
    try {
      await trainingService.completeSession(sessionId)
      resetTraining()
      navigate('/training/complete')
    } catch (err) { setError(err.response?.data?.detail || 'Error al finalizar') }
    finally { setSubmitting(false) }
  }

  if (!trainingData || topics.length === 0) return null

  const allTopicsCompleted = completedTopics.size === topics.length

  // Topic picker view
  if (currentTopicIdx === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <header style={{ background: '#fff', padding: '16px 32px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>S</div>
            <span style={{ fontWeight: 700 }}>{trainingData.program_name}</span>
          </div>
        </header>

        <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Temas de evaluación</h1>
          <p style={{ color: '#64748B', marginBottom: 24 }}>Selecciona un tema para responder sus preguntas. Puedes elegir el orden.</p>

          {error && <p style={{ color: '#DC2626', marginBottom: 16 }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topics.map((topic, i) => {
              const done = completedTopics.has(i)
              return (
                <div key={topic.id} style={{ background: '#fff', borderRadius: 12, padding: 20, border: done ? '2px solid #10B981' : '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: done ? 0.7 : 1 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{topic.name}</h3>
                    {topic.description && <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>{topic.description}</p>}
                    <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0' }}>{topic.questions.length} preguntas</p>
                  </div>
                  {done ? (
                    <span style={{ padding: '8px 20px', background: '#D1FAE5', color: '#065F46', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>Completado</span>
                  ) : (
                    <button onClick={() => { setCurrentTopicIdx(i); setCurrentQuestionIdx(0); resetRecordingState() }} style={{ padding: '10px 24px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                      Comenzar
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {allTopicsCompleted && (
            <button onClick={handleComplete} disabled={submitting} style={{ marginTop: 32, width: '100%', padding: 16, background: '#10B981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>
              {submitting ? 'Finalizando...' : 'Finalizar evaluación'}
            </button>
          )}
        </main>
      </div>
    )
  }

  // Question recording view
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <header style={{ background: '#fff', padding: '16px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700 }}>{currentTopic.name}</span>
          <span style={{ color: '#64748B', marginLeft: 12 }}>Pregunta {currentQuestionIdx + 1} de {currentQuestions.length}</span>
        </div>
        <button onClick={() => { stopStreamAndReset(); setCurrentTopicIdx(null); resetRecordingState() }} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Volver a temas
        </button>
      </header>

      <main style={{ maxWidth: 640, margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {currentQuestions.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= currentQuestionIdx ? '#6366F1' : '#E2E8F0' }} />
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: 18, lineHeight: 1.5, fontWeight: 500 }}>{currentQuestion?.text}</p>
        </div>

        <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 20, aspectRatio: '16/9', position: 'relative' }}>
          {recStatus !== REC_STATUS.PREVIEW && (
            <video ref={videoPreviewRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {recStatus === REC_STATUS.PREVIEW && videoUrl && (
            <video ref={videoPlaybackRef} src={videoUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {recStatus === REC_STATUS.RECORDING && (
            <div style={{ position: 'absolute', top: 16, left: 16, background: '#DC2626', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', animation: 'pulse 1s infinite' }} /> Grabando
            </div>
          )}
        </div>

        {error && <p style={{ color: '#DC2626', marginBottom: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          {recStatus === REC_STATUS.IDLE && (
            <button onClick={startRecording} style={{ padding: '12px 28px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Iniciar grabación</button>
          )}
          {recStatus === REC_STATUS.RECORDING && (
            <button onClick={stopRecording} style={{ padding: '12px 28px', background: '#1E293B', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Detener</button>
          )}
          {recStatus === REC_STATUS.PREVIEW && (
            <button onClick={reRecord} style={{ padding: '12px 28px', background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Grabar de nuevo</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <button onClick={() => submitAndAdvance(null)} disabled={submitting} style={{ padding: '12px 24px', background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Saltar pregunta
          </button>
          <button onClick={() => submitAndAdvance(videoBlob)} disabled={submitting || recStatus !== REC_STATUS.PREVIEW} style={{ padding: '12px 28px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, opacity: recStatus !== REC_STATUS.PREVIEW ? 0.5 : 1 }}>
            {submitting ? 'Enviando...' : currentQuestionIdx === currentQuestions.length - 1 ? 'Enviar y completar tema' : 'Enviar y siguiente'}
          </button>
        </div>
      </main>
    </div>
  )
}
