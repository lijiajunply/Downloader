import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AdminAppDetailPage } from './admin/AdminAppDetailPage'
import { AdminAppsPage } from './admin/AdminAppsPage'
import { AdminChannelsPage } from './admin/AdminChannelsPage'
import { AdminDashboardPage } from './admin/AdminDashboardPage'
import { AdminProtocolsPage } from './admin/AdminProtocolsPage'
import { AdminReleasesPage } from './admin/AdminReleasesPage'
import { AdminUsersPage } from './admin/AdminUsersPage'

export function AdminPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="apps" element={<AdminAppsPage />} />
        <Route path="apps/:id" element={<AdminAppDetailPage />} />
        <Route path="channels" element={<AdminChannelsPage />} />
        <Route path="releases" element={<AdminReleasesPage />} />
        <Route path="protocols" element={<AdminProtocolsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}
