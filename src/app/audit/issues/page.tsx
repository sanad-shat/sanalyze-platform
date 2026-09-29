"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CircleAlert,
  Search,
  Sparkles,
  Tag,
  ShieldCheck,
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
  violations: AxeViolation[];
};

/* =========================================================
   Issues Content Component
   ========================================================= */

function IssuesContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("severity") || "All";

  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("sanalyze:lastAudit");
      if (stored) {
        setAudit(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const violations = useMemo(() => audit?.violations || [], [audit]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Critical: 0,
      Serious: 0,
      Moderate: 0,
      Minor: 0,
    };
    violations.forEach((v) => {
      const key = v.impact ? v.impact.charAt(0).toUpperCase() + v.impact.slice(1) : "Minor";
      if (counts[key] !== undefined) counts[key]++;
    });
    return counts;
  }, [violations]);

  const totalAffected = useMemo(() => {
    return violations.reduce((acc, v) => acc + (v.nodes?.length || 1), 0);
  }, [violations]);

  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchesSeverity =
        activeFilter === "All" ||
        (v.impact && v.impact.toLowerCase() === activeFilter.toLowerCase());

      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        v.help.toLowerCase().includes(query) ||
        v.id.toLowerCase().includes(query) ||
        v.tags.some((t) => t.toLowerCase().includes(query));

      return matchesSeverity && matchesSearch;
    });
  }, [violations, activeFilter, search]);

  const filters = ["All", "Critical", "Serious", "Moderate", "Minor"];

  if (loading) {
    return (
      <AuditShell title="Issues">
        <div className="py-20 text-center text-xs text-slate-400">Loading issues...</div>
      </AuditShell>
    );
  }

  return (
    <AuditShell title="Issues">
      {/* الحاوية: مسافة أمان سفلية للموبايل فقط لعدم ملامسة الفوتر وأيقونة الديف */}
      <div className="space-y-6 pb-6 md:pb-6 max-w-5xl mx-auto">

        {/* ================= Header Details ================= */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <AlertTriangle size={13} />
            <span>Automated Findings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Accessibility issues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Review the real accessibility findings detected during the automated axe-core audit.
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={13} />
              Scan complete
            </span>
          </div>
        </div>

        {/* ================= KPI Stats Grid ================= */}
        {/* في الموبايل: شبكة مدمجة 2x2، وفي الويب: صفحة واحدة كاملة مع بطاقة كبيرة */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="col-span-2 md:col-span-1 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0c121e] backdrop-blur-md flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Failed rules</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{violations.length}</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{totalAffected} affected elements</div>
          </div>

          {[
            { label: "Critical", count: severityCounts.Critical, dot: "bg-rose-500" },
            { label: "Serious", count: severityCounts.Serious, dot: "bg-amber-500" },
            { label: "Moderate", count: severityCounts.Moderate, dot: "bg-yellow-500" },
            { label: "Minor", count: severityCounts.Minor, dot: "bg-sky-500" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0c121e] flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                <span className="text-2xl font-black text-slate-900 dark:text-white">{item.count}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">{item.label}</span>
            </div>
          ))}
        </div>

        {/* ================= Search & Filters ================= */}
        <div className="space-y-3">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search findings, rules or WCAG criteria..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0c121e] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* الفلاتر: تمرير أفقي بالموبايل لمنع تراكب الأسطر، وتوزيع مرن بالويب */}
          <div className="flex items-center gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 max-w-full md:flex-wrap no-scrollbar">
            {filters.map((f) => {
              const active = activeFilter.toLowerCase() === f.toLowerCase();
              const count = f === "All" ? violations.length : severityCounts[f] || 0;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 md:shrink flex items-center gap-1.5 border transition cursor-pointer active:scale-95 ${active
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                      : "bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                >
                  <span>{f}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= Findings Cards List ================= */}
        <div className="space-y-4">
          {filteredViolations.map((v) => (
            <article
              key={v.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c121e] backdrop-blur-md shadow-xs space-y-3.5"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                  <Tag size={16} />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {v.help}
                  </h2>
                  <div className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                    {v.impact || "Moderate"}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                    {v.description}
                  </p>
                </div>
              </div>

              {/* Tags & Selector */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {v.id}
                </span>
                {v.nodes[0]?.target?.[0] && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 max-w-[200px] md:max-w-md truncate">
                    {v.nodes[0].target[0]}
                  </span>
                )}
              </div>

              {/* أسفل البطاقة: في الموبايل شبكة مريحة، وفي الويب صف أفقي كامل تماماً كما كان */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center justify-between md:justify-start gap-4 text-xs px-0.5 md:px-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Standard:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {v.tags?.find((t) => t.startsWith("wcag"))?.toUpperCase() || "WCAG 2.1"}
                    </span>
                  </div>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Impacted:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {v.nodes?.length || 1} {(v.nodes?.length || 1) === 1 ? "element" : "elements"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex items-center gap-2 pt-0.5 md:pt-0 w-full md:w-auto">
                  <Link
                    href={`/audit/ai-insights?issue=${encodeURIComponent(v.id)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 hover:bg-indigo-100 transition active:scale-98 text-center"
                  >
                    <Sparkles size={14} />
                    <span>Explain</span>
                  </Link>

                  <Link
                    href={`/audit/inspector?issue=${encodeURIComponent(v.id)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition active:scale-98 text-center"
                  >
                    <span>Inspect</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* ================= Bottom Notice Banner ================= */}
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
          <CircleAlert size={16} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Note: Automated audit notice:</strong> These findings do not establish complete WCAG conformance; manual review is still recommended.
          </p>
        </div>

      </div>
    </AuditShell>
  );
}

export default function IssuesPage() {
  return (
    <Suspense>
      <IssuesContent />
    </Suspense>
  );
}