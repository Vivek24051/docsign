import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/documents/Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Platform overview and management</p>
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
