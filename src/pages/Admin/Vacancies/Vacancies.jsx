import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { vacanciesService } from '../../../services/vacancies'
import styles from './Vacancies.module.css'

const EMPTY_FORM = { name: '', description: '' }

export default function Vacancies() {
  const navigate = useNavigate()
  const [vacancies, setVacancies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingVacancy, setEditingVacancy] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [detailVacancy, setDetailVacancy] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [promptExpanded, setPromptExpanded] = useState(false)

  const fetchVacancies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await vacanciesService.getAll()
      setVacancies(data)
    } catch {
      setError('No se pudieron cargar las vacantes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVacancies()
  }, [fetchVacancies])

  const openCreateModal = () => {
    setEditingVacancy(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (vacancy) => {
    setEditingVacancy(vacancy)
    setFormData({ name: vacancy.name || vacancy.nombre || '', description: vacancy.description || '' })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingVacancy(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('El nombre de la vacante es obligatorio.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = { name: formData.name.trim(), description: formData.description.trim() || null }
      if (editingVacancy) {
        const updated = await vacanciesService.update(editingVacancy.id, payload)
        setVacancies((prev) => prev.map((v) => (v.id === editingVacancy.id ? updated : v)))
      } else {
        const created = await vacanciesService.create(payload)
        setVacancies((prev) => [created, ...prev])
      }
      closeModal()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Error al guardar la vacante.')
    } finally {
      setSaving(false)
    }
  }

  const handleViewDetail = async (vacancyId) => {
    setDetailLoading(true)
    setDetailVacancy(null)
    setPromptExpanded(false)
    try {
      const data = await vacanciesService.getById(vacancyId)
      setDetailVacancy(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar detalle de vacante.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      await vacanciesService.delete(confirmDeleteId)
      setVacancies((prev) => prev.filter((v) => v.id !== confirmDeleteId))
      setConfirmDeleteId(null)
    } catch {
      setError('Error al eliminar la vacante.')
      setConfirmDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Gestion de Vacantes</h1>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className={styles.btnEdit} onClick={() => navigate('/admin/vacantes/generar')}>
                Generar con IA
              </button>
              <button className={styles.btnPrimary} onClick={openCreateModal}>
                + Nueva vacante
              </button>
            </div>
          </div>

          {error && <p className={styles.errorBanner}>{error}</p>}

          {loading ? (
            <p className={styles.statusText}>Cargando vacantes...</p>
          ) : vacancies.length === 0 ? (
            <p className={styles.statusText}>No hay vacantes registradas aun.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>ID</th>
                    <th className={styles.th}>Nombre</th>
                    <th className={styles.th}>Descripción del perfil</th>
                    <th className={`${styles.th} ${styles.thActions}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vacancies.map((v) => (
                    <tr key={v.id} className={styles.tr}>
                      <td className={styles.tdId}>{v.id}</td>
                      <td className={styles.td}>{v.name || v.nombre}</td>
                      <td className={styles.tdDesc}>{v.description || <span style={{color:'#9ca3af'}}>—</span>}</td>
                      <td className={styles.tdActions}>
                        <button className={styles.btnView} onClick={() => handleViewDetail(v.id)}>Ver detalle</button>
                        <button
                          className={styles.btnEdit}
                          onClick={() => openEditModal(v)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDelete}
                          onClick={() => setConfirmDeleteId(v.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {modalOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingVacancy ? 'Editar vacante' : 'Nueva vacante'}
            </h2>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="vacancyName">
                Nombre de vacante <span className={styles.required}>*</span>
              </label>
              <input
                id="vacancyName"
                className={styles.input}
                type="text"
                placeholder="Ej. Desarrollador Backend Senior"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="vacancyDesc">
                Descripción del perfil buscado
              </label>
              <textarea
                id="vacancyDesc"
                className={styles.textarea}
                rows={4}
                placeholder="Ej. Buscamos un desarrollador con 3+ años en Python, experiencia en FastAPI y bases de datos relacionales..."
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            {formError && <p className={styles.formError}>{formError}</p>}

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Confirmar eliminacion</h2>
            <p className={styles.confirmText}>
              Esta accion eliminara la vacante permanentemente. No se puede deshacer.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button className={styles.btnDelete} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(detailVacancy || detailLoading) && (
        <div className={styles.overlay} onClick={() => { setDetailVacancy(null); setDetailLoading(false) }}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <p className={styles.statusText}>Cargando detalle...</p>
            ) : detailVacancy && (
              <>
                <h2 className={styles.modalTitle}>{detailVacancy.name}</h2>

                {detailVacancy.description && (
                  <div className={styles.detailSection}>
                    <p className={styles.detailLabel}>Descripcion</p>
                    <p className={styles.promptText}>{detailVacancy.description}</p>
                  </div>
                )}

                {detailVacancy.questions_per_interview && (
                  <div className={styles.detailSection}>
                    <span className={styles.badge}>{detailVacancy.questions_per_interview} preguntas por entrevista</span>
                  </div>
                )}

                <div className={styles.detailSection}>
                  <p className={styles.detailLabel}>Preguntas ({detailVacancy.questions?.length || 0})</p>
                  {detailVacancy.questions && detailVacancy.questions.length > 0 ? (
                    <ol className={styles.questionsList}>
                      {detailVacancy.questions
                        .sort((a, b) => a.order - b.order)
                        .map((q) => (
                          <li key={q.id} className={styles.questionItem}>{q.text}</li>
                        ))}
                    </ol>
                  ) : (
                    <p className={styles.statusText}>No hay preguntas vinculadas.</p>
                  )}
                </div>

                {detailVacancy.evaluation_prompt && (
                  <div className={styles.detailSection}>
                    <p className={styles.detailLabel}>Prompt de evaluacion</p>
                    <p className={styles.promptText}>
                      {promptExpanded
                        ? detailVacancy.evaluation_prompt
                        : detailVacancy.evaluation_prompt.slice(0, 200) + (detailVacancy.evaluation_prompt.length > 200 ? '...' : '')}
                    </p>
                    {detailVacancy.evaluation_prompt.length > 200 && (
                      <button className={styles.toggleBtn} onClick={() => setPromptExpanded(!promptExpanded)}>
                        {promptExpanded ? 'Ver menos' : 'Ver mas'}
                      </button>
                    )}
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button className={styles.btnCancel} onClick={() => setDetailVacancy(null)}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
