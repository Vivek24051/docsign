"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Button from "@/components/ui/Button";

const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

interface PreviewModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function PreviewModal({ url, title, onClose }: PreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 truncate">{title}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {numPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 px-2 py-1 rounded hover:bg-gray-100"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-500">{currentPage + 1} / {numPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages - 1, currentPage + 1))}
                  disabled={currentPage === numPages - 1}
                  className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Next →
                </button>
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF */}
        <div className="overflow-y-auto flex-1 bg-gray-100 p-4">
          <div className="max-w-2xl mx-auto rounded-lg overflow-hidden shadow">
            <PDFViewer url={url} pageIndex={currentPage} onNumPages={setNumPages} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
