"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import DocumentCard from "@/components/documents/DocumentCard";
import UploadModal from "@/components/documents/UploadModal";

interface Document {
  id: string;
  title: string;
  status: "UPLOADED" | "SIGNING" | "SIGNED" | "COMPLETED";
  verificationCode: string;
  createdAt: string;
  fileSize: number | null;
  originalUrl: string;
  signedUrl?: string | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const [filteredRes, allRes] = await Promise.all([
        fetch(`/api/documents${params}`),
        fetch("/api/documents"),
      ]);
      const filteredData = await filteredRes.json();
      const allData = await allRes.json();
      if (filteredRes.ok) setDocuments(filteredData.data.documents);
      if (allRes.ok) setAllDocuments(allData.data.documents);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) fetchDocuments();
  };

  const statusOptions = [
    { value: "", label: "All" },
    { value: "UPLOADED", label: "Uploaded" },
    { value: "COMPLETED", label: "Completed" },
  ];

  return (
    <>
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchDocuments(); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={() => setShowUpload(true)} size="lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: allDocuments.length, color: "text-gray-900" },
          { label: "Pending", value: allDocuments.filter(d => d.status !== "COMPLETED").length, color: "text-yellow-600" },
          { label: "Completed", value: allDocuments.filter(d => d.status === "COMPLETED").length, color: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No documents yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Upload a PDF to get started</p>
          <Button onClick={() => setShowUpload(true)}>Upload your first document</Button>
        </div>
      ) : (
        <>
          {search && (
            <p className="text-xs text-gray-400 mb-3">
              {documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase())).length} result{documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase())).length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents
              .filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
              .map(doc => (
                <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
              ))}
            {documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400 text-sm">
                No documents match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
