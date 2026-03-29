import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalService } from '../../services/portal'

export default function StudentLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // email | code
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await portalService.requestOtp(email)
      setStep('code')
    } catch (err) { setError(err.response?.data?.detail || 'Error al enviar código') }
    finally { setLoading(false) }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await portalService.verifyOtp(email, code)
      navigate('/training/invitations')
    } catch (err) { setError(err.response?.data?.detail || 'Código incorrecto') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ width: 420, background: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#6366F1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', fontWeight: 800, fontSize: 24 }}>S</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Portal de Formación</h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>Ingresa tu email para acceder a tus evaluaciones</p>
        </div>

        {error && <p style={{ color: '#DC2626', textAlign: 'center', marginBottom: 16, fontSize: 14 }}>{error}</p>}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" style={{ width: '100%', padding: 12, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box', fontSize: 16 }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Enviando...' : 'Enviar código OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>Código enviado a <strong>{email}</strong></p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Código de verificación</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} required maxLength={6} placeholder="123456" style={{ width: '100%', padding: 12, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box', fontSize: 20, textAlign: 'center', letterSpacing: 8 }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setCode(''); setError(null) }} style={{ width: '100%', marginTop: 12, padding: 12, background: 'transparent', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 14 }}>
              Cambiar email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
