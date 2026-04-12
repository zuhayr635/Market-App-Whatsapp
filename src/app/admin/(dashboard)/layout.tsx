import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"
import { Toaster } from "@/components/ui/sonner"
import { AdminSessionProvider } from "@/components/providers/admin-session-provider"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminSessionProvider>
      <div className="admin-panel flex h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    </AdminSessionProvider>
  )
}
