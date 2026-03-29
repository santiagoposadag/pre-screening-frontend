import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import trainingService from '../../../services/training'

export default function TrainingProgramDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteForm, setInviteForm] = useState({ email: '', phone: '' })
  const [inviting, setInviting] = useState(false)
  const [tab, setTab] = useState('topics')

  const load = async () => {
    try {
      const [p, inv] = await Promise.all([
        trainingService.getProgram(id),
        trainingService.getInvitations({ program_id: id }),
      ])
      setProgram(p)
      setInvitations(inv)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    try {
      await trainingService.createInvitation({ program_id: parseInt(id), email: inviteForm.email || null, phone: inviteForm.phone || null })
      setInviteForm({ email: '', phone: '' })
      load()
    } catch {} finally { setInviting(false) }
  }

  if (loading) return <p style={{ padding: 32 }}>Cargando...</p>
  if (!program) return <p style={{ padding: 32 }}>Programa no encontrado</p>

  const tabStyle = (active) => ({
    padding: '10px 20px', border: 'none', borderBottom: active ? '3px solid #6366F1' : '3px solid transparent',
    background: 'transparent', cursor: 'pointer', fontWeight: active ? 700 : 400, color: active ? '#6366F1' : '#64748B',
  })

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate('/admin/formaciones')} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 14 }}>&larr; Volver a programas</button>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{program.name}</h1>
      <p style={{ color: '#64748B', marginBottom: 24 }}>{program.description}</p>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
        <button style={tabStyle(tab === 'topics')} onClick={() => setTab('topics')}>Temas ({program.topics?.length || 0})</button>
        <button style={tabStyle(tab === 'invitations')} onClick={() => setTab('invitations')}>Invitaciones ({invitations.length})</button>
        <button style={tabStyle(tab === 'sessions')} onClick={() => setTab('sessions')}>Sesiones</button>
      </div>

      {tab === 'topics' && (
        <div>
          {program.topics?.map((topic, i) => (
            <div key={topic.id} style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{i + 1}. {topic.name}</h3>
              {topic.description && <p style={{ color: '#64748B', fontSize: 14, marginBottom: 8 }}>{topic.description}</p>}
              {topic.evaluation_criteria && <p style={{ fontSize: 13, color: '#6366F1', marginBottom: 12 }}><strong>Criterios:</strong> {topic.evaluation_criteria}</p>}
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {topic.questions?.map(q => (
                  <li key={q.id} style={{ marginBottom: 6, lineHeight: 1.4 }}>{q.text}</li>
                ))}
              </ul>
              {topic.questions_per_topic && <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>Preguntas por evaluación: {topic.questions_per_topic}</p>}
            </div>
          ))}
          {(!program.topics || program.topics.length === 0) && <p style={{ color: '#94A3B8' }}>No hay temas configurados.</p>}
        </div>
      )}

      {tab === 'invitations' && (
        <div>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email</label>
              <input value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} placeholder="estudiante@email.com" style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Teléfono</label>
              <input value={inviteForm.phone} onChange={e => setInviteForm({...inviteForm, phone: e.target.value})} placeholder="+57..." style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={inviting || (!inviteForm.email && !inviteForm.phone)} style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {inviting ? 'Enviando...' : 'Invitar'}
            </button>
          </form>

          {invitations.length === 0 ? <p style={{ color: '#94A3B8' }}>Sin invitaciones.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Email/Teléfono</th>
                  <th style={{ padding: '10px 12px' }}>Estado</th>
                  <th style={{ padding: '10px 12px' }}>Creada</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px' }}>{inv.email || inv.phone}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 12,
                        background: inv.status === 'completed' ? '#D1FAE5' : inv.status === 'pending' ? '#FEF3C7' : '#E0E7FF',
                        color: inv.status === 'completed' ? '#065F46' : inv.status === 'pending' ? '#92400E' : '#3730A3' }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{new Date(inv.created_at).toLocaleDateString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'sessions' && <TrainingSessionsTab programId={id} />}
    </div>
  )
}

function TrainingSessionsTab({ programId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    trainingService.getSessions({ program_id: programId })
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [programId])

  if (loading) return <p>Cargando sesiones...</p>
  if (sessions.length === 0) return <p style={{ color: '#94A3B8' }}>Sin sesiones aún.</p>

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
          <th style={{ padding: '10px 12px' }}>Estudiante</th>
          <th style={{ padding: '10px 12px' }}>Email</th>
          <th style={{ padding: '10px 12px' }}>Estado</th>
          <th style={{ padding: '10px 12px' }}>Inicio</th>
          <th style={{ padding: '10px 12px' }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map(s => (
          <tr key={s.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.student_name}</td>
            <td style={{ padding: '10px 12px' }}>{s.email}</td>
            <td style={{ padding: '10px 12px' }}>
              <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 12,
                background: s.status === 'evaluated' ? '#D1FAE5' : s.status === 'completed' ? '#E0E7FF' : '#FEF3C7',
                color: s.status === 'evaluated' ? '#065F46' : s.status === 'completed' ? '#3730A3' : '#92400E' }}>
                {s.status}
              </span>
            </td>
            <td style={{ padding: '10px 12px', color: '#64748B' }}>{new Date(s.started_at).toLocaleDateString('es-CO')}</td>
            <td style={{ padding: '10px 12px' }}>
              <button onClick={() => navigate(`/admin/formaciones/sesiones/${s.id}`)} style={{ padding: '6px 14px', background: '#EEF2FF', color: '#4338CA', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Ver detalle</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
