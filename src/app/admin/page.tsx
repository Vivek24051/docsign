"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalDocuments: number;
  signedDocuments: number;
  pendingDocuments: number;
}

interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  user: { name: string; email: string } | null;
  document: { title: string } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { documents: number };
}

interface Document {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  userId?: { name: string; email: string };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "user.register":               { label: "New user registered",      color: "bg-green-100 text-green-700" },
  "user.login":                  { label: "User logged in",            color: "bg-blue-100 text-blue-700" },
  "user.logout":                 { label: "User logged out",           color: "bg-gray-100 text-gray-600" },
  "user.password_reset_request": { label: "Password reset requested",  color: "bg-yellow-100 text-yellow-700" },
  "user.password_reset":         { label: "Password was reset",        color: "bg-yellow-100 text-yellow-700" },
  "document.upload":             { label: "Document uploaded",         color: "bg-indigo-100 text-indigo-700" },
  "document.view":               { label: "Document viewed",           color: "bg-gray-100 text-gray-600" },
  "document.sign":               { label: "Document signed",           color: "bg-purple-100 text-purple-700" },
  "document.download":           { label: "Document downloaded",       color: "bg-teal-100 text-teal-700" },
  "document.delete":             { label: "Document deleted",          color: "bg-red-100 text-red-700" },
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "documents">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, docsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
          fetch("/api/admin/documents"),
        ]);
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        const docsData = await docsRes.json();

        setStats(statsData.data?.stats);
        setRecentActivity(statsData.data?.recentActivity || []);
        setUsers(usersData.data?.users || []);
        setDocuments(docsData.data?.documents || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(["overview", "users", "documents"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? 0, color: "text-indigo-600" },
              { label: "Total Documents", value: stats?.totalDocuments ?? 0, color: "text-blue-600" },
              { label: "Signed", value: stats?.signedDocuments ?? 0, color: "text-green-600" },
              { label: "Pending", value: stats?.pendingDocuments ?? 0, color: "text-yellow-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentActivity.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">No activity yet</p>
              ) : (
                recentActivity.map((log, i) => {
                  const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-600" };
                  return (
                    <div key={log.id || i} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${meta.color}`}>
                          {meta.label}
                        </span>
                        {log.user && <span className="text-sm text-gray-700 truncate">{log.user.name}</span>}
                        {log.document && <span className="text-xs text-gray-400 truncate">· {log.document.title}</span>}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Documents</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user._count.documents}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{doc.title}</td>
                  <td className="px-5 py-3">
                    <p className="text-gray-700">{doc.userId?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{doc.userId?.email ?? ""}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
