"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CircleAlert,
  Globe,
  Loader2,
  Lock,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import { Logo } from "@/components/ui/Logo";

/* =========================================================
   Types
   ========================================================= */

type AuditResult = {
  requestedUrl: string;
  finalUrl: string;
  scannedAt: string;
  score: number;

  summary: {
    failedRules: number;
    affectedElements: number;
    passedChecks: number;
    needsReview: number;

    severity: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
      unknown: number;
    };
  };

  violations: unknown[];
  passes: unknown[];
  incomplete: unknown[];
};

/* =========================================================
   Storage
   ========================================================= */

const LAST_AUDIT_KEY = "sanalyze:lastAudit";
const AUDIT_HISTORY_KEY = "sanalyze:auditHistory";
const MAX_HISTORY_ITEMS = 20;

function saveAudit(audit: AuditResult) {
  sessionStorage.setItem(LAST_AUDIT_KEY, JSON.stringify(audit));

  let history: AuditResult[] = [];
  try {
    const storedHistory = sessionStorage.getItem(AUDIT_HISTORY_KEY);
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory);
      if (Array.isArray(parsed)) {
        history = parsed;
      }
    }
  } catch (error) {
    console.error("Unable to read Sanalyze audit history:", error);
    history = [];
  }

  const updatedHistory = [audit, ...history].slice(0, MAX_HISTORY_ITEMS);

  try {
    sessionStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Unable to save full Sanalyze audit history:", error);
    try {
      sessionStorage.setItem(
        AUDIT_HISTORY_KEY,
        JSON.stringify(updatedHistory.slice(0, 5))
      );
    } catch (fallbackError) {
      console.error("Unable to save fallback audit history:", fallbackError);
    }
  }
}

/* =========================================================
   Scan stages
   ========================================================= */

const stages = [
  {
    title: "Connect to page",
    detail: "Open the target URL and prepare the audit context.",
    icon: Globe,
  },
  {
    title: "Inspect document",
    detail: "Load the page structure and accessibility tree context.",
    icon: ScanSearch,
  },
  {
    title: "Run automated checks",
    detail: "Run axe-core accessibility rules against the loaded page.",
    icon: ShieldCheck,
  },
  {
    title: "Build audit summary",
    detail: "Organize the real findings for the Sanalyze workspace.",
    icon: CheckCircle2,
  },
];

/* =========================================================
   Scan content
   ========================================================= */

function ScanContent() {
  const params = useSearchParams();
  const router = useRouter();

  const rawUrl = params.get("url") || "";
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");

  const host = useMemo(() => {
    try {
      return new URL(rawUrl).hostname;
    } catch {
      return rawUrl || "website";
    }
  }, [rawUrl]);

  useEffect(() => {
    let cancelled = false;

    // إذا لم يكن هناك رابط في الـ URL، يتم التحويل فوراً للصفحة الرئيسية
    if (!rawUrl) {
      router.replace("/");
      return;
    }

    async function runScan() {
      try {
        setError("");
        setStage(0);

        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: rawUrl,
          }),
        });

        setStage(2);

        const responseText = await response.text();
        if (!responseText) {
          throw new Error(
            `Scanner API returned an empty response (HTTP ${response.status}). Check terminal for details.`
          );
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("Invalid scanner API response:", responseText);
          throw new Error(
            `Scanner API returned an invalid response (HTTP ${response.status}).`
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || `The accessibility scan failed (HTTP ${response.status}).`
          );
        }

        if (!data.audit || typeof data.audit !== "object") {
          throw new Error("The scanner did not return a valid audit.");
        }

        if (cancelled) return;

        setStage(3);
        saveAudit(data.audit as AuditResult);

        await new Promise((resolve) => window.setTimeout(resolve, 450));
        if (cancelled) return;

        router.push(`/audit?url=${encodeURIComponent(data.audit.finalUrl)}`);
      } catch (err) {
        if (cancelled) return;
        console.error("Sanalyze scan failed:", err);
        setError(
          err instanceof Error ? err.message : "The accessibility scan failed."
        );
      }
    }

    const inspectTimer = window.setTimeout(() => {
      if (!cancelled) {
        setStage((current) => Math.max(current, 1));
      }
    }, 500);

    runScan();

    return () => {
      cancelled = true;
      window.clearTimeout(inspectTimer);
    };
  }, [rawUrl, router]);

  const progressPercentage = Math.round(((stage + 1) / stages.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-100 flex flex-col justify-between antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* خلفية متناسقة */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      {/* الترويسة */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Cancel Scan</span>
          </Link>
        </div>
      </header>

      {/* المحتوى */}
      <main className="relative z-10 max-w-xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1 flex flex-col justify-center">
        
        <div className="text-center space-y-2.5 mb-7">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
              error
                ? "text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20"
                : "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            {error ? (
              <CircleAlert size={14} className="text-rose-500" />
            ) : (
              <Loader2 size={13} className="animate-spin text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{error ? "AUDIT COULD NOT COMPLETE" : "AUDIT IN PROGRESS"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {error ? "Unable to scan this page" : `Checking ${host}`}
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {error
              ? error
              : "Sanalyze is running a real automated accessibility review of this page."}
          </p>
        </div>

        {/* بطاقة الهدف */}
        <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Globe size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Page
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {rawUrl || "Redirecting to home..."}
                </span>
              </div>
            </div>

            {rawUrl.startsWith("https://") && (
              <div className="inline-flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <Lock size={12} />
                <span>HTTPS</span>
              </div>
            )}
          </div>

          {!error && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Step {stage + 1} of {stages.length}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* مراحل الفحص أو رسالة الخطأ */}
        {!error ? (
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            {stages.map(({ title, detail, icon: Icon }, index) => {
              const complete = index < stage;
              const active = index === stage;

              return (
                <div
                  key={title}
                  className={`p-4 sm:p-4.5 flex items-start gap-3.5 transition-colors ${
                    active ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {complete ? (
                      <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={15} />
                      </div>
                    ) : active ? (
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-pulse">
                        <Loader2 size={14} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                        <Circle size={13} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          size={14}
                          className={
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : complete
                              ? "text-slate-700 dark:text-slate-300"
                              : "text-slate-400"
                          }
                        />
                        <h3
                          className={`text-xs sm:text-sm font-bold ${
                            active
                              ? "text-emerald-950 dark:text-emerald-200"
                              : complete
                              ? "text-slate-800 dark:text-slate-200"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {title}
                        </h3>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          complete
                            ? "bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : active
                            ? "bg-emerald-500 text-white font-medium shadow-xs"
                            : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        {complete ? "Complete" : active ? "In progress" : "Waiting"}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] sm:text-xs mt-0.5 leading-relaxed ${
                        active
                          ? "text-slate-600 dark:text-slate-300"
                          : complete
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <CircleAlert size={26} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Scan Failed
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
              {error}
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
            >
              Try another website
            </button>
          </div>
        )}

      </main>

      {/* التذييل */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm">
        <p>© 2026 Sanalyze. All rights reserved. • Built by Eng. Sanad Shat</p>
      </footer>
    </div>
  );
}

/* =========================================================
   Page
   ========================================================= */

export default function ScanPage() {
  return (
    <Suspense>
      <ScanContent />
    </Suspense>
  );
}