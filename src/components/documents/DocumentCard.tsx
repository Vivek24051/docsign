"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PreviewModal from "./PreviewModal";

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

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify/${document.verificationCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = async () => {
    const res = await fetch(`/api/documents/${document.id}/download`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title}_signed.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewUrl = document.signedUrl || document.originalUrl;

  return (
    <>
      {showPreview && (
        <PreviewModal
          url={previewUrl}
          title={document.title}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{document.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatBytes(document.fileSize)} · {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge status={document.status} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          {document.status !== "COMPLETED" ? (
            <Link href={`/documents/${document.id}/sign`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full">Sign document</Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleDownload} className="flex-1">
              Download
            </Button>
          )}

          {/* Preview */}
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)} title="Preview document">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>

          {/* Copy verification link */}
          <Button variant="ghost" size="sm" onClick={handleCopyLink} title={copied ? "Copied!" : "Copy verification link"}>
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </Button>

          {/* Verify */}
          <Link href={`/verify/${document.verificationCode}`} target="_blank">
            <Button variant="ghost" size="sm" title="Open verification page">
              <svg
                className={`w-4 h-4 ${document.status === "COMPLETED" ? "text-green-500" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
          </Link>

          {/* Delete */}
          <Button variant="ghost" size="sm" onClick={() => onDelete(document.id)} title="Delete document">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>
    </>
  );
}
