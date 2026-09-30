"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  ExternalLink,
  FileCode2,
  Globe,
  Info,
  Monitor,
  ScanSearch,
  Sparkles,
  Target,
} from "lucide-react";

import { AuditShell } from "@/components/layout/AuditShell";

/* =========================================================
   Types
   ========================================================= */

type AxeNode = {
  impact: string | null;
  html: string;
  target: string[];
  failureSummary: string;
};

type AxeViolation = {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
};

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
  violations: AxeViolation[];
  passes: unknown[];
  incomplete: unknown[];
};

/* =========================================================
   Helpers
   ========================================================= */

function getSeverity(impact: string | null) {
  switch (impact) {
    case "critical":
      return "Critical";
    case "serious":
      return "Serious";
    case "moderate":
      return "Moderate";
    case "minor":
      return "Minor";
    default:
      return "Review";
  }
}

function getWcagCriterion(tags: string[]) {
  const criterion = tags.find((tag) => /^wcag\d{3,4}$/.test(tag));
  if (!criterion) return "WCAG 2.1";
  const numbers = criterion.replace("wcag", "");
  if (numbers.length === 3) {
    return `WCAG ${numbers[0]}.${numbers[1]}.${numbers[2]}`;
  }
  if (numbers.length === 4) {
    return `WCAG ${numbers[0]}.${numbers[1]}.${numbers.slice(2)}`;
  }
  return "WCAG 2.1";
}

function getCategory(rule: string) {
  if (rule.includes("image") || rule.includes("svg")) return "Images";
  if (rule.includes("contrast") || rule.includes("color")) return "Color";
  if (rule.includes("label") || rule.includes("input") || rule.includes("form")) return "Forms";
  if (rule.includes("link") || rule.includes("navigation")) return "Navigation";
  if (rule.includes("heading") || rule.includes("title")) return "Structure";
  if (rule.includes("aria")) return "ARIA";
  if (rule.includes("lang")) return "Language";
  return "Accessibility";
}

function getHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/* =========================================================
   Inspector Content
   ========================================================= */

