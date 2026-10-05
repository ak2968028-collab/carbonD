"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Leaf, Loader2, Lock, User } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Image src="/images/login-farm.webp" alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#03100a]/95 via-[#03100a]/70 to-[#03100a]/20" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <section className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur">
            <Leaf className="h-3.5 w-3.5" /> Varuna basin · Uttar Pradesh
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Every village has a carbon story.
            <span className="block text-emerald-300">Measure it. Bend the curve.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
            Village-level emissions, carbon sinks and low-carbon pathways, mapped to real village boundaries from
            the census.
          </p>
        </section>

        <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30">
              <Leaf className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Village Carbon Dashboard</p>
              <p className="text-sm text-white/60">Sign in to continue</p>
            </div>
          </div>

          <label className="mb-1.5 block text-sm font-medium text-white/80" htmlFor="username">Username</label>
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 focus-within:border-emerald-300/60">
            <User className="h-4 w-4 text-white/50" />
            <input
              id="username" autoComplete="username" required value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 w-full bg-transparent text-white outline-none placeholder:text-white/35"
              placeholder="admin"
            />
          </div>

          <label className="mb-1.5 block text-sm font-medium text-white/80" htmlFor="password">Password</label>
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 focus-within:border-emerald-300/60">
            <Lock className="h-4 w-4 text-white/50" />
            <input
              id="password" type="password" autoComplete="current-password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full bg-transparent text-white outline-none placeholder:text-white/35"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
