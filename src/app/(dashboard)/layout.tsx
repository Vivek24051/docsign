import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/documents/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
