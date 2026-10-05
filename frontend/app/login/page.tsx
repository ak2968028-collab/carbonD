"use client";

import { Suspense, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Leaf } from "lucide-react";

import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const mode = useSearchParams().get("mode") === "signup" ? "signup" : "signin";

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  return (
    <main className="theme-dark relative min-h-screen overflow-hidden">
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
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Explore the dashboard without an account
          </Link>
        </section>

        <div className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30">
              <Leaf className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Village Carbon Dashboard</p>
              <p className="text-sm text-white/60">Sign in or create an account</p>
            </div>
          </div>
          <AuthForm key={mode} initialMode={mode} onSuccess={() => router.replace("/")} />
        </div>
      </div>
    </main>
  );
}
