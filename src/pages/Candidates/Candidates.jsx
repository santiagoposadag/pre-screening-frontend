import { useState } from 'react'
import { useCandidates } from '../../hooks/useCandidates'
import styles from './Candidates.module.css'

const STATUS_LABELS = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  position_applied: '',
  status: 'pending',
  notes: '',
}

export default function Candidates() {
  const { candidates, loading, error, createCandidate, updateCandidate, deleteCandidate } = useCandidates()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (candidate) => {
    setEditing(candidate)
    setForm({
      full_name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone || '',
      position_applied: candidate.position_applied,
      status: candidate.status,
      notes: candidate.notes || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        phone: form.phone || null,
        notes: form.notes || null,
      }
      if (editing) {
        await updateCandidate(editing.id, payload)
      } else {
        await createCandidate(payload)
      }
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este candidato?')) return
    await deleteCandidate(id)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Candidatos</h1>
        <button className={styles.btnPrimary} onClick={openCreate}>
          + Nuevo candidato
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && candidates.length === 0 && (
        <p className={styles.empty}>No hay candidatos aún. ¡Crea el primero!</p>
      )}

      {!loading && candidates.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Puesto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{c.position_applied}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => openEdit(c)}>
                      Editar
                    </button>
                    <button className={styles.btnDanger} onClick={() => handleDelete(c.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Editar candidato' : 'Nuevo candidato'}</h2>
            {formError && <p className={styles.error}>{formError}</p>}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <label className={styles.label}>
                Nombre completo
                <input name="full_name" value={form.full_name} onChange={handleChange} required className={styles.input} />
              </label>
              <label className={styles.label}>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} required className={styles.input} />
              </label>
              <label className={styles.label}>
                Teléfono
                <input name="phone" value={form.phone} onChange={handleChange} className={styles.input} />
              </label>
              <label className={styles.label}>
                Puesto aplicado
                <input name="position_applied" value={form.position_applied} onChange={handleChange} required className={styles.input} />
              </label>
              {editing && (
                <label className={styles.label}>
                  Estado
                  <select name="status" value={form.status} onChange={handleChange} className={styles.input}>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className={styles.label}>
                Notas
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={styles.input} />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
