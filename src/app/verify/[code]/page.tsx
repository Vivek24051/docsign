import Link from "next/link";

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

interface VerificationResult {
  isValid: boolean;
  title: string;
  status: string;
  verificationCode: string;
  createdAt: string;
  signedAt: string | null;
  user: { name: string; email: string };
  signatures: { page: number; signedAt: string }[];
}

async function getVerification(code: string): Promise<VerificationResult | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/verify/${code}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.document;
  } catch {
    return null;
  }
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params;
  const result = await getVerification(code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">DocSign</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Verify the authenticity of a signed document</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!result ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Document Not Found</h2>
              <p className="text-sm text-gray-500">
                This verification code is invalid or the document has been removed.
              </p>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`px-6 py-4 ${result.isValid ? "bg-green-50 border-b border-green-100" : "bg-yellow-50 border-b border-yellow-100"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${result.isValid ? "bg-green-100" : "bg-yellow-100"}`}>
                    {result.isValid ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${result.isValid ? "text-green-800" : "text-yellow-800"}`}>
                      {result.isValid ? "Document Verified" : "Unsigned Document"}
                    </p>
                    <p className={`text-sm ${result.isValid ? "text-green-600" : "text-yellow-600"}`}>
                      {result.isValid
                        ? "This document has been electronically signed via DocSign"
                        : "This document exists but has not been signed yet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Document</p>
                  <p className="text-base font-semibold text-gray-900">{result.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Uploaded by</p>
                    <p className="text-sm text-gray-700">{result.user.name}</p>
                    <p className="text-xs text-gray-400">{result.user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Upload date</p>
                    <p className="text-sm text-gray-700">
                      {new Date(result.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {result.isValid && result.signedAt && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Signed on</p>
                    <p className="text-sm text-gray-700">
                      {new Date(result.signedAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Verification Code</p>
                  <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded break-all">
                    {result.verificationCode}
                  </code>
                </div>

                {result.signatures.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Signatures</p>
                    <div className="space-y-1">
                      {result.signatures.map((sig, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span>Page {sig.page + 1} · {new Date(sig.signedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by{" "}
          <Link href="/" className="text-indigo-500 hover:text-indigo-600">DocSign</Link>
        </p>
      </div>
    </div>
  );
}
