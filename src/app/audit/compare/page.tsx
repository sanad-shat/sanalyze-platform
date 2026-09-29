"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GitCompareArrows,
  Minus,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

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

type FindingChange = {
  id: string;
  title: string;
  impact: string | null;
};

/* =========================================================
   Constants
   ========================================================= */

const AUDIT_HISTORY_KEY = "sanalyze:auditHistory";

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

function getDifference(current: number, previous: number) {
  return current - previous;
}

function getSeverityLabel(value: string | null) {
  if (!value) return "Review";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/*
  For V1 we compare rule IDs.

  Example:
  button-name exists in previous but not current
  => resolved rule.

  This is intentionally rule-level comparison rather than
  pretending that individual DOM nodes are identical between
  two different page loads.
*/
function compareFindings(
  previous: AuditResult,
  current: AuditResult
) {
  const previousMap = new Map(
    previous.violations.map((violation) => [
      violation.id,
      violation,
    ])
  );

  const currentMap = new Map(
    current.violations.map((violation) => [
      violation.id,
      violation,
    ])
  );

  const resolved: FindingChange[] = [];
  const newFindings: FindingChange[] = [];
  const persistent: FindingChange[] = [];

  for (const violation of previous.violations) {
    if (!currentMap.has(violation.id)) {
      resolved.push({
        id: violation.id,
        title: violation.help,
        impact: violation.impact,
      });
    }
  }

  for (const violation of current.violations) {
    if (!previousMap.has(violation.id)) {
      newFindings.push({
        id: violation.id,
        title: violation.help,
        impact: violation.impact,
      });
    } else {
      persistent.push({
        id: violation.id,
        title: violation.help,
        impact: violation.impact,
      });
    }
  }

  return {
    resolved,
    newFindings,
    persistent,
  };
}

/* =========================================================
   Small UI components
   ========================================================= */

function Delta({
  value,
  inverse = false,
  suffix = "",
}: {
  value: number;
  inverse?: boolean;
  suffix?: string;
}) {
  if (value === 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          color: "var(--muted)",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        <Minus size={13} />
        No change
      </span>
    );
  }

  const improved = inverse ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUp : ArrowDown;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        color: improved ? "#0f9f8c" : "#e25563",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      <Icon size={13} />
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function SeverityRow({
  label,
  previous,
  current,
}: {
  label: string;
  previous: number;
  current: number;
}) {
  const difference = current - previous;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto auto",
        alignItems: "center",
        gap: "18px",
        padding: "14px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <strong
        style={{
          fontSize: "13px",
        }}
      >
        {label}
      </strong>

      <span
        style={{
          minWidth: "32px",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: "13px",
        }}
      >
        {previous}
      </span>

      <ArrowRight
        size={14}
        style={{
          color: "var(--muted)",
        }}
      />

      <div
        style={{
          minWidth: "82px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <strong>{current}</strong>

        {difference === 0 ? (
          <Minus
            size={13}
            style={{
              color: "var(--muted)",
            }}
          />
        ) : difference < 0 ? (
          <ArrowDown
            size={13}
            style={{
              color: "#0f9f8c",
            }}
          />
        ) : (
          <ArrowUp
            size={13}
            style={{
              color: "#e25563",
            }}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Page
   ========================================================= */

export default function Page() {
  const [history, setHistory] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     Load real scan history
     ======================================================= */

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AUDIT_HISTORY_KEY);

      if (!stored) {
        setHistory([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        throw new Error("Audit history is not valid.");
      }

      setHistory(parsed as AuditResult[]);
    } catch (err) {
      console.error("Unable to load audit history:", err);

      setError(
        "The saved audit history could not be loaded. Run new scans to rebuild it."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
    History is saved newest first.

    [0] = current/latest
    [1] = previous
  */
  const current = history[0] ?? null;
  const previous = history[1] ?? null;

  const comparison = useMemo(() => {
    if (!previous || !current) {
      return null;
    }

    return compareFindings(previous, current);
  }, [previous, current]);

  /* =======================================================
     Loading
     ======================================================= */

  if (loading) {
    return (
      <AuditShell title="Compare Audits">
        <div className="panel p-7">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <RefreshCw size={17} className="spin" />

            <span>Loading audit history...</span>
          </div>
        </div>
      </AuditShell>
    );
  }

  /* =======================================================
     Storage error
     ======================================================= */

  if (error) {
    return (
      <AuditShell title="Compare Audits">
        <div className="panel p-7">
          <CircleAlert size={28} />

          <h2
            style={{
              marginTop: "14px",
            }}
          >
            Audit history unavailable
          </h2>

          <p
            style={{
              marginTop: "8px",
              color: "var(--muted)",
            }}
          >
            {error}
          </p>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              marginTop: "20px",
              fontWeight: 700,
            }}
          >
            Run a new scan
            <ArrowRight size={14} />
          </Link>
        </div>
      </AuditShell>
    );
  }

  /* =======================================================
     Need at least two scans
     ======================================================= */

  if (!previous || !current) {
    return (
      <AuditShell title="Compare Audits">
        <div className="panel p-7">
          <div
            style={{
              maxWidth: "650px",
              margin: "30px auto",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto",
                borderRadius: "14px",
                background: "var(--soft)",
                border: "1px solid var(--line)",
              }}
            >
              <GitCompareArrows size={23} />
            </div>

            <p
              style={{
                marginTop: "18px",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".16em",
                color: "#0f9f8c",
              }}
            >
              AUDIT COMPARISON
            </p>

            <h2
              style={{
                marginTop: "8px",
                fontSize: "26px",
              }}
            >
              Two scans are required
            </h2>

            <p
              style={{
                marginTop: "10px",
                color: "var(--muted)",
                lineHeight: 1.7,
              }}
            >
              Sanalyze needs at least two successful audits
              before it can compare changes between scans.
            </p>

            <p
              style={{
                marginTop: "8px",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              {history.length === 1
                ? "1 audit is currently saved."
                : "No saved audits were found."}
            </p>

            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "22px",
                padding: "11px 16px",
                borderRadius: "10px",
                background: "#1677ff",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              <ScanSearch size={15} />
              Run another scan
            </Link>
          </div>
        </div>
      </AuditShell>
    );
  }

  /* =======================================================
     Real comparison data
     ======================================================= */

  const scoreDifference = getDifference(
    current.score,
    previous.score
  );

  const affectedDifference = getDifference(
    current.summary.affectedElements,
    previous.summary.affectedElements
  );

  const failedRulesDifference = getDifference(
    current.summary.failedRules,
    previous.summary.failedRules
  );

  const reviewDifference = getDifference(
    current.summary.needsReview,
    previous.summary.needsReview
  );

  const samePage =
    getHostname(previous.finalUrl) ===
    getHostname(current.finalUrl);

  /* =======================================================
     UI
     ======================================================= */

  return (
    <AuditShell title="Compare Audits">
      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        {/* Header */}

        <section className="panel p-7">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: ".16em",
                  color: "#0f9f8c",
                }}
              >
                MEASURE IMPACT
              </p>

              <h2
                style={{
                  marginTop: "7px",
                  fontSize: "25px",
                }}
              >
                Compare audit results
              </h2>

              <p
                style={{
                  marginTop: "7px",
                  color: "var(--muted)",
                  fontSize: "13px",
                }}
              >
                Compare the two most recent successful
                automated accessibility audits.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              <Clock3 size={14} />

              {history.length} saved{" "}
              {history.length === 1 ? "audit" : "audits"}
            </div>
          </div>

          {!samePage && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginTop: "20px",
                padding: "12px 14px",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                background: "var(--soft)",
              }}
            >
              <TriangleAlert
                size={16}
                style={{
                  marginTop: "1px",
                  color: "#d58b17",
                  flexShrink: 0,
                }}
              />

              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                These scans are from different hostnames.
                Changes may reflect different pages rather than
                improvements to the same page.
              </p>
            </div>
          )}
        </section>

        {/* Before / After */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) auto minmax(0, 1fr)",
            alignItems: "stretch",
            gap: "14px",
          }}
        >
          {/* Previous */}

          <article className="panel p-7">
            <p
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: ".16em",
                color: "var(--muted)",
              }}
            >
              PREVIOUS AUDIT
            </p>

            <h3
              style={{
                marginTop: "10px",
                fontSize: "17px",
              }}
            >
              {getHostname(previous.finalUrl)}
            </h3>

            <p
              style={{
                marginTop: "5px",
                fontSize: "11px",
                color: "var(--muted)",
              }}
            >
              {formatDate(previous.scannedAt)}
            </p>

            <div
              style={{
                marginTop: "24px",
                fontSize: "50px",
                fontWeight: 800,
                letterSpacing: "-3px",
                lineHeight: 1,
              }}
            >
              {previous.score}
              <span
                style={{
                  marginLeft: "3px",
                  fontSize: "15px",
                  color: "var(--muted)",
                  letterSpacing: 0,
                }}
              >
                %
              </span>
            </div>

            <p
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              Automated audit score
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "22px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--muted)",
                  }}
                >
                  Affected
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "18px",
                  }}
                >
                  {previous.summary.affectedElements}
                </strong>
              </div>

              <div
                style={{
                  padding: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--muted)",
                  }}
                >
                  Failed rules
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "18px",
                  }}
                >
                  {previous.summary.failedRules}
                </strong>
              </div>
            </div>
          </article>

          {/* Arrow */}

          <div
            style={{
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: "var(--card)",
              }}
            >
              <ArrowRight size={17} />
            </div>
          </div>

          {/* Current */}

          <article className="panel p-7">
            <p
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: ".16em",
                color: "#0f9f8c",
              }}
            >
              CURRENT AUDIT
            </p>

            <h3
              style={{
                marginTop: "10px",
                fontSize: "17px",
              }}
            >
              {getHostname(current.finalUrl)}
            </h3>

            <p
              style={{
                marginTop: "5px",
                fontSize: "11px",
                color: "var(--muted)",
              }}
            >
              {formatDate(current.scannedAt)}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "50px",
                  fontWeight: 800,
                  letterSpacing: "-3px",
                  lineHeight: 1,
                }}
              >
                {current.score}
                <span
                  style={{
                    marginLeft: "3px",
                    fontSize: "15px",
                    color: "var(--muted)",
                    letterSpacing: 0,
                  }}
                >
                  %
                </span>
              </div>

              <Delta
                value={scoreDifference}
                suffix=" pts"
              />
            </div>

            <p
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              Automated audit score
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "22px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--muted)",
                  }}
                >
                  Affected
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "18px",
                    }}
                  >
                    {current.summary.affectedElements}
                  </strong>

                  <Delta
                    value={affectedDifference}
                    inverse
                  />
                </div>
              </div>

              <div
                style={{
                  padding: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--muted)",
                  }}
                >
                  Failed rules
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "18px",
                    }}
                  >
                    {current.summary.failedRules}
                  </strong>

                  <Delta
                    value={failedRulesDifference}
                    inverse
                  />
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* Summary */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <article className="panel p-5">
            <CheckCircle2
              size={18}
              style={{
                color: "#0f9f8c",
              }}
            />

            <strong
              style={{
                display: "block",
                marginTop: "14px",
                fontSize: "26px",
              }}
            >
              {comparison?.resolved.length ?? 0}
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "3px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              Resolved rules
            </span>
          </article>

          <article className="panel p-5">
            <CircleAlert
              size={18}
              style={{
                color: "#e25563",
              }}
            />

            <strong
              style={{
                display: "block",
                marginTop: "14px",
                fontSize: "26px",
              }}
            >
              {comparison?.newFindings.length ?? 0}
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "3px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              New rules
            </span>
          </article>

          <article className="panel p-5">
            <ShieldCheck
              size={18}
              style={{
                color: "#1677ff",
              }}
            />

            <strong
              style={{
                display: "block",
                marginTop: "14px",
                fontSize: "26px",
              }}
            >
              {comparison?.persistent.length ?? 0}
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "3px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              Persistent rules
            </span>
          </article>

          <article className="panel p-5">
            <GitCompareArrows
              size={18}
              style={{
                color: "#8b5cf6",
              }}
            />

            <strong
              style={{
                display: "block",
                marginTop: "14px",
                fontSize: "26px",
              }}
            >
              {current.summary.needsReview}
            </strong>

            <div
              style={{
                marginTop: "3px",
              }}
            >
              <span
                style={{
                  marginRight: "8px",
                  fontSize: "12px",
                  color: "var(--muted)",
                }}
              >
                Needs review
              </span>

              <Delta
                value={reviewDifference}
                inverse
              />
            </div>
          </article>
        </section>

        {/* Severity comparison */}

        <section className="panel p-7">
          <div>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: ".15em",
                color: "var(--muted)",
              }}
            >
              SEVERITY COMPARISON
            </p>

            <h3
              style={{
                marginTop: "7px",
                fontSize: "18px",
              }}
            >
              Affected elements by severity
            </h3>

            <p
              style={{
                marginTop: "6px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              Counts come directly from the two saved
              axe-core audit summaries.
            </p>
          </div>

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr auto auto auto",
                gap: "18px",
                paddingBottom: "10px",
                borderBottom: "1px solid var(--line)",
                color: "var(--muted)",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: ".08em",
              }}
            >
              <span>SEVERITY</span>
              <span>BEFORE</span>
              <span />
              <span>NOW</span>
            </div>

            <SeverityRow
              label="Critical"
              previous={previous.summary.severity.critical}
              current={current.summary.severity.critical}
            />

            <SeverityRow
              label="Serious"
              previous={previous.summary.severity.serious}
              current={current.summary.severity.serious}
            />

            <SeverityRow
              label="Moderate"
              previous={previous.summary.severity.moderate}
              current={current.summary.severity.moderate}
            />

            <SeverityRow
              label="Minor"
              previous={previous.summary.severity.minor}
              current={current.summary.severity.minor}
            />
          </div>
        </section>

        {/* Finding changes */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          {/* Resolved */}

          <article className="panel p-6">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <CheckCircle2
                size={17}
                style={{
                  color: "#0f9f8c",
                }}
              />

              <h3
                style={{
                  fontSize: "15px",
                }}
              >
                Resolved
              </h3>
            </div>

            <p
              style={{
                marginTop: "6px",
                fontSize: "11px",
                color: "var(--muted)",
              }}
            >
              Present before, absent now.
            </p>

            <div
              style={{
                display: "grid",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              {comparison?.resolved.length ? (
                comparison.resolved.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "11px",
                      border: "1px solid var(--line)",
                      borderRadius: "9px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "12px",
                      }}
                    >
                      {item.title}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "5px",
                        fontSize: "10px",
                        color: "var(--muted)",
                      }}
                    >
                      {item.id} ·{" "}
                      {getSeverityLabel(item.impact)}
                    </span>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  No resolved rules detected.
                </p>
              )}
            </div>
          </article>

          {/* New */}

          <article className="panel p-6">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <CircleAlert
                size={17}
                style={{
                  color: "#e25563",
                }}
              />

              <h3
                style={{
                  fontSize: "15px",
                }}
              >
                New findings
              </h3>
            </div>

            <p
              style={{
                marginTop: "6px",
                fontSize: "11px",
                color: "var(--muted)",
              }}
            >
              Absent before, present now.
            </p>

            <div
              style={{
                display: "grid",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              {comparison?.newFindings.length ? (
                comparison.newFindings.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "11px",
                      border: "1px solid var(--line)",
                      borderRadius: "9px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "12px",
                      }}
                    >
                      {item.title}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "5px",
                        fontSize: "10px",
                        color: "var(--muted)",
                      }}
                    >
                      {item.id} ·{" "}
                      {getSeverityLabel(item.impact)}
                    </span>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  No new rules detected.
                </p>
              )}
            </div>
          </article>

          {/* Persistent */}

          <article className="panel p-6">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <ShieldCheck
                size={17}
                style={{
                  color: "#1677ff",
                }}
              />

              <h3
                style={{
                  fontSize: "15px",
                }}
              >
                Persistent
              </h3>
            </div>

            <p
              style={{
                marginTop: "6px",
                fontSize: "11px",
                color: "var(--muted)",
              }}
            >
              Detected in both audits.
            </p>

            <div
              style={{
                display: "grid",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              {comparison?.persistent.length ? (
                comparison.persistent.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "11px",
                      border: "1px solid var(--line)",
                      borderRadius: "9px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "12px",
                      }}
                    >
                      {item.title}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "5px",
                        fontSize: "10px",
                        color: "var(--muted)",
                      }}
                    >
                      {item.id} ·{" "}
                      {getSeverityLabel(item.impact)}
                    </span>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  No persistent rules detected.
                </p>
              )}
            </div>
          </article>
        </section>

        {/* Important accuracy note */}

        <section
          className="panel p-5"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "11px",
          }}
        >
          <TriangleAlert
            size={17}
            style={{
              flexShrink: 0,
              marginTop: "1px",
              color: "#d58b17",
            }}
          />

          <div>
            <strong
              style={{
                fontSize: "12px",
              }}
            >
              Comparison scope
            </strong>

            <p
              style={{
                marginTop: "4px",
                color: "var(--muted)",
                fontSize: "11px",
                lineHeight: 1.65,
              }}
            >
              Resolved, new, and persistent findings are
              compared at the axe-core rule level. Dynamic
              content and page changes can affect results.
              Automated comparison does not establish WCAG
              conformance.
            </p>
          </div>
        </section>
      </div>
    </AuditShell>
  );
}