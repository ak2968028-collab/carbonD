"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Leaf, X } from "lucide-react";

import AuthForm, { type AuthMode } from "@/components/auth/AuthForm";

/** Optional sign-in dialog over the dashboard; closing it (×, Esc, backdrop) keeps browsing as a guest. */
export default function AuthPrompt({ open, mode, onClose }: { open: boolean; mode: AuthMode; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl md:grid-cols-[1fr_1.1fr]">
        <div className="theme-dark relative hidden md:block">
          <Image src="/images/sapling.webp" alt="" fill className="object-cover" sizes="360px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07130d] via-[#07130d]/40 to-transparent" />
          <div className="absolute bottom-0 p-6">
            <p className="text-lg font-semibold text-white">Keep your carbon work in one place</p>
            <p className="mt-1 text-sm text-white/70">A free account takes a few seconds. The dashboard stays open either way.</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <button
            onClick={onClose} aria-label="Close and continue without signing in"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent-soft ring-1 ring-accent-line">
              <Leaf className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p id="auth-prompt-title" className="font-semibold text-ink">Village Carbon Dashboard</p>
              <p className="text-sm text-muted">Sign in or create an account</p>
            </div>
          </div>
          <AuthForm key={mode} initialMode={mode} onSuccess={onClose} />
          <button onClick={onClose} className="mt-4 w-full text-center text-sm text-muted hover:text-ink">
            Continue without signing in
          </button>
        </div>
      </div>
    </div>
  );
}
