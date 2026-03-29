import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import trainingService from '../../../services/training'

export default function GenerateTrainingProgram() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('input')
  const [form, setForm] = useState({ program_description: '', num_topics: 5, questions_per_topic: 4 })
  const [draft, setDraft] = useState(null)
  const [threadId, setThreadId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refining, setRefining] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(null)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const data = await trainingService.generateProgram(form)
      setDraft(data); setThreadId(data.thread_id); setPhase('review')
    } catch (err) { setError(err.response?.data?.detail || 'Error al generar') }
    finally { setLoading(false) }
  }

  const handleRegenerate = async (part) => {
    setRefining(part); setError(null)
    try {
      const data = await trainingService.regenerateParts(threadId, { parts: [part], feedback })
      setDraft(data); setFeedback('')
    } catch (err) { setError(err.response?.data?.detail || 'Error') }
    finally { setRefining(null) }
  }

  const handleApprove = async () => {
    setLoading(true); setError(null)
    try {
      await trainingService.approveGeneration(threadId)
      setPhase('done')
    } catch (err) { setError(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  if (phase === 'done') {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Programa creado exitosamente</h2>
        <p style={{ color: '#64748B', marginBottom: 24 }}>El programa de formación con sus temas y preguntas ha sido guardado.</p>
        <button onClick={() => navigate('/admin/formaciones')} style={{ padding: '12px 28px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Ver programas</button>
      </div>
    )
  }

  if (phase === 'review' && draft) {
    return (
      <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Revisar programa generado</h1>
        {error && <p style={{ color: '#DC2626', marginBottom: 16 }}>{error}</p>}

        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16 }}>Nombre del programa</h3>
            <button onClick={() => handleRegenerate('name')} disabled={!!refining} style={{ padding: '6px 14px', background: '#EEF2FF', color: '#4338CA', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              {refining === 'name' ? 'Refinando...' : 'Refinar'}
            </button>
          </div>
          <p style={{ fontSize: 18 }}>{draft.name}</p>
        </div>

        {draft.topics?.map((topic, i) => (
          <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Tema {i + 1}: {topic.name}</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 8 }}>{topic.description}</p>
            <p style={{ fontSize: 13, color: '#6366F1', marginBottom: 12 }}><strong>Criterios:</strong> {topic.evaluation_criteria}</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {topic.questions.map((q, j) => (
                <li key={j} style={{ marginBottom: 6, lineHeight: 1.4 }}>{q}</li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16 }}>Prompt de evaluación</h3>
            <button onClick={() => handleRegenerate('evaluation_prompt')} disabled={!!refining} style={{ padding: '6px 14px', background: '#EEF2FF', color: '#4338CA', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              {refining === 'evaluation_prompt' ? 'Refinando...' : 'Refinar'}
            </button>
          </div>
          <p style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{draft.evaluation_prompt}</p>
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Feedback para refinamiento (opcional)</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} placeholder="Instrucciones adicionales..." style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical' }} />
          <button onClick={() => handleRegenerate('topics')} disabled={!!refining} style={{ marginTop: 8, padding: '8px 16px', background: '#EEF2FF', color: '#4338CA', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            {refining === 'topics' ? 'Refinando temas...' : 'Regenerar todos los temas'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => setPhase('input')} style={{ padding: '12px 24px', background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Volver</button>
          <button onClick={handleApprove} disabled={loading} style={{ padding: '12px 28px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Guardando...' : 'Aprobar y guardar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Generar programa con IA</h1>
      <p style={{ color: '#64748B', marginBottom: 24 }}>Describe el programa de formación y la IA generará los temas, preguntas y criterios de evaluación.</p>

      {error && <p style={{ color: '#DC2626', marginBottom: 16 }}>{error}</p>}

      <form onSubmit={handleGenerate}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Descripción del programa</label>
          <textarea value={form.program_description} onChange={e => setForm({...form, program_description: e.target.value})} rows={6} required minLength={50} placeholder="Describe el programa de formación, sus objetivos, los conceptos que se deben evaluar..." style={{ width: '100%', padding: 12, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical' }} />
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{form.program_description.length}/50 caracteres mínimo</p>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Número de temas</label>
            <input type="number" min={2} max={10} value={form.num_topics} onChange={e => setForm({...form, num_topics: parseInt(e.target.value) || 5})} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Preguntas por tema</label>
            <input type="number" min={2} max={8} value={form.questions_per_topic} onChange={e => setForm({...form, questions_per_topic: parseInt(e.target.value) || 4})} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box' }} />
          </div>
        </div>

        <button type="submit" disabled={loading || form.program_description.length < 50} style={{ width: '100%', padding: '14px 28px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16, opacity: loading || form.program_description.length < 50 ? 0.6 : 1 }}>
          {loading ? 'Generando con IA...' : 'Generar programa'}
        </button>
      </form>
    </div>
  )
}
