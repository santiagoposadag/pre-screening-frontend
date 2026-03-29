import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import trainingService from '../../../services/training'

export default function TrainingSessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      const s = await trainingService.getSession(id)
      setSession(s)
      if (s.status === 'evaluated') {
        const ev = await trainingService.getEvaluation(id)
        setEvaluation(ev)
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleEvaluate = async () => {
    setEvaluating(true); setError(null)
    try {
      const ev = await trainingService.evaluateSession(id)
      setEvaluation(ev)
      load()
    } catch (err) { setError(err.response?.data?.detail || 'Error al evaluar') }
    finally { setEvaluating(false) }
  }

  if (loading) return <p style={{ padding: 32 }}>Cargando...</p>
  if (!session) return <p style={{ padding: 32 }}>Sesión no encontrada</p>

  const overallEval = evaluation?.find(e => !e.topic_id)
  const topicEvals = evaluation?.filter(e => e.topic_id) || []

  const levelColor = (level) => {
    if (level === 'Avanzado') return { bg: '#D1FAE5', color: '#065F46' }
    if (level === 'Intermedio') return { bg: '#FEF3C7', color: '#92400E' }
    return { bg: '#FEE2E2', color: '#991B1B' }
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 14 }}>&larr; Volver</button>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Sesión de {session.student_name}</h1>
      <p style={{ color: '#64748B', marginBottom: 4 }}>{session.email} &middot; {session.program_name}</p>
      <p style={{ color: '#64748B', marginBottom: 24 }}>
        Estado: <span style={{ fontWeight: 600 }}>{session.status}</span> &middot;
        Respuestas: {session.answers?.length || 0}
      </p>

      {error && <p style={{ color: '#DC2626', marginBottom: 16 }}>{error}</p>}

      {session.status === 'completed' && !evaluation && (
        <button onClick={handleEvaluate} disabled={evaluating} style={{ padding: '12px 28px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 24 }}>
          {evaluating ? 'Evaluando con IA... (puede tomar 1-2 min)' : 'Evaluar con IA'}
        </button>
      )}

      {overallEval && (
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #BBF7D0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Evaluación General</h2>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#059669' }}>{overallEval.score}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>/10</div>
            </div>
            <div>
              <span style={{ padding: '4px 14px', borderRadius: 12, fontSize: 14, background: levelColor(overallEval.knowledge_level).bg, color: levelColor(overallEval.knowledge_level).color, fontWeight: 600 }}>
                {overallEval.knowledge_level}
              </span>
            </div>
          </div>
          <p style={{ lineHeight: 1.6, marginBottom: 12 }}>{overallEval.feedback}</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <strong style={{ fontSize: 13 }}>Fortalezas:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{overallEval.strengths?.map((s, i) => <li key={i} style={{ fontSize: 14, color: '#065F46' }}>{s}</li>)}</ul>
            </div>
            <div>
              <strong style={{ fontSize: 13 }}>Brechas:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{overallEval.gaps?.map((g, i) => <li key={i} style={{ fontSize: 14, color: '#991B1B' }}>{g}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {topicEvals.map(ev => (
        <div key={ev.id} style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700 }}>{ev.topic_name}</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{ev.score}</span>
              <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 12, background: levelColor(ev.knowledge_level).bg, color: levelColor(ev.knowledge_level).color }}>
                {ev.knowledge_level}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>{ev.feedback}</p>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <div><strong>Fortalezas:</strong> {ev.strengths?.join(', ')}</div>
            <div><strong>Brechas:</strong> {ev.gaps?.join(', ')}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
