import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allow="super_admin">
      <div className="min-h-screen" style={{ backgroundColor: "#F5F6F8" }}>
        <Sidebar />
        <main className="lg:pl-[248px]">
          <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
