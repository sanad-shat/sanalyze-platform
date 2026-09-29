"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart2,
  Eye,
  FileText,
  Menu,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Sidebar } from "./Sidebar";

/* =========================================================
   مكون الشعار الدقيق والمطابق للصورة الأصلية
   ========================================================= */
function InlineLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 shrink-0 group">
      {/* صندوق الأيقونة الداكن مع تدرج الدرع الدقيق */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#091522] border border-cyan-500/20 shadow-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <linearGradient id="sanalyzeBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="url(#sanalyzeBrandGrad)"
            strokeWidth="2.2"
            fill="none"
          />
          <text
            x="12"
            y="15.2"
            fill="#10b981"
            fontSize="9"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            S
          </text>
        </svg>
      </div>

      {/* كتابة الاسم والسطر الفرعي */}
      <div className="flex flex-col text-left">
        <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          SAN<span className="text-emerald-500">ALYZE</span>
        </span>
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none mt-0.5">
          AUDIT CONSOLE
        </span>
      </div>
    </Link>
  );
}

const navItems = [
  {
    group: "WORKSPACE",
    items: [
      { label: "Overview", href: "/audit", icon: BarChart2 },
      { label: "New scan", href: "/scan", icon: ScanSearch },
      { label: "Issues", href: "/audit/issues", icon: ShieldAlert },
      { label: "Visual inspector", href: "/audit/inspector", icon: Eye },
    ],
  },
  {
    group: "INTELLIGENCE & EXPORT",
    items: [
      { label: "AI insights", href: "/audit/ai-insights", icon: Sparkles },
      { label: "Report", href: "/audit/report", icon: FileText },
    ],
  },
];

export function AuditShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex transition-colors duration-300 antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Sidebar الخاص بالكمبيوتر */}
      <Sidebar />

      {/* القائمة الجانبية المنزلقة لشاشات الموبايل */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-[#0c121e] border-r border-slate-200 dark:border-slate-800 p-5 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <InlineLogo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close Navigation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-6 overflow-y-auto">
              {navItems.map((section) => (
                <div key={section.group} className="space-y-1.5">
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 px-3">
                    {section.group}
                  </span>
                  <div className="space-y-1">
                    {section.items.map(({ label, href, icon: Icon }) => {
                      const isActive = pathname === href;
                      return (
                        <Link
                          key={label}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition ${isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            }`}
                        >
                          <Icon size={16} />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
              Sanalyze • Built by Eng. Sanad Shat
            </div>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* شريط الهيدر */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800/60 bg-white/70 dark:bg-[#090d16]/75 backdrop-blur-xl flex items-center justify-between transition-colors">
          {/* جزء الموبايل: زر القائمة والشعار المباشر */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu size={18} />
            </button>
            <InlineLogo />
          </div>

          {/* مسار الصفحة للكمبيوتر */}
          <div className="hidden lg:flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Workspace</span>
              <span>/</span>
              <span>Auditing Console</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {title}
            </h1>
          </div>

          {/* زر الفحص الجديد */}
          <div className="flex items-center gap-3">
            <Link
              href="/scan"
              className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all duration-200 active:scale-[0.98]"
            >
              <ScanSearch size={14} className="group-hover:rotate-12 transition-transform duration-200" />
              <span>New scan</span>
              <ArrowRight size={13} className="hidden sm:inline group-hover:translate-x-0.5 transition-transform duration-200 opacity-80" />
            </Link>
          </div>
        </header>

        {/* جسم الصفحة */}
        <div className="flex-1 px-4 sm:px-6 pt-4 pb-2 lg:px-8 lg:pt-8 lg:pb-2 max-w-7xl w-full mx-auto">
          {children}
        </div>

        {/* الفوتر */}
        <footer className="mt-auto py-5 border-t border-slate-200/80 dark:border-slate-800/70 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
          <p>© 2026 Sanalyze. All rights reserved. | Developed by Eng. Sanad Shat</p>
        </footer>
      </main>
    </div>
  );
}