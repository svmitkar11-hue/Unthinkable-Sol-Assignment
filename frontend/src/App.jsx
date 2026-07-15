import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'

import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import MyComplaints from './pages/MyComplaints'
import NewComplaint from './pages/NewComplaint'
import ComplaintDetail from './pages/ComplaintDetail'
import NoticeBoard from './pages/NoticeBoard'
import AdminDashboard from './pages/AdminDashboard'
import AdminComplaints from './pages/AdminComplaints'
import AdminNotices from './pages/AdminNotices'
import AdminSettings from './pages/AdminSettings'

function Protected({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/complaints'} replace />
  }
  return <Layout>{children}</Layout>
}

function Home() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/complaints'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyOtp />} />

      {/* Resident */}
      <Route path="/complaints" element={<Protected role="RESIDENT"><MyComplaints /></Protected>} />
      <Route path="/complaints/new" element={<Protected role="RESIDENT"><NewComplaint /></Protected>} />
      <Route path="/notices" element={<Protected role="RESIDENT"><NoticeBoard /></Protected>} />

      {/* Shared detail (residents see their own, admin sees any) */}
      <Route path="/complaints/:id" element={<Protected><ComplaintDetail /></Protected>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<Protected role="ADMIN"><AdminDashboard /></Protected>} />
      <Route path="/admin/complaints" element={<Protected role="ADMIN"><AdminComplaints /></Protected>} />
      <Route path="/admin/notices" element={<Protected role="ADMIN"><AdminNotices /></Protected>} />
      <Route path="/admin/settings" element={<Protected role="ADMIN"><AdminSettings /></Protected>} />

      <Route path="/" element={<Home />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