function InspectorContent() {
  const params = useSearchParams();
  const requestedIssue = params.get("issue") || "";
  const requestedNode = Number(params.get("node") || "0");

  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("sanalyze:lastAudit");
      if (!stored) {
        setLoadError("No completed audit was found.");
        return;
      }

      const parsed = JSON.parse(stored) as AuditResult;
      if (!parsed || !Array.isArray(parsed.violations)) {
        throw new Error("Invalid audit data.");
      }

      setAudit(parsed);
    } catch (error) {
      console.error("Unable to load inspector data:", error);
      setLoadError("The saved audit could not be loaded. Please run the scan again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const currentIndex = useMemo(() => {
    if (!audit) return -1;
    if (!requestedIssue) {
      return audit.violations.length > 0 ? 0 : -1;
    }
    return audit.violations.findIndex((violation) => violation.id === requestedIssue);
  }, [audit, requestedIssue]);

  const current = audit && currentIndex >= 0 ? audit.violations[currentIndex] : null;

  const nodeIndex =
    current && current.nodes.length > 0
      ? Math.min(Math.max(requestedNode, 0), current.nodes.length - 1)
      : 0;

  const currentNode = current?.nodes[nodeIndex] ?? null;

  const previous =
    audit && currentIndex >= 0 && audit.violations.length > 0
      ? audit.violations[currentIndex > 0 ? currentIndex - 1 : audit.violations.length - 1]
      : null;

  const next =
    audit && currentIndex >= 0 && audit.violations.length > 0
      ? audit.violations[currentIndex < audit.violations.length - 1 ? currentIndex + 1 : 0]
      : null;

  async function copyElement() {
    if (!currentNode?.html) return;
    try {
      await navigator.clipboard.writeText(currentNode.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <AuditShell title="Visual Inspector">
        <div className="max-w-md mx-auto px-4 -mt-5 pt-8 text-center">
          <div className="p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center animate-pulse mb-3">
              <ScanSearch size={22} />
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Loading Inspector...
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Preparing finding context and DOM node details.
            </p>
          </div>
        </div>
      </AuditShell>
    );
  }

  if (!audit || loadError) {
    return (
      <AuditShell title="Visual Inspector">
        <div className="max-w-md mx-auto px-4 -mt-5 pt-8 text-center">
          <div className="p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
            <CircleAlert size={32} className="text-amber-500 mx-auto mb-3" />
            <h1 className="text-base font-bold text-slate-900 dark:text-white">No Audit Available</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{loadError}</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
            >
              Start new scan <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AuditShell>
    );
  }

  if (audit.violations.length === 0) {
    return (
      <AuditShell title="Visual Inspector">
        <div className="max-w-md mx-auto px-4 -mt-5 pt-8 text-center">
          <div className="p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 mx-auto">
              <Check size={24} />
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              No Findings to Inspect
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              The automated scan did not return any confirmed violations for this page.
            </p>
            <Link
              href="/audit/issues"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Back to Issues <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AuditShell>
    );
  }

  if (!current || !currentNode) {
    return (
      <AuditShell title="Visual Inspector">
        <div className="max-w-md mx-auto px-4 -mt-5 pt-8 text-center">
          <div className="p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
            <CircleAlert size={32} className="text-slate-400 mx-auto mb-3" />
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Finding Not Found</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The requested finding does not exist in this scan.
            </p>
            <Link
              href="/audit/issues"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-xs transition"
            >
              Back to findings <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AuditShell>
    );
  }

  const severity = getSeverity(current.impact);
  const category = getCategory(current.id);
  const wcag = getWcagCriterion(current.tags);
  const selector = currentNode.target?.join(" ") || "Selector unavailable";
  const host = getHost(audit.finalUrl);

  const severityBadgeColors: Record<string, string> = {
    Critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    Serious: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Moderate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    Minor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  };

  return (
    <AuditShell title="Visual Inspector">
      {/* حاوية مركزة: أضيفت مسافة أمان سفلية مخصصة للهاتف pb-12 sm:pb-2 */}
      {/* حاوية مركزة مع إزالة المسافة السالبة وضبط مسافات الهاتف */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-8 space-y-5">
        
        {/* Navigation Breadcrumb: شريط كبسولة عائم وواضح */}
        <div className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <Link
            href="/audit/issues"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition active:scale-95 shrink-0"
          >
            <ArrowLeft size={15} /> <span>Back to all findings</span>
          </Link>

          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg shrink-0">
            Finding {currentIndex + 1} of {audit.violations.length}
          </span>
        </div>
        {/* Header */}
        <section className="p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                <ScanSearch size={14} />
                Visual Inspection
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Inspect the affected element
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review the exact HTML, selector and failure context returned by axe-core.
              </p>
            </div>

            {previous && next && (
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <Link
                  href={`/audit/inspector?issue=${encodeURIComponent(previous.id)}`}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  title="Previous finding"
                >
                  <ChevronLeft size={16} />
                </Link>
                <Link
                  href={`/audit/inspector?issue=${encodeURIComponent(next.id)}`}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  title="Next finding"
                >
                  <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Workspace Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Browser Window Mockup */}
          <div className="lg:col-span-8 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            
            <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[200px] sm:max-w-sm truncate shadow-2xs">
                <Globe size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{host}</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 shrink-0">
                <Monitor size={13} />
                <span className="hidden sm:inline">Audited page</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <FileCode2 size={14} /> Captured Element
                  </span>
                  <button
                    type="button"
                    onClick={copyElement}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy HTML"}
                  </button>
                </div>

                <div className="relative border-2 border-rose-500/60 bg-rose-50/15 dark:bg-rose-950/15 rounded-xl p-3 sm:p-4 shadow-xs">
                  <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-sm">
                    <AlertTriangle size={11} /> Finding Target
                  </div>
                  <pre className="font-mono text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-all leading-relaxed">
                    <code>{currentNode.html}</code>
                  </pre>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Target size={14} className="text-sky-500" /> DOM Selector
                </div>
                <code className="block font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 select-all break-all leading-relaxed">
                  {selector}
                </code>
              </div>

              {currentNode.failureSummary && (
                <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-1.5 bg-white dark:bg-[#0c121e]">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Info size={14} className="text-purple-500" />
                    Why axe-core flagged this element
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed break-words">
                    {currentNode.failureSummary}
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 truncate">
              <Target size={13} className="shrink-0" />
              <span className="font-semibold shrink-0">Selected element:</span>
              <code className="font-mono text-slate-700 dark:text-slate-300 truncate text-[11px]">{selector}</code>
            </div>
          </div>

          {/* RIGHT: Details Panel */}
          <aside className="lg:col-span-4 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${severityBadgeColors[severity] || "bg-slate-100 text-slate-600"}`}>
                {severity}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {category}
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {current.help}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {current.description}
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80" />

            {current.nodes.length > 1 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Affected Elements
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Element {nodeIndex + 1} of {current.nodes.length}
                  </span>
                  <div className="flex items-center gap-1">
                    {nodeIndex > 0 && (
                      <Link
                        href={`/audit/inspector?issue=${encodeURIComponent(current.id)}&node=${nodeIndex - 1}`}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                      >
                        <ChevronLeft size={14} />
                      </Link>
                    )}
                    {nodeIndex < current.nodes.length - 1 && (
                      <Link
                        href={`/audit/inspector?issue=${encodeURIComponent(current.id)}&node=${nodeIndex + 1}`}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Accessibility Reference
              </span>
              {current.helpUrl ? (
                <a
                  href={current.helpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                >
                  <div>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                      {wcag}
                    </strong>
                    <span className="text-[10px] font-mono text-slate-400">axe: {current.id}</span>
                  </div>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-emerald-500 transition" />
                </a>
              ) : (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                    {wcag}
                  </strong>
                  <span className="text-[10px] font-mono text-slate-400">axe: {current.id}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href={`/audit/ai-insights?issue=${encodeURIComponent(current.id)}&node=${nodeIndex}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-2xs"
              >
                <Sparkles size={15} /> Explain finding
              </Link>
              <Link
                href={`/audit/ai-insights?issue=${encodeURIComponent(current.id)}&node=${nodeIndex}&mode=fix`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition"
              >
                Suggest fix <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </section>

        {next && (
          <section className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Next Finding
              </span>
              <strong className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {next.help}
              </strong>
            </div>

            <Link
              href={`/audit/inspector?issue=${encodeURIComponent(next.id)}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition self-start sm:self-auto shrink-0 shadow-xs"
            >
              Continue <ArrowRight size={14} />
            </Link>
          </section>
        )}
      </div>
    </AuditShell>
  );
}

export default function Page() {
  return (
    <Suspense>
      <InspectorContent />
    </Suspense>
  );
}