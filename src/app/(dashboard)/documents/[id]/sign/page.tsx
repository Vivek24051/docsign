"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Button from "@/components/ui/Button";
import SignatureCanvas from "@/components/signature/SignatureCanvas";

const PDFViewer = dynamic(() => import("@/components/documents/PDFViewer"), { ssr: false });

interface PlacedSignature {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signatureData: string;
  savedSignatureId?: string;
}

interface SavedSig {
  id: string;
  name: string;
  signatureData: string;
}

interface DocumentData {
  id: string;
  title: string;
  originalUrl: string;
  status: string;
}

export default function SignPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [placedSigs, setPlacedSigs] = useState<PlacedSignature[]>([]);
  const [savedSigs, setSavedSigs] = useState<SavedSig[]>([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [pdfScale, setPdfScale] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [docRes, sigRes] = await Promise.all([
        fetch(`/api/documents/${docId}`),
        fetch("/api/signatures"),
      ]);
      const docData = await docRes.json();
      const sigData = await sigRes.json();
      if (!docRes.ok) throw new Error(docData.error);
      setDocument(docData.data.document);
      setSavedSigs(sigData.data?.signatures || []);
    } catch {
      setError("Failed to load document.");
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract text from PDF and generate AI summary
  useEffect(() => {
    if (!document?.originalUrl) return;
    let cancelled = false;

    const summarize = async () => {
      setAiLoading(true);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument(document.originalUrl).promise;
        let text = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          text += content.items.map((item: any) => item.str).join(" ") + " ";
        }
        if (cancelled || !text.trim()) return;
        const res = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!cancelled && data.data?.summary) setAiSummary(data.data.summary);
      } catch {
        // silently fail — AI summary is optional
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };

    summarize();
    return () => { cancelled = true; };
  }, [document?.originalUrl]);

  // Drag-to-move signature boxes
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!pdfContainerRef.current) return;
      const rect = pdfContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - dragging.offsetX);
      const y = Math.max(0, e.clientY - rect.top - dragging.offsetY);
      setPlacedSigs((prev) =>
        prev.map((s) => (s.id === dragging.id ? { ...s, x, y } : s))
      );
    };
    const handleUp = () => setDragging(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pdfContainerRef.current) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPendingPos({ x, y });
    setShowCanvas(true);
  };

  const handleSignatureSave = (dataUrl: string) => {
    if (!pendingPos) return;
    const newSig: PlacedSignature = {
      id: Math.random().toString(36).slice(2),
      page: currentPage,
      x: pendingPos.x,
      y: pendingPos.y,
      width: 180,
      height: 60,
      signatureData: dataUrl,
    };
    setPlacedSigs((prev) => [...prev, newSig]);
    setShowCanvas(false);
    setPendingPos(null);
  };

  const handleSaveReusable = async (name: string, signatureData: string) => {
    const res = await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, signatureData }),
    });
    if (res.ok) {
      const data = await res.json();
      setSavedSigs((prev) => [data.data.signature, ...prev]);
    }
  };

  const handleUseSaved = (saved: SavedSig) => {
    if (!pdfContainerRef.current) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const newSig: PlacedSignature = {
      id: Math.random().toString(36).slice(2),
      page: currentPage,
      x: rect.width / 2 - 90,
      y: rect.height / 2 - 30,
      width: 180,
      height: 60,
      signatureData: saved.signatureData,
      savedSignatureId: saved.id,
    };
    setPlacedSigs((prev) => [...prev, newSig]);
  };

  const removeSig = (id: string) => {
    setPlacedSigs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSign = async () => {
    if (placedSigs.length === 0) return setError("Please add at least one signature.");
    setSigning(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${docId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Normalize canvas pixel coords → PDF points by dividing by render scale
          signatures: placedSigs.map(({ id: _id, ...sig }) => ({
            ...sig,
            x: sig.x / pdfScale,
            y: sig.y / pdfScale,
            width: sig.width / pdfScale,
            height: sig.height / pdfScale,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signing failed");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signing failed");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">{error || "Document not found."}</p>
      </div>
    );
  }

  const pageSigs = placedSigs.filter((s) => s.page === currentPage);

  return (
    <>
      {showCanvas && (
        <SignatureCanvas
          onSave={handleSignatureSave}
          onCancel={() => { setShowCanvas(false); setPendingPos(null); }}
          onSaveReusable={handleSaveReusable}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">{document.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Click on the document to place your signature</p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500">{placedSigs.length} signature{placedSigs.length !== 1 ? "s" : ""} placed</span>
          <Button onClick={handleSign} loading={signing} disabled={placedSigs.length === 0} size="lg">
            Sign & Complete
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* PDF viewer */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Page nav */}
            {numPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30">
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">Page {currentPage + 1} of {numPages}</span>
                <button onClick={() => setCurrentPage(Math.min(numPages - 1, currentPage + 1))} disabled={currentPage === numPages - 1} className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30">
                  Next →
                </button>
              </div>
            )}

            {/* Clickable PDF area */}
            <div
              ref={pdfContainerRef}
              className={`relative ${dragging ? "cursor-grabbing" : "cursor-crosshair"}`}
              onClick={handleCanvasClick}
            >
              <PDFViewer
                url={document.originalUrl}
                pageIndex={currentPage}
                onNumPages={setNumPages}
                onScale={setPdfScale}
              />

              {/* Placed signatures overlay */}
              {pageSigs.map((sig) => (
                <div
                  key={sig.id}
                  className={`absolute border-2 rounded group select-none ${dragging?.id === sig.id ? "border-indigo-600 shadow-lg cursor-grabbing" : "border-indigo-400 cursor-grab"}`}
                  style={{ left: sig.x, top: sig.y, width: sig.width, height: sig.height }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    setDragging({ id: sig.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img src={sig.signatureData} alt="sig" className="w-full h-full object-contain pointer-events-none" />
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); removeSig(sig.id); }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* AI Summary */}
          {(aiLoading || aiSummary) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <h3 className="text-sm font-semibold text-indigo-700">AI Summary</h3>
              </div>
              {aiLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-indigo-100 rounded animate-pulse w-full" />
                  <div className="h-3 bg-indigo-100 rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-indigo-100 rounded animate-pulse w-3/5" />
                </div>
              ) : (
                <p className="text-xs text-indigo-800 leading-relaxed">{aiSummary}</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Instructions</h3>
            <ol className="space-y-2 text-xs text-gray-600">
              <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium flex-shrink-0">1</span>Click anywhere on the document to place a signature</li>
              <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium flex-shrink-0">2</span>Draw or type your signature in the popup</li>
              <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium flex-shrink-0">3</span>Click &ldquo;Sign & Complete&rdquo; when done</li>
            </ol>
          </div>

          {/* Saved signatures */}
          {savedSigs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Saved Signatures</h3>
              <div className="space-y-2">
                {savedSigs.map((sig) => (
                  <button
                    key={sig.id}
                    onClick={() => handleUseSaved(sig)}
                    className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <img src={sig.signatureData} alt={sig.name} className="h-8 object-contain" />
                    <p className="text-xs text-gray-500 mt-1">{sig.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Placed signatures list */}
          {placedSigs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Placed ({placedSigs.length})</h3>
              <div className="space-y-2">
                {placedSigs.map((sig, i) => (
                  <div key={sig.id} className="flex items-center justify-between text-xs text-gray-600">
                    <span>Signature {i + 1} · Page {sig.page + 1}</span>
                    <button onClick={() => removeSig(sig.id)} className="text-red-400 hover:text-red-600">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
