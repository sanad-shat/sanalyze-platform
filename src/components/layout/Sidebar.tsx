"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CircleAlert,
  Eye,
  FileText,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { name: "Overview", href: "/audit", icon: BarChart3 },
  { name: "New scan", href: "/scan", icon: ScanSearch },
  { name: "Issues", href: "/audit/issues", icon: CircleAlert },
  { name: "Visual inspector", href: "/audit/inspector", icon: Eye },
];

const exportItems = [
  { name: "AI insights", href: "/audit/ai-insights", icon: Sparkles },
  { name: "Report", href: "/audit/report", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/audit") return pathname === "/audit";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#070b12] flex flex-col justify-between shrink-0 hidden lg:flex h-screen sticky top-0 z-40 transition-colors">
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="h-16 px-6 flex items-center border-b border-slate-200/80 dark:border-slate-800/80">
          <Logo />
        </div>

        <div className="px-4 py-6 space-y-6">
          <div>
            <span className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Workspace
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Icon size={16} className={active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Intelligence & Export
            </span>
            <nav className="space-y-1">
              {exportItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Icon size={16} className={active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="px-2 py-1">
          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Sanalyze · v1.0
          </div>
          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            Built by Eng. Sanad Shat
          </div>
        </div>
      </div>
    </aside>
  );
}