"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="font-bold text-gray-900">DocSign</span>
      </Link>

      <div className="flex items-center gap-3">
        {user?.role === "ADMIN" && (
          <Link href="/admin" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Admin Panel
          </Link>
        )}
        <span className="text-sm text-gray-600">{user?.name}</span>
        <Button variant="secondary" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </nav>
  );
}
