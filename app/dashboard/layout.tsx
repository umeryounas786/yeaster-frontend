import ProtectedRoute from "@/components/ProtectedRoute";
import UserSidebar from "@/components/user/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allow="user">
      <div className="min-h-screen" style={{ backgroundColor: "#F5F6F8" }}>
        <UserSidebar />
        <main className="lg:pl-[300px]">
          <div className="px-4 py-5 md:px-8 md:py-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
