import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ApplyProvider } from './context/ApplyContext'
import { TrainingProvider } from './context/TrainingContext'
import AdminLayout from './components/AdminLayout/AdminLayout'
import CandidateLogin from './pages/Apply/CandidateLogin'
import Invitations from './pages/Apply/Invitations'
import Interview from './pages/Apply/Interview'
import ThankYou from './pages/Apply/ThankYou'
import Home from './pages/Admin/Home/Home'
import Vacancies from './pages/Admin/Vacancies/Vacancies'
import Applications from './pages/Admin/Applications/Applications'
import ApplicationDetail from './pages/Admin/Applications/ApplicationDetail'
import Login from './pages/Admin/Login/Login'
import GenerateVacancy from './pages/Admin/Vacancies/GenerateVacancy'
import TrainingPrograms from './pages/Admin/Training/TrainingPrograms'
import GenerateTrainingProgram from './pages/Admin/Training/GenerateTrainingProgram'
import TrainingProgramDetail from './pages/Admin/Training/TrainingProgramDetail'
import TrainingSessionDetail from './pages/Admin/Training/TrainingSessionDetail'
import StudentLogin from './pages/Training/StudentLogin'
import TrainingInvitations from './pages/Training/TrainingInvitations'
import TrainingAssessment from './pages/Training/TrainingAssessment'
import TrainingComplete from './pages/Training/TrainingComplete'

export default function App() {
  return (
    <BrowserRouter>
      <ApplyProvider>
        <TrainingProvider>
          <Routes>
            {/* Flujo candidato (OTP → invitaciones → entrevista) */}
            <Route path="/" element={<CandidateLogin />} />
            <Route path="/apply/invitations" element={<Invitations />} />
            <Route path="/apply/interview" element={<Interview />} />
            <Route path="/apply/thanks" element={<ThankYou />} />

            {/* Flujo estudiante formación (OTP → invitaciones → evaluación por temas) */}
            <Route path="/training" element={<StudentLogin />} />
            <Route path="/training/invitations" element={<TrainingInvitations />} />
            <Route path="/training/assessment" element={<TrainingAssessment />} />
            <Route path="/training/complete" element={<TrainingComplete />} />

            {/* Admin login */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin con sidebar */}
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <Home />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/vacantes/generar"
              element={
                <AdminLayout>
                  <GenerateVacancy />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/vacantes"
              element={
                <AdminLayout>
                  <Vacancies />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/aplicaciones"
              element={
                <AdminLayout>
                  <Applications />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/aplicaciones/:id"
              element={
                <AdminLayout>
                  <ApplicationDetail />
                </AdminLayout>
              }
            />

            {/* Admin Training */}
            <Route
              path="/admin/formaciones"
              element={
                <AdminLayout>
                  <TrainingPrograms />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/formaciones/generar"
              element={
                <AdminLayout>
                  <GenerateTrainingProgram />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/formaciones/:id"
              element={
                <AdminLayout>
                  <TrainingProgramDetail />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/formaciones/sesiones/:id"
              element={
                <AdminLayout>
                  <TrainingSessionDetail />
                </AdminLayout>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TrainingProvider>
      </ApplyProvider>
    </BrowserRouter>
  )
}
