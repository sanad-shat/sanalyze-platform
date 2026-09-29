"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  FileText,
  Globe,
  Menu,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { Logo } from "@/components/ui/Logo";

/* =========================================================
   Features Data
   ========================================================= */

const features = [
  {
    icon: ScanSearch,
    title: "Automated Scanning",
    description:
      "Scan live URLs against WCAG 2.1 criteria using axe-core automated rules.",
  },
  {
    icon: Sparkles,
    title: "AI Guidance",
    description:
      "Transform automated findings into clear explanations and code-level remediation.",
  },
  {
    icon: Eye,
    title: "Visual Inspector",
    description:
      "Inspect captured HTML snippets, DOM selectors, and failing element context directly.",
  },
  {
    icon: BarChart3,
    title: "Executive Summary",
    description:
      "Review automated accessibility score, severity breakdown, and pass rates at a glance.",
  },
  {
    icon: FileText,
    title: "Instant PDF Reports",
    description:
      "Export multi-page executive audit documentation directly to your device.",
  },
];

/* =========================================================
   Main Component
   ========================================================= */

export default function Home() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();

  /* ================= Start scan ================= */
  function startScan() {
    const value = url.trim();

    if (!value) {
      setUrlError("Enter a website URL to start the audit.");
      return;
    }

    let parsed: URL;

    try {
      parsed = new URL(value);
    } catch {
      setUrlError("Enter a complete URL such as https://example.com");
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setUrlError("Only HTTP and HTTPS URLs are supported.");
      return;
    }

    setUrlError("");
    router.push(`/scan?url=${encodeURIComponent(parsed.toString())}`);
  }

  /* ================= Focus scanner ================= */
  function focusScanner() {
    setMobileMenuOpen(false);
    const input = document.querySelector<HTMLInputElement>("#hero-url-input");
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* ================= Copy example ================= */
  async function copyExampleFix() {
    const example = `<img
  src="headphones.jpg"
  alt="Black wireless headphones"
  class="product-image"
/>`;

    try {
      await navigator.clipboard.writeText(example);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Unable to copy example:", error);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/5 blur-[130px] rounded-full" />
      </div>

      {/* ================ القائمة الجانبية المنزلقة لشاشات الهاتف ================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-[#0c121e] border-r border-slate-200 dark:border-slate-800 p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close Navigation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 py-6 space-y-4">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 px-3">
                NAVIGATION
              </span>
              <div className="flex flex-col space-y-1.5">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:bg-emerald-50 active:text-emerald-600 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:bg-emerald-50 active:text-emerald-600 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#accessibility"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:bg-emerald-50 active:text-emerald-600 transition-colors"
                >
                  Standards
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={focusScanner}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                Start Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================ الهيدر الثابت مع خلفية معتمة تمنع التداخل ================ */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/70 bg-white/95 dark:bg-[#070b12]/95 backdrop-blur-md shadow-xs">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 md:hidden cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu size={18} />
            </button>
            <Logo />
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2">
              Features
            </a>
            <a href="#how" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2">
              How It Works
            </a>
            <a href="#accessibility" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2">
              Standards
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={focusScanner}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
            >
              Start Audit
            </button>
          </div>
        </nav>
      </header>

      {/* ================ الحاوية مع مسافة علوية كافية للهيدر ================ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-14 pt-24 pb-12">
        {/* ================= Hero Section ================= */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Details */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <Sparkles size={12} />
              <span>Automated Accessibility Audit Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              Find accessibility issues. <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent">
                Understand how to fix them.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Scan web pages with automated axe-core checks, visually inspect affected elements, and get AI-powered remediation guidance instantly.
            </p>

            {/* URL Input Box */}
            <div className="space-y-2 pt-1 max-w-lg">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl border border-slate-300/80 dark:border-slate-800 bg-white/95 dark:bg-[#0c121e] shadow-md shadow-slate-200/50 dark:shadow-none backdrop-blur-xl focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all">
                <div className="flex items-center gap-2 px-3 flex-1">
                  <Globe size={16} className="text-slate-400 shrink-0" />
                  <input
                    id="hero-url-input"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && startScan()}
                    placeholder="https://yourwebsite.com"
                    aria-label="Website URL"
                    className="w-full py-2 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={startScan}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs tracking-wide shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <span>Analyze Website</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {urlError && (
                <p id="home-url-error" role="alert" className="text-xs font-semibold text-rose-500 pl-2">
                  {urlError}
                </p>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {["No account required", "Axe-core engine", "AI code fixes", "Executive PDF reports"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 bg-slate-100/60 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right Dashboard Mockup */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c121e] backdrop-blur-2xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>

                <div className="text-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                    Accessibility finding
                  </span>
                  <span className="text-[10px] text-slate-400 block">Automated audit → AI guidance</span>
                </div>

                <button
                  type="button"
                  onClick={focusScanner}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  Try a scan
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-extrabold uppercase tracking-wider">
                        <TriangleAlert size={11} />
                        CRITICAL
                      </span>
                      <span className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] font-semibold">
                        WCAG 4.1.2
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Buttons must have discernible text
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Rule: button-name</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Captured Finding</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    <span>AFFECTED ELEMENT</span>
                    <span className="text-emerald-400 font-bold">Live DOM Snapshot</span>
                  </div>
                  <code className="text-[11px] text-rose-300 leading-relaxed block overflow-x-auto whitespace-pre">
                    {`<button class="ui-datepicker-trigger" type="button">
  <img title="" alt="" src="calendar.png">
</button>`}
                  </code>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">SELECTOR</span>
                  <code className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-mono">
                    .departure-date &gt; .ui-datepicker-trigger
                  </code>
                </div>

                <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 text-[10px] tracking-wider uppercase">
                      <Sparkles size={11} />
                      AI REMEDIATION
                    </span>
                    <span className="text-[10px] text-slate-400">Ready to implement</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Add an accessible label that clearly describes the button&apos;s purpose for assistive screen readers.
                  </p>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <code className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate mr-2">
                      aria-label=&quot;Select departure date&quot;
                    </code>
                    <ArrowRight size={12} className="text-slate-400 shrink-0" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1 text-[10px] font-bold text-slate-400">
                  <span>Scan</span>
                  <ArrowRight size={10} />
                  <span>Issues</span>
                  <ArrowRight size={10} />
                  <span>Visual Inspector</span>
                  <ArrowRight size={10} />
                  <span className="text-emerald-500">AI Fixes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Features Grid: توزيع من عمودين للموبايل ================= */}
        <section id="features" className="space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              End-to-End Accessibility Tooling
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Everything needed to identify, inspect, and remedy web conformance barriers.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {features.map(({ icon: Icon, title, description }, idx) => (
              <article
                key={title}
                className={`p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0c121e] backdrop-blur-md hover:border-emerald-500/40 transition-all flex flex-col justify-between ${idx === features.length - 1 ? "col-span-2 md:col-span-1" : ""
                  }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2.5">
                    <Icon size={17} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ================= Inspector Section ================= */}
        <section id="how" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0c121e] backdrop-blur-xl shadow-md overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[10px] text-slate-400 pl-2">Visual inspector simulation</span>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Target Context</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Product Card Image</h4>
                <p className="text-[11px] text-slate-500">Live element highlighted with bounding context.</p>
                <div className="relative py-4 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-xs">
                  IMAGE
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                    !
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-extrabold text-[10px]">
                  <TriangleAlert size={11} />
                  Detected issue
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Missing alternative text</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Informative elements must provide accessible name alternatives.
                </p>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Snippet</span>
                  <code className="block p-2 rounded bg-slate-950 text-[11px] font-mono text-emerald-400">
                    &lt;img class=&quot;product-image&quot;&gt;
                  </code>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={focusScanner}
                    className="w-full sm:w-auto px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition cursor-pointer text-center"
                  >
                    ✦ Explore AI Fix
                  </button>
                  <button
                    type="button"
                    onClick={focusScanner}
                    className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center"
                  >
                    Start Scan
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              ELEMENT INSPECTOR
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Understand <span className="underline decoration-emerald-500 underline-offset-4">exactly</span> what failed.
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sanalyze connects automated findings directly to captured element data so you can review the rule, selector, HTML, and failure context before updating production code.
            </p>

            <div className="space-y-1.5 pt-1">
              {[
                "Captured affected HTML node",
                "Precise CSS DOM selector",
                "Axe-core rule details and WCAG criteria",
                "AI-assisted remediation explanations",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= AI Guidance Section ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              AI-ASSISTED GUIDANCE
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
              Don&apos;t just find problems. <br />
              <span className="text-indigo-600 dark:text-indigo-400">Understand how to resolve them.</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Send detected issues to our AI guidance engine to understand root causes, evaluate user impact, and receive ready-to-use code solutions.
            </p>

            <button
              type="button"
              onClick={focusScanner}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition shadow-sm cursor-pointer"
            >
              <span>Run an audit</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-indigo-500/20 bg-white/70 dark:bg-[#0c121e] backdrop-blur-xl p-4 sm:p-5 shadow-md space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <BookOpenCheck size={18} />
              </div>
              <div>
                <b className="text-xs text-slate-900 dark:text-white block">AI Remediation Example</b>
                <small className="text-[10px] text-slate-400">Contextual code suggestion</small>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              If an informative image does not expose an accessible text alternative, users who rely on screen readers will miss critical context. Supply concise, descriptive alternative text.
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Suggested Code Fix:</span>
              <div className="relative rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                <code className="text-xs text-emerald-400 font-mono block whitespace-pre overflow-x-auto">
                  {`<img
  src="headphones.jpg"
  alt="Black wireless headphones"
  class="product-image"
/>`}
                </code>
                <button
                  type="button"
                  onClick={copyExampleFix}
                  aria-label="Copy example fix"
                  className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              AI recommendations are built from rule AST specifications and should be validated prior to production release.
            </p>
          </div>
        </section>

        {/* ================= Accessibility Standards Bar ================= */}
        <section id="accessibility" className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0c121e]/70 backdrop-blur-md space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Standards-based accessibility auditing
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
            {[
              "Automated checks powered by axe-core",
              "WCAG 2.1 A & AA reference tagging",
              "Interactive visual element inspector",
              "Direct PDF executive reporting",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ================= Final CTA Strip ================= */}
        <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-600/10 via-teal-500/5 to-transparent p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Start with a focused accessibility audit.
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg">
                Scan any live web page, review automated violations, inspect DOM nodes, and export executive PDF reports.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={focusScanner}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-emerald-600/25 transition cursor-pointer active:scale-95"
          >
            <span>Analyze Website</span>
            <ArrowRight size={14} />
          </button>
        </section>
      </div>

      {/* ================ Footer ================ */}
      <footer className="py-6 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-500">
       © 2026 Sanalyze. All rights reserved. | Developed by Eng. Sanad Shat
      </footer>
    </main>
  );
}