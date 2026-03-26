import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import styles from './Applications.module.css'

export default function Applications() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [videoModalApp, setVideoModalApp] = useState(null)
  const intervalRef = useRef(null)

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/applications/')
      setApplications(data)
    } catch {
      setError('No se pudieron cargar las aplicaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
    // Auto-refresh cada 10 segundos para mostrar nuevas aplicaciones
    intervalRef.current = setInterval(() => fetchApplications(true), 10000)
    return () => clearInterval(intervalRef.current)
  }, [fetchApplications])

  const toggleAll = () => {
    if (selected.size === applications.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(applications.map((a) => a.id)))
    }
  }

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`¿Eliminar ${selected.size} aplicación(es) seleccionada(s)?`)) return
    setDeleting(true)
    try {
      await api.delete('/applications/', { data: { ids: [...selected] } })
      setSelected(new Set())
      await fetchApplications(true)
    } catch {
      alert('Error al eliminar. Intenta de nuevo.')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const allChecked = applications.length > 0 && selected.size === applications.length
  const someChecked = selected.size > 0 && selected.size < applications.length

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Aplicaciones Recibidas</h1>
          <p className={styles.pageSubtitle}>
            {applications.length} aplicación(es) · se actualiza automáticamente
          </p>
        </div>
        {selected.size > 0 && (
          <button
            className={styles.btnDelete}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : `🗑 Eliminar seleccionadas (${selected.size})`}
          </button>
        )}
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {loading ? (
        <p className={styles.statusText}>Cargando aplicaciones...</p>
      ) : applications.length === 0 ? (
        <p className={styles.statusText}>No hay aplicaciones recibidas aún.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheck}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked }}
                    onChange={toggleAll}
                    className={styles.checkbox}
                  />
                </th>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Vacante</th>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Video</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className={`${styles.tr} ${selected.has(app.id) ? styles.trSelected : ''}`}
                  onClick={(e) => {
                    if (e.target.type === 'checkbox') return
                    navigate(`/admin/aplicaciones/${app.id}`, { state: app })
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.tdCheck}>
                    <input
                      type="checkbox"
                      checked={selected.has(app.id)}
                      onChange={() => toggleOne(app.id)}
                      className={styles.checkbox}
                    />
                  </td>
                  <td className={styles.td}>{app.full_name}</td>
                  <td className={styles.td}>{app.email}</td>
                  <td className={styles.td}>{app.vacancy_name || '-'}</td>
                  <td className={styles.td}>{formatDate(app.applied_at)}</td>
                  <td className={styles.td}>
                    {app.video_url ? (
                      <button
                        className={styles.btnVideo}
                        onClick={() => setVideoModalApp(app)}
                      >
                        ▶ Ver video
                      </button>
                    ) : (
                      <span className={styles.noVideo}>Sin video</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {videoModalApp && (
        <div className={styles.overlay} onClick={() => setVideoModalApp(null)}>
          <div className={styles.videoModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.videoModalHeader}>
              <div>
                <h2 className={styles.videoModalTitle}>
                  {videoModalApp.full_name}
                </h2>
                <p className={styles.videoModalSub}>
                  {videoModalApp.vacancy_name} · {formatDate(videoModalApp.applied_at)}
                </p>
              </div>
              <button
                className={styles.btnClose}
                onClick={() => setVideoModalApp(null)}
              >
                ✕
              </button>
            </div>
            <video
              className={styles.videoEl}
              src={`/api/v1/applications/${videoModalApp.id}/video`}
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </div>
  )
}
