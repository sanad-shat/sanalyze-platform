"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  SearchCheck,
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

type IncompleteRule = {
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

  violations: unknown[];
  passes: unknown[];
  incomplete: IncompleteRule[];
};

/* =========================================================
   General manual checklist
   ========================================================= */

const generalChecks = [
  "Can all interactive functionality be operated with a keyboard?",
  "Is the keyboard focus order logical and visible?",
  "Are link descriptions meaningful in context?",
  "Do error messages clearly explain how to recover?",
  "Does important visual content have an appropriate text alternative?",
];

/* =========================================================
   Helpers
   ========================================================= */

function getWcagCriterion(tags: string[]) {
  const criterion = tags.find((tag) =>
    /^wcag\d{3,4}$/.test(tag)
  );

  if (!criterion) {
    return "WCAG review";
  }

  const numbers = criterion.replace("wcag", "");

  if (numbers.length === 3) {
    return `WCAG ${numbers[0]}.${numbers[1]}.${numbers[2]}`;
  }

  if (numbers.length === 4) {
    return `WCAG ${numbers[0]}.${numbers[1]}.${numbers.slice(2)}`;
  }

  return "WCAG review";
}

function getImpactLabel(impact: string | null) {
  if (!impact) {
    return "Review";
  }

  return impact.charAt(0).toUpperCase() + impact.slice(1);
}

/* =========================================================
   Page
   ========================================================= */

