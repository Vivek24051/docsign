"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setAuthed(true);
          setIsAdmin(data.data?.user?.role === "ADMIN");
        } else {
          setAuthed(false);
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900">DocSign</span>
        </div>

        <div className="flex items-center gap-3">
          {authed ? (
            <>
              <Link href={isAdmin ? "/admin" : "/dashboard"} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                {isAdmin ? "Admin Panel" : "Dashboard"}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Sign in</Link>
              <Link href="/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full mb-6 border border-indigo-100">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Digital signatures made simple
        </div>
        <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Sign documents<br />
          <span className="text-indigo-600">electronically</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Upload PDF documents, add your signature, and verify authenticity. Simple, secure, and fast.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href={authed ? (isAdmin ? "/admin" : "/dashboard") : "/register"} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-base">
            {authed ? (isAdmin ? "Go to Admin Panel" : "Go to Dashboard") : "Start signing for free"}
          </Link>
          <Link href="/verify" className="text-gray-600 hover:text-gray-900 font-medium text-base flex items-center gap-1">
            Verify a document
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
              title: "Upload & Preview",
              desc: "Upload any PDF document and preview it directly in your browser before signing.",
            },
            {
              d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
              title: "Electronic Signature",
              desc: "Draw your signature with a mouse or stylus, or type it. Save reusable signatures.",
            },
            {
              d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              title: "Verify Authenticity",
              desc: "Every signed document gets a unique verification code. Anyone can verify it publicly.",
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.d} />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
