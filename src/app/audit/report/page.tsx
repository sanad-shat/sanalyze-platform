"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  Globe2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import jsPDF from "jspdf";

import { AuditShell } from "@/components/layout/AuditShell";

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
    severity: Severity;
  };
  violations: AxeViolation[];
  passes: unknown[];
  incomplete: unknown[];
};

const LAST_AUDIT_KEY = "sanalyze:lastAudit";

/* =========================================================
   Helpers
   ========================================================= */

function formatDate(value: string) {
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

function getSeverityLabel(value: string | null) {
  if (!value) return "Review";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getWcagCriterion(tags: string[]) {
  const wcagTag = tags.find((tag) => /^wcag\d{3,4}$/i.test(tag));
  if (!wcagTag) return null;
  const digits = wcagTag.replace(/^wcag/i, "").split("");
  if (digits.length < 3) return null;
  return digits.join(".");
}

function cleanFailureSummary(value: string) {
  return value.replace(/^Fix (?:any|all) of the following:\s*/i, "").trim();
}

/* =========================================================
   Page Component
   ========================================================= */

export default function ReportPage() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(LAST_AUDIT_KEY);
      if (!stored) {
        setError("No completed audit found. Run a scan before generating a report.");
        return;
      }

      const parsed = JSON.parse(stored) as AuditResult;
      if (!parsed || !parsed.summary || typeof parsed.score !== "number") {
        throw new Error("Stored audit data is invalid.");
      }

      setAudit(parsed);
    } catch (err) {
      console.error("Unable to load report:", err);
      setError("The saved audit could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const severityItems = useMemo(() => {
    if (!audit) return [];
    return [
      {
        label: "Critical",
        value: audit.summary.severity.critical,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50",
      },
      {
        label: "Serious",
        value: audit.summary.severity.serious,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
      },
      {
        label: "Moderate",
        value: audit.summary.severity.moderate,
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50",
      },
      {
        label: "Minor",
        value: audit.summary.severity.minor,
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50",
      },
    ];
  }, [audit]);

  function generateDirectPdf() {
    if (!audit) return;
    try {
      setExporting(true);
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const host = getHostname(audit.finalUrl || audit.requestedUrl);
      const hostClean = host.replace(/\./g, "-");

      let y = 18;

      const drawHeader = () => {
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(14, 12, 9, 9, 2, 2, "F");
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("S", 16.5, 18.5);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.text("SANALYZE", 26, 18.5);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("ACCESSIBILITY AUDIT REPORT", pageWidth - 14, 18, { align: "right" });

        doc.setDrawColor(226, 232, 240);
        doc.line(14, 24, pageWidth - 14, 24);
      };

      drawHeader();
      y = 30;

      // بطاقة الموقع
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, "FD");

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(host, 20, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Scanned URL: ${audit.finalUrl}`, 20, y + 15);
      doc.text(`Audit Date: ${formatDate(audit.scannedAt)}  |  Engine: axe-core standard`, 20, y + 21);

      y += 32;

      // بطاقات الـ KPI
      const boxW = (pageWidth - 28 - 12) / 4;
      const stats = [
        { label: "AUDIT SCORE", val: `${audit.score}%`, color: [16, 185, 129] },
        { label: "AFFECTED NODES", val: `${audit.summary.affectedElements}`, color: [225, 29, 72] },
        { label: "FAILED RULES", val: `${audit.summary.failedRules}`, color: [217, 119, 6] },
        { label: "PASSED CHECKS", val: `${audit.summary.passedChecks}`, color: [16, 185, 129] },
      ];

      stats.forEach((st, i) => {
        const bx = 14 + i * (boxW + 4);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(bx, y, boxW, 20, 2.5, 2.5, "FD");

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(st.label, bx + 4, y + 6);

        doc.setFontSize(13);
        doc.setTextColor(st.color[0], st.color[1], st.color[2]);
        doc.text(st.val, bx + 4, y + 15);
      });

      y += 28;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Detected Issues & Violations (${audit.violations.length})`, 14, y);
      y += 6;

      audit.violations.forEach((violation, idx) => {
        const cardHeight = 44;
        if (y + cardHeight > pageHeight - 20) {
          doc.addPage();
          drawHeader();
          y = 32;
        }

        const wcag = getWcagCriterion(violation.tags);
        const impact = getSeverityLabel(violation.impact);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, pageWidth - 28, cardHeight, 2.5, 2.5, "FD");

        if (impact === "Critical") doc.setFillColor(225, 29, 72);
        else if (impact === "Serious") doc.setFillColor(217, 119, 6);
        else doc.setFillColor(14, 165, 233);
        doc.roundedRect(14, y, 2.5, cardHeight, 1, 1, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${violation.help}`, 20, y + 7);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(`Rule: ${violation.id}  |  Impact: ${impact}  ${wcag ? `|  WCAG ${wcag}` : ""}`, 20, y + 13);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(violation.description, pageWidth - 42);
        doc.text(descLines.slice(0, 2), 20, y + 19);

        if (violation.nodes[0]?.html) {
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(20, y + 25, pageWidth - 40, 10, 1.5, 1.5, "FD");

          doc.setFont("courier", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(51, 65, 85);
          const rawSnippet = violation.nodes[0].html.replace(/\s+/g, " ").trim();
          const cleanSnippet = rawSnippet.length > 95 ? rawSnippet.substring(0, 95) + "..." : rawSnippet;
          doc.text(cleanSnippet, 23, y + 31.5);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Affected instances: ${violation.nodes.length}`, 20, y + 40);

        y += cardHeight + 4;
      });

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text("Sanalyze SaaS Accessibility Platform — Confidential Audit", 14, pageHeight - 7);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: "right" });
      }

      doc.save(`Sanalyze-Report-${hostClean}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <AuditShell title="Report">
        <div className="max-w-4xl mx-auto px-4 -mt-5">
          <div className="p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-emerald-700 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Generating report overview...
            </span>
          </div>
        </div>
      </AuditShell>
    );
  }

  if (!audit || error) {
    return (
      <AuditShell title="Report">
        <div className="max-w-md mx-auto px-4 -mt-5 text-center">
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
            <CircleAlert size={36} className="text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Unavailable</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{error}</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-md transition"
            >
              Start New Scan <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </AuditShell>
    );
  }

  const host = getHostname(audit.finalUrl || audit.requestedUrl);
  const evaluatedRules = audit.summary.passedChecks + audit.summary.failedRules;
  const passRate =
    evaluatedRules > 0
      ? Math.round((audit.summary.passedChecks / evaluatedRules) * 100)
      : 100;

  return (
    <AuditShell title="Report">
      {/* حاوية مركزة وأنيقة لعرض مريح للعين (max-w-5xl) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-5 pb-2 space-y-6">

        {/* 1. Header Card مع زر التنزيل المباشر */}
        <section className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <FileText size={14} />
                Accessibility Audit Report
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 break-all">
                {host}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Formal automated accessibility audit report generated from the latest Sanalyze scan.
              </p>
            </div>

            <button
              type="button"
              disabled={exporting}
              onClick={generateDirectPdf}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
            >
              {exporting ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              {exporting ? "Generating PDF..." : "Download PDF Report"}
            </button>
          </div>

          {/* معلومات الفحص الوصفية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
                <Globe2 size={13} /> Scanned Page
              </span>
              <strong className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all block">
                {audit.finalUrl}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
                <Clock3 size={13} /> Scan Date
              </span>
              <strong className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                {formatDate(audit.scannedAt)}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
                <ShieldCheck size={13} /> Audit Engine
              </span>
              <strong className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                axe-core automated checks
              </strong>
            </div>
          </div>
        </section>

        {/* 2. Executive Summary */}
        <section className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs space-y-5">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Executive Summary
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Automated audit results
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              This summary reflects the automated rules evaluated during this accessibility scan.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                <ShieldCheck size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {audit.score}%
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Automated baseline
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2.5">
                <AlertTriangle size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Affected</span>
              <strong className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {audit.summary.affectedElements}
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                DOM elements
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2.5">
                <CircleAlert size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Failed Rules</span>
              <strong className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                {audit.summary.failedRules}
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Unique violations
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                <CheckCircle2 size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passed</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {audit.summary.passedChecks}
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {passRate}% of rules verified
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center mb-2.5">
                <FileText size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Needs Review</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {audit.summary.needsReview}
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Manual review
              </p>
            </div>
          </div>
        </section>

        {/* 3. Severity Breakdown */}
        <section className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Severity Breakdown
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Affected elements by impact
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {severityItems.map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.bg} ${item.color}`}>
                    {item.label}
                  </span>
                </div>
                <strong className={`text-2xl sm:text-3xl font-black mt-2 ${item.color}`}>
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Automated Findings List */}
        <section className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Automated Findings
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Detected accessibility issues
              </h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {audit.violations.length} {audit.violations.length === 1 ? "rule" : "rules"}
            </span>
          </div>

          <div className="space-y-4">
            {audit.violations.map((violation, index) => {
              const wcag = getWcagCriterion(violation.tags);

              return (
                <article
                  key={`${violation.id}-${index}`}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#090d16]"
                >
                  {/* Finding Top Bar */}
                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Finding {index + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {violation.help}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">Rule: {violation.id}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {getSeverityLabel(violation.impact)}
                      </span>
                      {wcag && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          WCAG {wcag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Finding Content */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {violation.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>
                        <strong className="text-slate-900 dark:text-white">{violation.nodes.length}</strong>{" "}
                        affected {violation.nodes.length === 1 ? "element" : "elements"}
                      </span>
                      {violation.helpUrl && (
                        <a
                          href={violation.helpUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          axe rule reference <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {/* Styled Terminal Code Box */}
                    {violation.nodes[0] && (
                      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Example affected element
                        </span>
                        <div className="bg-slate-900 dark:bg-black/80 rounded-lg p-3 border border-slate-800 overflow-x-auto">
                          <code className="block font-mono text-xs text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">
                            {violation.nodes[0].html}
                          </code>
                        </div>
                        {violation.nodes[0].failureSummary && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                            {cleanFailureSummary(violation.nodes[0].failureSummary)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 5. Methodology */}
        <section className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Methodology
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              How this report was generated
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ["1", "Page loaded", "Sanalyze opened the target URL in an automated headless browser context."],
              ["2", "axe-core evaluated", "Automated rules and color contrast were tested against live DOM nodes."],
              ["3", "Results organized", "Detected violations, impact levels, and WCAG criteria were indexed."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mb-2">
                  {number}
                </span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  {title}
                </strong>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Testing Limitation Notice */}
        <section className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 flex items-start gap-3.5">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
              Automated Testing Limitation
            </strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This report represents automated accessibility testing results and does not establish complete WCAG conformance. Full accessibility compliance also requires human judgment and keyboard-only navigational tests.
            </p>
          </div>
        </section>

        {/* System Timestamp Badge */}
        <div className="pt-2 px-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e] text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span>Generated by <strong className="font-semibold text-slate-700 dark:text-slate-200">Sanalyze</strong></span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{formatDate(audit.scannedAt)}</span>
          </div>
        </div>

      </div>
    </AuditShell>
  );
}