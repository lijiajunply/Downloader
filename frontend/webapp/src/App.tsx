import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import { RequireAdmin } from '@/layouts/RequireAdmin'
import { AppDetailPage } from '@/pages/AppDetailPage'
import { HomePage } from '@/pages/HomePage'
import { AdminPage } from '@/pages/AdminPage'
import { LoginPage } from '@/pages/LoginPage'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apps/:id" element={<AppDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App
