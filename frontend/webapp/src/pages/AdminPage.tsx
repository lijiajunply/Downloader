import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AdminAppDetailPage } from './admin/AdminAppDetailPage'
import { AdminAppsPage } from './admin/AdminAppsPage'
import { AdminChannelsPage } from './admin/AdminChannelsPage'
import { AdminDashboardPage } from './admin/AdminDashboardPage'
import { AdminUsersPage } from './admin/AdminUsersPage'
import { AdminAddProtocolPage } from './admin/AdminAddProtocolPage'
import { AdminEditProtocolPage } from './admin/AdminEditProtocolPage'

export function AdminPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="apps" element={<AdminAppsPage />} />
        <Route path="apps/:id" element={<AdminAppDetailPage />} />
        <Route path="apps/:id/add-protocol" element={<AdminAddProtocolPage />} />
        <Route path="apps/:id/protocols/:protocolId" element={<AdminEditProtocolPage />} />
        <Route path="channels" element={<AdminChannelsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}
