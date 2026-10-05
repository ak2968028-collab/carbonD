"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, Lock, User } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

export type AuthMode = "signin" | "signup";

/** Sign-in / sign-up form shared by the /login page and the dashboard prompt. */
export default function AuthForm({ initialMode = "signin", onSuccess }: { initialMode?: AuthMode; onSuccess?: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (signup && password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      if (signup) await register(username, password, fullName);
      else await login(username, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError(null);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-6 grid grid-cols-2 rounded-xl border border-line bg-surface-2 p-1 text-sm" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
            className={`rounded-lg py-2 font-medium transition ${mode === m ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"}`}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <Field id="username" label="Username" icon={<User className="h-4 w-4 text-muted" />}>
        <input
          id="username" autoComplete="username" required minLength={signup ? 3 : undefined} maxLength={32}
          pattern={signup ? "[A-Za-z0-9_.\\-]+" : undefined}
          title={signup ? "Letters, numbers, dot, dash or underscore" : undefined}
          value={username} onChange={(e) => setUsername(e.target.value)}
          className="h-11 w-full bg-transparent text-ink outline-none placeholder:text-muted" placeholder="your.name"
        />
      </Field>

      {signup && (
        <Field id="full_name" label="Full name (optional)" icon={<BadgeCheck className="h-4 w-4 text-muted" />}>
          <input
            id="full_name" autoComplete="name" maxLength={255} value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="h-11 w-full bg-transparent text-ink outline-none placeholder:text-muted" placeholder="Asha Verma"
          />
        </Field>
      )}

      <Field id="password" label="Password" icon={<Lock className="h-4 w-4 text-muted" />}>
        <input
          id="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required
          minLength={signup ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full bg-transparent text-ink outline-none placeholder:text-muted"
          placeholder={signup ? "At least 8 characters" : "••••••••"}
        />
      </Field>

      {signup && (
        <Field id="confirm" label="Confirm password" icon={<Lock className="h-4 w-4 text-muted" />}>
          <input
            id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="h-11 w-full bg-transparent text-ink outline-none placeholder:text-muted" placeholder="Repeat password"
          />
        </Field>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger-text">{error}</p>
      )}

      <button
        type="submit" disabled={submitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {signup ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

function Field({ id, label, icon, children }: { id: string; label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-ink-2" htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-input-line bg-input px-3 focus-within:border-accent">
        {icon}
        {children}
      </div>
    </div>
  );
}
