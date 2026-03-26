import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { vacanciesService } from '../../../services/vacancies'
import { questionsService } from '../../../services/questions'
import { applicationsService } from '../../../services/applications'
import styles from './Home.module.css'

const quickActions = [
  {
    to: '/admin/vacantes',
    icon: '◈',
    title: 'Vacantes',
    description: 'Crea y administra las vacantes disponibles para el proceso de selección.',
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    to: '/admin/preguntas',
    icon: '◇',
    title: 'Preguntas',
    description: 'Define las preguntas de prescreening asociadas a cada vacante.',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  {
    to: '/admin/aplicaciones',
    icon: '◉',
    title: 'Aplicaciones',
    description: 'Consulta quiénes han aplicado y visualiza los videos de respuesta.',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
]

export default function Home() {
  const [stats, setStats] = useState({ vacancies: null, questions: null, applications: null })

  useEffect(() => {
    const load = async () => {
      try {
        const [vacancies, questions, applications] = await Promise.allSettled([
          vacanciesService.getAll(),
          questionsService.getAll(),
          applicationsService.getAll(),
        ])
        setStats({
          vacancies: vacancies.status === 'fulfilled' ? vacancies.value.length : '—',
          questions: questions.status === 'fulfilled' ? questions.value.length : '—',
          applications: applications.status === 'fulfilled' ? applications.value.length : '—',
        })
      } catch {
        // silently fail — individual settled handles it
      }
    }
    load()
  }, [])

  const statCards = [
    { icon: '◈', label: 'Vacantes Activas', value: stats.vacancies ?? '…', color: '#6366F1' },
    { icon: '◇', label: 'Total Preguntas', value: stats.questions ?? '…', color: '#10B981' },
    { icon: '◉', label: 'Aplicaciones Recibidas', value: stats.applications ?? '…', color: '#F59E0B' },
    { icon: '⬡', label: 'Evaluaciones IA', value: '—', color: '#8B5CF6' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bienvenido al Panel de Reclutamiento</h1>
        <p className={styles.subtitle}>
          Gestiona vacantes, preguntas y aplicaciones del proceso de prescreening de desarrolladores.
        </p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: card.color }}>{card.icon}</div>
            <div className={styles.statValue}>{card.value}</div>
            <div className={styles.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.sectionLabel}>Acceso rápido</div>
      <div className={styles.grid}>
        {quickActions.map((card) => (
          <Link key={card.to} to={card.to} className={styles.card}>
            <div className={styles.cardIcon} style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardDesc}>{card.description}</p>
            </div>
            <span className={styles.cardArrow}>→</span>
          </Link>
        ))}
      </div>

      <div className={styles.candidateBanner}>
        <div className={styles.bannerText}>
          <strong>Portal del candidato</strong>
          <span>Comparte este enlace con los aplicantes para que inicien el proceso de prescreening.</span>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className={styles.bannerBtn}>
          Abrir portal ↗
        </a>
      </div>
    </div>
  )
}
