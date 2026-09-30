"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Info,
  Lightbulb,
  Loader2,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Split,
  Terminal,
  TriangleAlert,
  TrendingUp,
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

type AIResult = {
  explanation: string;
  whyItMatters: string;
  suggestedFixExplanation: string;
  suggestedCode: string | null;
  caveat: string;
};

type AIResponse = {
  success: boolean;
  result?: AIResult;
  error?: string;
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

function cleanFailureSummary(value: string) {
  return value
    .replace(/^Fix any of the following:\s*/i, "")
    .replace(/^Fix all of the following:\s*/i, "")
    .trim();
}

/* =========================================================
   AI Insights Content
   ========================================================= */

function AIInsightsContent() {
  const params = useSearchParams();
  const issueId = params.get("issue") || params.get("rule") || "";
  const requestedNode = Number(params.get("node") || "0");
  const requestedMode = params.get("mode") === "fix" ? "fix" : "explain";

  /* Audit state */
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* AI state */
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  /* Diff View state */
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  /* Copy state */
  const [copied, setCopied] = useState(false);
  const [fixCopied, setFixCopied] = useState(false);

  /* Load real audit */
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
      console.error("Unable to load finding guidance:", error);
      setLoadError("The saved audit could not be loaded. Please run the scan again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Select finding */
  const finding = useMemo(() => {
    if (!audit) return null;
    if (issueId) {
      return audit.violations.find((item) => item.id === issueId) || null;
    }
    return audit.violations[0] || null;
  }, [audit, issueId]);

  const nodeIndex =
    finding && finding.nodes.length > 0
      ? Math.min(Math.max(requestedNode, 0), finding.nodes.length - 1)
      : 0;

  const node = finding?.nodes[nodeIndex] ?? null;

  /* AI request */
  useEffect(() => {
    if (!finding || !node) return;

    let cancelled = false;

    async function requestAI() {
      try {
        setAiLoading(true);
        setAiError("");
        setAiResult(null);

        const selector = node?.target?.join(" ") || "";

        const response = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ruleId: finding?.id,
            impact: finding?.impact,
            help: finding?.help,
            description: finding?.description,
            helpUrl: finding?.helpUrl,
            tags: finding?.tags,
            html: node?.html,
            selector,
            failureSummary: node?.failureSummary,
            mode: requestedMode,
          }),
        });

        const raw = await response.text();
        let data: AIResponse | null = null;

        if (raw) {
          try {
            data = JSON.parse(raw) as AIResponse;
          } catch {
            throw new Error("The AI endpoint returned an invalid response.");
          }
        }

        if (!response.ok) {
          throw new Error(data?.error || `AI request failed with status ${response.status}.`);
        }

        if (!data?.success || !data.result) {
          throw new Error(data?.error || "The AI response did not contain guidance.");
        }

        if (!cancelled) {
          setAiResult(data.result);
        }
      } catch (error) {
        console.error("[Sanalyze AI Insights]", error);
        if (!cancelled) {
          setAiError(error instanceof Error ? error.message : "Unable to generate AI guidance.");
        }
      } finally {
        if (!cancelled) {
          setAiLoading(false);
        }
      }
    }

    requestAI();

    return () => {
      cancelled = true;
    };
  }, [finding, node, requestedMode]);

  /* Retry */
  async function retryAI() {
    if (!finding || !node) return;

    try {
      setAiLoading(true);
      setAiError("");
      setAiResult(null);

      const selector = node.target?.join(" ") || "";

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId: finding.id,
          impact: finding.impact,
          help: finding.help,
          description: finding.description,
          helpUrl: finding.helpUrl,
          tags: finding.tags,
          html: node.html,
          selector,
          failureSummary: node.failureSummary,
          mode: requestedMode,
        }),
      });

      const raw = await response.text();
      let data: AIResponse | null = null;

      if (raw) {
        try {
          data = JSON.parse(raw) as AIResponse;
        } catch {
          throw new Error("The AI endpoint returned an invalid response.");
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || `AI request failed with status ${response.status}.`);
      }

      if (!data?.success || !data.result) {
        throw new Error(data?.error || "The AI response did not contain guidance.");
      }

      setAiResult(data.result);
    } catch (error) {
      console.error("[Sanalyze AI retry]", error);
      setAiError(error instanceof Error ? error.message : "Unable to generate AI guidance.");
    } finally {
      setAiLoading(false);
    }
  }

  /* Copy helpers */
  async function copyElement() {
    if (!node) return;
    try {
      await navigator.clipboard.writeText(node.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  async function copyFix() {
    if (!aiResult?.suggestedCode) return;
    try {
      await navigator.clipboard.writeText(aiResult.suggestedCode);
      setFixCopied(true);
      setTimeout(() => setFixCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <AuditShell title="AI Insights">
        <div className="max-w-md mx-auto px-4 -mt-5 pt-8 text-center">
          <div className="p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center animate-pulse mb-3">
              <ScanSearch size={22} />
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Preparing finding guidance...
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Loading rule definition & failure context from axe-core.
            </p>
          </div>
        </div>
      </AuditShell>
    );
  }

  if (!audit || loadError) {
    return (
      <AuditShell title="AI Insights">
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
      <AuditShell title="AI Insights">
        <div className="max-w-md mx-auto px-4 -mt-5 pt-8 text-center">
          <div className="p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <Check size={24} />
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              No Violations to Analyze
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              This scan achieved 100% automated compliance! No violations were flagged.
            </p>
            <Link
              href="/audit/issues"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Review Issues Table <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AuditShell>
    );
  }

  if (!finding || !node) {
    return (
      <AuditShell title="AI Insights">
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

  const severity = getSeverity(finding.impact);
  const wcag = getWcagCriterion(finding.tags);
  const selector = node.target?.join(" ") || "Selector unavailable";
  const failureSummary = cleanFailureSummary(node.failureSummary || "");
  const inspectorHref = `/audit/inspector?issue=${encodeURIComponent(finding.id)}&node=${nodeIndex}`;

  const severityBadgeColors: Record<string, string> = {
    Critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    Serious: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Moderate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    Minor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  };

  return (
    <AuditShell title="AI Insights">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-8 space-y-5">

        {/* شريط التنقل العلوي المحسّن كبسولة منفصلة */}
        <div className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <Link
            href="/audit/issues"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition active:scale-95 shrink-0"
          >
            <ArrowLeft size={15} /> <span>All issues</span>
          </Link>

          <Link
            href={inspectorHref}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline active:scale-95 shrink-0"
          >
            <Eye size={15} /> <span>Visual Inspector</span>
          </Link>
        </div>

        {/* بطاقة الرأس وسياق المشكلة */}
        <section className="p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md">
                  <Sparkles size={12} /> AI Assisted Remediation
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${severityBadgeColors[severity] || "bg-slate-100 text-slate-600"
                    }`}
                >
                  {severity} Impact
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white pt-0.5 leading-snug">
                {finding.help}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                <span>Rule ID:</span>
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono text-[11px]">{finding.id}</code>
                <span>· Standard:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{wcag}</span>
              </p>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
              <div className="text-left md:text-right border-r-0 md:border-r border-slate-200 dark:border-slate-800 md:pr-4">
                <div className="text-[11px] text-slate-400 font-medium">Affected Nodes</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  Node {nodeIndex + 1} of {finding.nodes.length}
                </div>
              </div>
              <button
                type="button"
                onClick={retryAI}
                disabled={aiLoading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer active:scale-95"
                title="Regenerate AI Analysis"
              >
                <RefreshCw size={15} className={aiLoading ? "animate-spin text-purple-500" : ""} />
              </button>
            </div>
          </div>
        </section>

        {/* المحتوى الأساسي */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* العمود الأيسر: الشرح البرمجي ومقارنة الأكواد */}
          <div className="lg:col-span-8 space-y-6">

            {/* بطاقة الشرح من الذكاء الاصطناعي */}
            <article className="p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Lightbulb size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Root Cause & Accessibility Impact
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Why axe-core flagged this element and how it affects assistive technologies
                  </p>
                </div>
              </div>

              {aiLoading && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5">
                  <Loader2 size={22} className="animate-spin text-purple-500" />
                  <p className="text-xs font-medium text-slate-500">
                    Sanalyze AI is formulating remediation guidance...
                  </p>
                </div>
              )}

              {!aiLoading && aiError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <CircleAlert size={15} /> Unable to load AI guidance
                  </div>
                  <p className="text-xs">{aiError}</p>
                  <button
                    type="button"
                    onClick={retryAI}
                    className="mt-1 text-xs font-bold underline hover:no-underline cursor-pointer"
                  >
                    Retry Analysis
                  </button>
                </div>
              )}

              {!aiLoading && aiResult && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      The Issue Explained
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {aiResult.explanation}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Info size={14} className="text-purple-500 shrink-0" /> Why this matters to users:
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {aiResult.whyItMatters}
                    </p>
                  </div>
                </div>
              )}
            </article>

            {/* مقارنة الكود التفاعلية (Diff) */}
            <article className="p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Code2 size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Remediation Code Diff
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Inspect current failing code vs. AI compliant proposal
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode("split")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${viewMode === "split"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                  >
                    <Split size={12} className="inline mr-1" /> Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("unified")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${viewMode === "unified"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                  >
                    <Terminal size={12} className="inline mr-1" /> Stacked
                  </button>
                </div>
              </div>

              {/* خطة العمل */}
              {aiResult?.suggestedFixExplanation && (
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-purple-500/5 border border-purple-500/15 rounded-xl p-3.5">
                  <span className="font-bold text-purple-600 dark:text-purple-400 mr-1.5">Action Plan:</span>
                  {aiResult.suggestedFixExplanation}
                </div>
              )}

              {/* حاويات الأكواد */}
              <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>

                {/* العنصر المعيوب الحالي */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-rose-500/25 bg-slate-950 text-slate-200">
                  <div className="px-3.5 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Current (Failing)
                    </span>
                    <button
                      type="button"
                      onClick={copyElement}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-3.5 font-mono text-xs overflow-x-auto text-rose-300 leading-relaxed max-h-56">
                    <code>{node.html}</code>
                  </pre>
                </div>

                {/* الحل المقترح من الذكاء الاصطناعي */}
                <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950 text-slate-200">
                  <div className="px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Proposed Fix
                    </span>
                    {aiResult?.suggestedCode && (
                      <button
                        type="button"
                        onClick={copyFix}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        {fixCopied ? <Check size={12} /> : <Copy size={12} />}
                        {fixCopied ? "Copied!" : "Copy Code"}
                      </button>
                    )}
                  </div>
                  <pre className="p-3.5 font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed max-h-56">
                    <code>
                      {aiLoading
                        ? "/* Formulating accessible code proposal... */"
                        : aiResult?.suggestedCode || "/* No automatic code rewrite available for this rule */"}
                    </code>
                  </pre>
                </div>
              </div>

              {/* تنبيه الاستخدام */}
              {aiResult?.caveat && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                  <TriangleAlert size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Remediation Caution: </span>
                    {aiResult.caveat}
                  </div>
                </div>
              )}
            </article>

          </div>

          {/* العمود الأيمن: محدد العنصر والمعلومات الفنية */}
          <aside className="lg:col-span-4 space-y-5">

            {/* بطاقة التأثير على الفحص */}
            <article className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <TrendingUp size={14} /> Expected Scan Impact
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Fixing this element will resolve <strong className="text-slate-900 dark:text-white">1 violation</strong> and directly increase your overall score toward WCAG AA compliance.
              </p>
              <div className="pt-1 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Target Standard:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{wcag} Pass</span>
              </div>
            </article>

            {/* محدد DOM */}
            <article className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] space-y-2.5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                DOM Locator
              </span>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                {selector}
              </div>
              <Link
                href={inspectorHref}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-98"
              >
                Highlight on Screen <ArrowRight size={13} />
              </Link>
            </article>

            {/* تفاصيل المحرك */}
            <article className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Engine Diagnostics
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {failureSummary || finding.description}
              </p>
              {finding.helpUrl && (
                <a
                  href={finding.helpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                >
                  Official axe documentation <ExternalLink size={12} />
                </a>
              )}
            </article>

            {/* التذكير السفلي مع هامش للهاتف فقط */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed text-center px-1">
              Sanalyze AI generates recommendations using contextual LLM prompts with AST definitions. Verify changes in your staging environment.
            </p>

          </aside>

        </section>

      </div>
    </AuditShell>
  );
}

/* =========================================================
   Export
   ========================================================= */

export default function Page() {
  return (
    <Suspense>
      <AIInsightsContent />
    </Suspense>
  );
}