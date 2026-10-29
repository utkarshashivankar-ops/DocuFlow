import { Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Dashboard from '@/pages/Dashboard'
import Documents from '@/pages/Documents'
import DocumentDetail from '@/pages/DocumentDetail'
import Upload from '@/pages/Upload'
import RenewalCenter from '@/pages/RenewalCenter'
import Search from '@/pages/Search'
import Notifications from '@/pages/Notifications'
import Settings from '@/pages/Settings'
import SharedDocument from '@/pages/SharedDocument'
import NotFound from '@/pages/NotFound'

export default function App() {
  const darkMode = useSelector((s) => s.ui.darkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/share/:token" element={<SharedDocument />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/renewals" element={<RenewalCenter />} />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
