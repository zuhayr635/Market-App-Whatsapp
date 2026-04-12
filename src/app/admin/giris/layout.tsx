import { AdminSessionProvider } from "@/components/providers/admin-session-provider"

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminSessionProvider>
      <div className="admin-panel">{children}</div>
    </AdminSessionProvider>
  )
}
