import ProtectedRoute from "@/components/ProtectedRoute";
import UserSidebar from "@/components/user/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allow="user">
      <div className="flex min-h-screen" style={{ backgroundColor: "#F5F6F8" }}>
        <UserSidebar />
        <main className="flex-1 px-8 py-8 md:px-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
