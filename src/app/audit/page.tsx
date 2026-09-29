"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  Flame,
  Globe2,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AuditShell } from "@/components/layout/AuditShell";
import { ScoreRing } from "@/components/ui/ScoreRing";

/* =========================================================
   Types
   ========================================================= */

type Severity = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  unknown: number;
};

type AuditSummary = {
  failedRules: number;
  affectedElements: number;
  passedChecks: number;
  needsReview: number;
  severity: Severity;
};

type AuditResult = {
  requestedUrl: string;
  finalUrl: string;
  scannedAt: string;
  score: number;
  summary: AuditSummary;
  violations: unknown[];
  passes: unknown[];
  incomplete: unknown[];
};

/* =========================================================
   Storage Constants & Helpers
   ========================================================= */

const LAST_AUDIT_KEY = "sanalyze:lastAudit";
const AUDIT_HISTORY_KEY = "sanalyze:auditHistory";

function formatScanDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getHostname(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

/* =========================================================
   Main Audit Component
   ========================================================= */

function AuditContent() {
  const params = useSearchParams();
  const router = useRouter();

  const urlFromQuery = params.get("url") || "";
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(LAST_AUDIT_KEY);
      if (!stored) {
        setLoadError(
          "No completed audit was found. Run a new scan to inspect a website."
        );
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(stored) as AuditResult;
      if (!parsed || !parsed.summary || typeof parsed.score !== "number") {
        throw new Error("Stored audit data is invalid.");
      }

      setAudit(parsed);

      try {
        const storedHistory = sessionStorage.getItem(AUDIT_HISTORY_KEY);
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory);
          if (Array.isArray(parsedHistory)) {
            setAuditHistory(parsedHistory as AuditResult[]);
          }
        }
      } catch (historyError) {
        console.error("Unable to load Sanalyze audit history:", historyError);
        setAuditHistory([]);
      }
    } catch (error) {
      console.error("Unable to load Sanalyze audit:", error);
      setLoadError("The saved audit could not be loaded. Please run the scan again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const rawUrl = audit?.finalUrl || audit?.requestedUrl || urlFromQuery;
  const host = useMemo(() => {
    return getHostname(rawUrl) || "Website";
  }, [rawUrl]);

  /* ================= Loading State ================= */
  if (loading) {
    return (
      <AuditShell title="Overview">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4 animate-pulse">
            <RefreshCw size={28} className="animate-spin" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Reading Audit Insights...
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Please wait while we parse security scores and accessibility conformance metrics.
          </p>
        </div>
      </AuditShell>
    );
  }

  /* ================= Error / Empty State ================= */
  if (!audit || loadError) {
    return (
      <AuditShell title="Overview">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 sm:p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <CircleAlert size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            No Active Audit Found
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {loadError || "Launch an automated scan to inspect vulnerabilities and WCAG conformance."}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/25"
            >
              Start New Scan
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AuditShell>
    );
  }

  /* ================= Metrics Computation ================= */
  const { failedRules, affectedElements, passedChecks, needsReview, severity } = audit.summary;

  const severityItems = [
    {
      label: "Critical",
      value: severity.critical,
      barBg: "bg-rose-500",
      badgeCls: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      dotCls: "bg-rose-500",
    },
    {
      label: "Serious",
      value: severity.serious,
      barBg: "bg-orange-500",
      badgeCls: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
      dotCls: "bg-orange-500",
    },
    {
      label: "Moderate",
      value: severity.moderate,
      barBg: "bg-amber-500",
      badgeCls: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      dotCls: "bg-amber-500",
    },
    {
      label: "Minor",
      value: severity.minor,
      barBg: "bg-sky-500",
      badgeCls: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
      dotCls: "bg-sky-500",
    },
  ];

  const maxSeverity = Math.max(1, ...severityItems.map((item) => item.value));
  const evaluatedRules = passedChecks + failedRules;
  const passRate = evaluatedRules > 0 ? Math.round((passedChecks / evaluatedRules) * 100) : 100;

  const currentHost = getHostname(audit.finalUrl || audit.requestedUrl);
  const pageHistory = auditHistory
    .filter((item) => getHostname(item.finalUrl || item.requestedUrl) === currentHost)
    .slice(0, 8)
    .reverse();

  return (
    <AuditShell title="Overview">
      <div className="space-y-6 sm:space-y-8 pb-16">
        {/* ================= 1. Top Header Banner ================= */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-sm">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-3">
              {/* شارة اكتمال الفحص */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold w-fit">
                <CheckCircle2 size={13} />
                <span>Audit completed</span>
              </div>

              {/* عنوان الرابط المفحوص بحجم متجاوب تماماً */}
              <div className="flex items-center gap-2 max-w-full">
                <Globe2 size={22} className="text-slate-400 shrink-0 hidden sm:inline" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  {host}
                </h1>
                {rawUrl && (
                  <a
                    href={rawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title="Visit site"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              {/* محرك الفحص والوقت */}
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                <span className="font-medium text-slate-600 dark:text-slate-300">Automated Axe-Core Engine</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={13} className="text-slate-400" />
                  <span>{formatScanDate(audit.scannedAt)}</span>
                </span>
              </div>
            </div>

            {/* الأزرار: بعرض متناسق على الهاتف وجنباً إلى جنب على الديسكتوب */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 lg:pt-0">
              <Link
                href={`/scan?url=${encodeURIComponent(rawUrl)}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs active:scale-[0.98]"
              >
                <RefreshCw size={14} />
                <span>Re-scan Target</span>
              </Link>

              <Link
                href={`/audit/issues?url=${encodeURIComponent(rawUrl)}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition duration-200 active:scale-[0.98]"
              >
                <span>Inspect All Issues</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ================= 2. KPI Metrics Grid ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Main Score Card */}
          <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Overall Score
              </span>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>

            <div className="py-5 flex justify-center items-center">
              <ScoreRing score={audit.score} />
            </div>

            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-tight">
              Automated checks conformance index
            </p>
          </article>

          {/* Affected Elements */}
          <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Affected Nodes
              </span>
              <div
                className={`p-2 rounded-xl ${failedRules === 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-500"
                  }`}
              >
                <AlertTriangle size={18} />
              </div>
            </div>

            <div className="my-2">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {affectedElements}
              </div>
              <p
                className={`text-xs font-medium mt-1 ${failedRules === 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
                  }`}
              >
                {failedRules === 0
                  ? "Zero rules violated"
                  : `${failedRules} rule${failedRules === 1 ? "" : "s"} violated`}
              </p>
            </div>

            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${failedRules === 0 ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                style={{
                  width: failedRules === 0 ? "100%" : `${Math.min(100, failedRules * 8)}%`,
                }}
              />
            </div>
          </article>

          {/* Passed Checks */}
          <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Passed Rules
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {passedChecks}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                {passRate}% conformance rate
              </p>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${passRate}%` }} />
            </div>
          </article>

          {/* Incomplete / Needs Review */}
          <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Needs Review
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <CircleAlert size={18} />
              </div>
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {needsReview}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                Requires manual triage
              </p>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, needsReview * 12)}%` }} />
            </div>
          </article>
        </section>
        {/* ================= 3. Two-Column Dashboard (Severity & History) ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Issue Severity Distribution */}
          <article className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame size={17} className="text-rose-500" />
                    Issue Severity
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Categorized by threat and user impact
                  </p>
                </div>
                <Link
                  href={`/audit/issues?url=${encodeURIComponent(rawUrl)}`}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  View all
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="space-y-4 pt-2">
                {severityItems.map((item) => {
                  const width = item.value === 0 ? 0 : Math.max(8, (item.value / maxSeverity) * 100);

                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className={`w-2 h-2 rounded-full ${item.dotCls}`} />
                          {item.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${item.badgeCls}`}>
                          {item.value}
                        </span>
                      </div>

                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.barBg} transition-all duration-500 rounded-full`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Total Violations: <strong>{affectedElements}</strong></span>
              <span className="text-[11px]">Prioritize Critical & Serious</span>
            </div>
          </article>

          {/* Score Progression */}
          <article className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={17} className="text-emerald-500" />
                    Score Progression
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Historical trend for {host}
                  </p>
                </div>

                <div className="flex items-baseline gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span className="text-base font-extrabold text-emerald-500">{audit?.score ?? 100}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Latest</span>
                </div>
              </div>

              <div className="my-5 px-6 py-5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-3 right-3 top-2 h-0.5 bg-emerald-500/80 dark:bg-emerald-500 -translate-y-1/2" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-sm" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2">100%</span>
                    <span className="text-[10px] text-slate-400">Previous</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 shadow-sm ring-4 ring-emerald-500/20" />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">{audit?.score ?? 100}%</span>
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Current</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={13} />
                {pageHistory?.length ?? 2} recorded snapshots
              </span>
              <Link
                href="/audit/compare"
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Compare Scans</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </article>
        </section>

        {/* ================= 4. Bottom Action Cards ================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <article className="md:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
                <ScanSearch size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Recommended Action
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Investigate Automated Findings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Inspect faulty HTML selectors, color contrast ratios, and structural elements needing attention.
                </p>
              </div>
            </div>

            {/* الزر المصحح بلون خط أبيض صريح وأيقونة ظاهرة تماماً */}
            <Link
              href={`/audit/issues?url=${encodeURIComponent(rawUrl)}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shrink-0 shadow-sm active:scale-95"
            >
              <span className="text-white font-bold">View All Issues</span>
              <ArrowRight size={14} className="text-white" />
            </Link>
          </article>

          <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-xs">
              <ShieldAlert size={16} className="text-emerald-500" />
              <span>Audit Snapshot</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed my-2">
              Captured on {formatScanDate(audit.scannedAt)}. Conformance findings reflect client DOM state at the exact time of scan execution.
            </p>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Status: Validated
            </div>
          </article>
        </section>
      </div>
    </AuditShell>
  );
}

/* =========================================================
   Export with Suspense
   ========================================================= */

export default function AuditPage() {
  return (
    <Suspense>
      <AuditContent />
    </Suspense>
  );
}