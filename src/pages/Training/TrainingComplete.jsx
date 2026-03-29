import { useNavigate } from 'react-router-dom'

export default function TrainingComplete() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Evaluación completada</h1>
        <p style={{ color: '#64748B', lineHeight: 1.6, marginBottom: 12 }}>
          Tus respuestas han sido registradas exitosamente. El equipo evaluará tus respuestas y recibirás los resultados.
        </p>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginTop: 24, textAlign: 'left', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Proceso de evaluación</h3>
          <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 2 }}>
            <li>Tus respuestas en video serán transcritas automáticamente</li>
            <li>Una IA evaluará tu conocimiento por cada tema</li>
            <li>Recibirás una calificación por tema y una evaluación general</li>
          </ol>
        </div>
        <button onClick={() => navigate('/training')} style={{ marginTop: 32, padding: '14px 32px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
