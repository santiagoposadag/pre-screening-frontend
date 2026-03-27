import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ApplyProvider } from './context/ApplyContext'
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

export default function App() {
  return (
    <BrowserRouter>
      <ApplyProvider>
        <Routes>
          {/* Flujo candidato (OTP → invitaciones → entrevista) */}
          <Route path="/" element={<CandidateLogin />} />
          <Route path="/apply/invitations" element={<Invitations />} />
          <Route path="/apply/interview" element={<Interview />} />
          <Route path="/apply/thanks" element={<ThankYou />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ApplyProvider>
    </BrowserRouter>
  )
}
