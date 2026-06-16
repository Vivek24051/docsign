"use client";

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  pageIndex: number;
  onNumPages?: (n: number) => void;
  onScale?: (scale: number) => void;
}

export default function PDFViewer({ url, pageIndex, onNumPages, onScale }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;

        onNumPages?.(pdf.numPages);

        const page = await pdf.getPage(pageIndex + 1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        onScale?.(scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      } catch (err) {
        console.error("PDF render error:", err);
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [url, pageIndex, onNumPages, onScale]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      style={{ background: "#f5f5f5" }}
    />
  );
}
