"use client";

import { useRef, useState } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  onSaveReusable?: (name: string, dataUrl: string) => void;
}

type Mode = "draw" | "type";

export default function SignatureCanvas({ onSave, onCancel, onSaveReusable }: SignatureCanvasProps) {
  const sigRef = useRef<ReactSignatureCanvas>(null);
  const [mode, setMode] = useState<Mode>("draw");
  const [typedText, setTypedText] = useState("");
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);

  const getSignatureDataUrl = (): string | null => {
    if (mode === "draw") {
      if (!sigRef.current || sigRef.current.isEmpty()) return null;
      return sigRef.current.toDataURL("image/png");
    } else {
      if (!typedText.trim()) return null;
      // Render typed text onto a canvas
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "transparent";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "italic 48px Georgia, serif";
      ctx.fillStyle = "#1a1a2e";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, 200, 50);
      return canvas.toDataURL("image/png");
    }
  };

  const handleApply = () => {
    const dataUrl = getSignatureDataUrl();
    if (!dataUrl) return alert("Please draw or type a signature first.");
    onSave(dataUrl);
  };

  const handleSaveReusable = () => {
    if (!saveName.trim()) return alert("Enter a name for this signature.");
    const dataUrl = getSignatureDataUrl();
    if (!dataUrl) return alert("Please draw or type a signature first.");
    onSaveReusable?.(saveName, dataUrl);
    setShowSave(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Add Signature</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-gray-100">
          {(["draw", "type"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === m ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "draw" ? "Draw" : "Type"}
            </button>
          ))}
        </div>

        <div className="p-4">
          {mode === "draw" ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <ReactSignatureCanvas
                ref={sigRef}
                canvasProps={{
                  width: 460,
                  height: 160,
                  className: "signature-canvas w-full",
                  style: { background: "transparent" },
                }}
                penColor="#1a1a2e"
              />
              <div className="border-t border-gray-200 px-3 py-2 flex justify-between items-center">
                <span className="text-xs text-gray-400">Draw your signature above</span>
                <button
                  onClick={() => sigRef.current?.clear()}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div>
              <Input
                label="Type your signature"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Your name"
              />
              {typedText && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl text-center border border-gray-200">
                  <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "2rem", color: "#1a1a2e" }}>
                    {typedText}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Save reusable section */}
          {onSaveReusable && (
            <div className="mt-3">
              {!showSave ? (
                <button
                  onClick={() => setShowSave(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  + Save as reusable signature
                </button>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Signature name (e.g. My Initials)"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="secondary" size="sm" onClick={handleSaveReusable}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button onClick={handleApply} className="flex-1">Apply Signature</Button>
        </div>
      </div>
    </div>
  );
}
