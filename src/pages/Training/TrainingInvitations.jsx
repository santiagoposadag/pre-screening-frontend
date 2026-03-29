import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTraining } from '../../context/TrainingContext'
import { portalService } from '../../services/portal'
import trainingService from '../../services/training'

export default function TrainingInvitations() {
  const navigate = useNavigate()
  const { setTrainingData } = useTraining()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!portalService.isAuthenticated()) {
      navigate('/training')
      return
    }
    trainingService.getStudentInvitations()
      .then(setInvitations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [navigate])

  const handleStart = async (inv) => {
    setStarting(inv.id); setError(null)
    try {
      const data = await trainingService.startSession(inv.id)
      setTrainingData({
        program_id: inv.program_id,
        program_name: inv.program_name,
        invitation_id: inv.id,
        session_id: data.session_id,
        topics: data.topics,
      })
      navigate('/training/assessment')
    } catch (err) { setError(err.response?.data?.detail || 'Error al iniciar') }
    finally { setStarting(null) }
  }

  const handleLogout = () => {
    portalService.logout()
    navigate('/training')
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Cargando...</p></div>

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <header style={{ background: '#fff', padding: '16px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>S</div>
          <span style={{ fontWeight: 700 }}>Portal de Formación</span>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cerrar sesión</button>
      </header>

      <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Mis evaluaciones pendientes</h1>
        <p style={{ color: '#64748B', marginBottom: 24 }}>Selecciona una evaluación para comenzar</p>

        {error && <p style={{ color: '#DC2626', marginBottom: 16 }}>{error}</p>}

        {invitations.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <p style={{ color: '#94A3B8' }}>No tienes evaluaciones pendientes.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {invitations.map(inv => (
              <div key={inv.id} style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{inv.program_name}</h3>
                  <p style={{ color: '#64748B', fontSize: 14 }}>Recibida: {new Date(inv.created_at).toLocaleDateString('es-CO')}</p>
                </div>
                <button onClick={() => handleStart(inv)} disabled={starting === inv.id} style={{ padding: '10px 24px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, opacity: starting === inv.id ? 0.6 : 1 }}>
                  {starting === inv.id ? 'Iniciando...' : 'Comenzar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