export default function ManualReviewPage() {
  const [audit, setAudit] = useState<AuditResult | null>(null);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  /*
    These are user review states only.
    They are NOT scanner results.
  */
  const [reviewedRules, setReviewedRules] = useState<string[]>([]);

  const [completedChecks, setCompletedChecks] = useState<string[]>([]);

  /* =======================================================
     Load real audit
     ======================================================= */

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("sanalyze:lastAudit");

      if (!stored) {
        setLoadError(
          "No completed audit was found. Run a scan before starting manual review."
        );

        return;
      }

      const parsed = JSON.parse(stored) as AuditResult;

      if (!parsed || !Array.isArray(parsed.incomplete)) {
        throw new Error("Invalid audit data.");
      }

      setAudit(parsed);
    } catch (error) {
      console.error("Unable to load manual review data:", error);

      setLoadError(
        "The saved audit could not be loaded. Please run the scan again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const incomplete = audit?.incomplete ?? [];

  const totalReviewNodes = useMemo(() => {
    return incomplete.reduce(
      (total, rule) => total + rule.nodes.length,
      0
    );
  }, [incomplete]);

  const reviewedCount = reviewedRules.length;

  function toggleReviewed(ruleId: string) {
    setReviewedRules((current) =>
      current.includes(ruleId)
        ? current.filter((id) => id !== ruleId)
        : [...current, ruleId]
    );
  }

  function toggleGeneralCheck(check: string) {
    setCompletedChecks((current) =>
      current.includes(check)
        ? current.filter((item) => item !== check)
        : [...current, check]
    );
  }

  /* =======================================================
     Loading
     ======================================================= */

  if (loading) {
    return (
      <AuditShell title="Manual Review">
        <div className="manual-review-page">
          <span className="issues-eyebrow">
            <SearchCheck size={13} />
            Loading review items
          </span>

          <h1 className="mt-3 text-2xl font-bold">
            Preparing manual review
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Reading the incomplete results from the automated audit.
          </p>
        </div>
      </AuditShell>
    );
  }

  /* =======================================================
     Missing audit
     ======================================================= */

  if (!audit || loadError) {
    return (
      <AuditShell title="Manual Review">
        <div className="manual-review-page">
          <span className="issues-eyebrow">
            <CircleAlert size={13} />
            No audit available
          </span>

          <h1 className="mt-3 text-2xl font-bold">
            Run an accessibility scan first
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {loadError}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Start new scan
            <ArrowRight size={14} />
          </Link>
        </div>
      </AuditShell>
    );
  }

  return (
    <AuditShell title="Manual Review">
      <div className="manual-review-page">

        {/* =================================================
            Header
            ================================================= */}

        <section className="issues-header">
          <div>
            <span className="issues-eyebrow">
              <ClipboardCheck size={13} />
              Human verification
            </span>

            <h1>Manual accessibility review</h1>

            <p>
              Review results that axe-core could not determine
              automatically, then continue with checks that require
              human judgment.
            </p>
          </div>

          <div className="issues-complete">
            <SearchCheck size={14} />
            {incomplete.length}{" "}
            {incomplete.length === 1 ? "rule" : "rules"} to review
          </div>
        </section>

        {/* =================================================
            Summary
            ================================================= */}

        <section
          className="panel"
          style={{
            marginTop: "20px",
            padding: "22px",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "18px",
          }}
        >
          <div>
            <small className="text-slate-500">
              Automated rules needing review
            </small>

            <strong
              style={{
                display: "block",
                marginTop: "6px",
                fontSize: "28px",
              }}
            >
              {incomplete.length}
            </strong>
          </div>

          <div>
            <small className="text-slate-500">
              Elements requiring verification
            </small>

            <strong
              style={{
                display: "block",
                marginTop: "6px",
                fontSize: "28px",
              }}
            >
              {totalReviewNodes}
            </strong>
          </div>

          <div>
            <small className="text-slate-500">
              Reviewed in this session
            </small>

            <strong
              style={{
                display: "block",
                marginTop: "6px",
                fontSize: "28px",
              }}
            >
              {reviewedCount}/{incomplete.length}
            </strong>
          </div>
        </section>

        {/* =================================================
            REAL axe incomplete results
            ================================================= */}

        <section style={{ marginTop: "28px" }}>
          <div>
            <h2 className="text-xl font-bold">
              Automated results needing human review
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              These items came directly from the latest axe-core scan.
              They are not confirmed violations until they are reviewed.
            </p>
          </div>

          {incomplete.length === 0 ? (
            <div
              className="panel"
              style={{
                marginTop: "18px",
                padding: "36px",
                textAlign: "center",
              }}
            >
              <CheckCircle2
                size={28}
                style={{
                  margin: "0 auto",
                }}
              />

              <h3
                style={{
                  marginTop: "12px",
                  fontWeight: 700,
                }}
              >
                No automated review items
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                axe-core did not return any incomplete results for this
                scan. General manual accessibility testing is still
                recommended.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {incomplete.map((rule) => {
                const reviewed = reviewedRules.includes(rule.id);

                const wcag = getWcagCriterion(rule.tags);

                const selector =
                  rule.nodes[0]?.target?.join(" ") || "—";

                return (
                  <article
                    key={rule.id}
                    className="panel"
                    style={{
                      padding: "22px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "20px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            <AlertTriangle size={13} />
                            {getImpactLabel(rule.impact)}
                          </span>

                          <span className="text-xs text-slate-500">
                            {wcag}
                          </span>
                        </div>

                        <h3
                          style={{
                            marginTop: "10px",
                            fontSize: "16px",
                            fontWeight: 700,
                          }}
                        >
                          {rule.help}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {rule.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleReviewed(rule.id)}
                        style={{
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                        className={
                          reviewed
                            ? "overview-btn primary"
                            : "overview-btn secondary"
                        }
                      >
                        <Check size={14} />

                        {reviewed ? "Reviewed" : "Mark reviewed"}
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: "18px",
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <small className="text-slate-500">
                          Rule
                        </small>

                        <code
                          style={{
                            display: "block",
                            marginTop: "5px",
                            fontSize: "12px",
                          }}
                        >
                          {rule.id}
                        </code>
                      </div>

                      <div>
                        <small className="text-slate-500">
                          Affected elements
                        </small>

                        <strong
                          style={{
                            display: "block",
                            marginTop: "5px",
                          }}
                        >
                          {rule.nodes.length}
                        </strong>
                      </div>

                      <div>
                        <small className="text-slate-500">
                          Example selector
                        </small>

                        <code
                          style={{
                            display: "block",
                            marginTop: "5px",
                            fontSize: "12px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {selector}
                        </code>
                      </div>
                    </div>

                    {rule.nodes[0]?.failureSummary && (
                      <div
                        style={{
                          marginTop: "18px",
                          padding: "14px",
                          borderRadius: "12px",
                          background: "var(--soft)",
                        }}
                      >
                        <small className="text-slate-500">
                          What needs verification
                        </small>

                        <p className="mt-2 text-sm leading-6">
                          {rule.nodes[0].failureSummary}
                        </p>
                      </div>
                    )}

                    {rule.helpUrl && (
                      <a
                        href={rule.helpUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "16px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        View rule documentation
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            General human checklist
            ================================================= */}

        <section style={{ marginTop: "36px" }}>
          <h2 className="text-xl font-bold">
            Additional manual checks
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            These checks are general human-review tasks. They are not
            findings reported by the automated scanner.
          </p>

          <div className="mt-5 space-y-3">
            {generalChecks.map((check) => {
              const completed = completedChecks.includes(check);

              return (
                <label
                  key={check}
                  className="panel flex cursor-pointer items-center gap-4 p-5"
                >
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => toggleGeneralCheck(check)}
                    className="h-4 w-4 accent-cyan-400"
                  />

                  <span
                    className={
                      completed
                        ? "text-slate-500 line-through"
                        : ""
                    }
                  >
                    {check}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* =================================================
            Disclaimer
            ================================================= */}

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            fontSize: "12px",
            lineHeight: 1.7,
            color: "var(--muted)",
          }}
        >
          <CircleAlert
            size={15}
            style={{ flexShrink: 0, marginTop: "2px" }}
          />

          <span>
            Marking an item as reviewed records only your review state
            for this page session. It does not automatically establish
            WCAG conformance.
          </span>
        </div>
      </div>
    </AuditShell>
  );
}