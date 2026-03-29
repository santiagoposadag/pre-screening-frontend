import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import trainingService from '../../../services/training'

export default function TrainingPrograms() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const data = await trainingService.getPrograms()
      setPrograms(data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await trainingService.createProgram(form)
      setShowCreate(false)
      setForm({ name: '', description: '' })
      load()
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este programa?')) return
    try { await trainingService.deleteProgram(id); load() } catch {}
  }

  if (loading) return <p style={{ padding: 32 }}>Cargando...</p>

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Programas de Formación</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/admin/formaciones/generar')} style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Generar con IA
          </button>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Crear programa
          </button>
        </div>
      </div>

      {programs.length === 0 ? (
        <p style={{ color: '#64748B' }}>No hay programas aún.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>ID</th>
              <th style={{ padding: '12px 16px' }}>Nombre</th>
              <th style={{ padding: '12px 16px' }}>Estado</th>
              <th style={{ padding: '12px 16px' }}>Creado</th>
              <th style={{ padding: '12px 16px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {programs.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #E2E8F0', cursor: 'pointer' }} onClick={() => navigate(`/admin/formaciones/${p.id}`)}>
                <td style={{ padding: '12px 16px' }}>{p.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 13, background: p.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: p.status === 'active' ? '#065F46' : '#991B1B' }}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{new Date(p.created_at).toLocaleDateString('es-CO')}</td>
                <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: '6px 14px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 32, width: 480, maxWidth: '90vw' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Crear Programa</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Nombre</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Descripción</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Guardando...' : 'Crear'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
