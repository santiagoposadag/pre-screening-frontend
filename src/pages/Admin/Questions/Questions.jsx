import { useState, useEffect, useCallback } from 'react'
import { questionsService } from '../../../services/questions'
import { vacanciesService } from '../../../services/vacancies'
import styles from './Questions.module.css'

const EMPTY_FORM = { text: '', vacancy_id: '', order: 0 }

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [vacancies, setVacancies] = useState([])
  const [filterVacancyId, setFilterVacancyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    vacanciesService.getAll().then(setVacancies).catch(() => {})
  }, [])

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await questionsService.getAll(filterVacancyId || undefined)
      setQuestions(data)
    } catch {
      setError('No se pudieron cargar las preguntas.')
    } finally {
      setLoading(false)
    }
  }, [filterVacancyId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const getVacancyName = (id) => {
    const v = vacancies.find((v) => String(v.id) === String(id))
    return v ? (v.name || v.nombre) : id
  }

  const openCreateModal = () => {
    setEditingQuestion(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (question) => {
    setEditingQuestion(question)
    setFormData({
      text: question.text || question.texto || question.question || '',
      vacancy_id: String(question.vacancy_id || ''),
      order: question.order ?? 0,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingQuestion(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
  }

  const handleSave = async () => {
    if (!formData.text.trim()) {
      setFormError('El texto de la pregunta es obligatorio.')
      return
    }
    if (!formData.vacancy_id) {
      setFormError('Selecciona una vacante.')
      return
    }
    setSaving(true)
    setFormError(null)
    const payload = {
      text: formData.text.trim(),
      vacancy_id: formData.vacancy_id,
      order: Number(formData.order),
    }
    try {
      if (editingQuestion) {
        const updated = await questionsService.update(editingQuestion.id, payload)
        setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? updated : q)))
      } else {
        const created = await questionsService.create(payload)
        setQuestions((prev) => [created, ...prev])
      }
      closeModal()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Error al guardar la pregunta.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      await questionsService.delete(confirmDeleteId)
      setQuestions((prev) => prev.filter((q) => q.id !== confirmDeleteId))
      setConfirmDeleteId(null)
    } catch {
      setError('Error al eliminar la pregunta.')
      setConfirmDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Gestion de Preguntas</h1>
            <button className={styles.btnPrimary} onClick={openCreateModal}>
              + Nueva pregunta
            </button>
          </div>

          <div className={styles.filters}>
            <label className={styles.filterLabel} htmlFor="filterVacancy">
              Filtrar por vacante:
            </label>
            <select
              id="filterVacancy"
              className={styles.select}
              value={filterVacancyId}
              onChange={(e) => setFilterVacancyId(e.target.value)}
            >
              <option value="">Todas las vacantes</option>
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name || v.nombre}
                </option>
              ))}
            </select>
          </div>

          {error && <p className={styles.errorBanner}>{error}</p>}

          {loading ? (
            <p className={styles.statusText}>Cargando preguntas...</p>
          ) : questions.length === 0 ? (
            <p className={styles.statusText}>No hay preguntas registradas.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>ID</th>
                    <th className={styles.th}>Pregunta</th>
                    <th className={styles.th}>Vacante</th>
                    <th className={styles.th}>Orden</th>
                    <th className={`${styles.th} ${styles.thActions}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} className={styles.tr}>
                      <td className={styles.tdId}>{q.id}</td>
                      <td className={styles.td}>{q.text || q.texto || q.question}</td>
                      <td className={styles.td}>{getVacancyName(q.vacancy_id)}</td>
                      <td className={styles.tdOrder}>{q.order ?? 0}</td>
                      <td className={styles.tdActions}>
                        <button className={styles.btnEdit} onClick={() => openEditModal(q)}>
                          Editar
                        </button>
                        <button className={styles.btnDelete} onClick={() => setConfirmDeleteId(q.id)}>
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
              {editingQuestion ? 'Editar pregunta' : 'Nueva pregunta'}
            </h2>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="questionText">
                Texto de la pregunta <span className={styles.required}>*</span>
              </label>
              <textarea
                id="questionText"
                className={styles.textarea}
                rows={3}
                placeholder="Ej. Describe tu experiencia con React."
                value={formData.text}
                onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="questionVacancy">
                Vacante <span className={styles.required}>*</span>
              </label>
              <select
                id="questionVacancy"
                className={styles.select}
                value={formData.vacancy_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, vacancy_id: e.target.value }))}
              >
                <option value="">-- Selecciona una vacante --</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="questionOrder">
                Orden
              </label>
              <input
                id="questionOrder"
                className={styles.input}
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
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
              Esta accion eliminara la pregunta permanentemente. No se puede deshacer.
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
    </div>
  )
}
