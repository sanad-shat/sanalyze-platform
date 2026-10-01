import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 shrink-0 group ${className}`}>
      {/* أيقونة المربع الأسود مع الدرع المتطابق تماماً */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#07131e] border border-cyan-500/20 shadow-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <linearGradient id="sanalyzeExactShield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* مسار الدرع الخارجي */}
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="url(#sanalyzeExactShield)"
            strokeWidth="2.2"
            fill="none"
          />

          {/* حرف S الأخضر المضيء في المنتصف */}
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

      {/* كتابة SANALYZE AUDIT CONSOLE */}
      <div className="flex flex-col text-left">
        <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          SAN<span className="text-emerald-700 dark:text-emerald-400">ALYZE</span>
        </span>
       <span className="text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase leading-none mt-0.5">
          AUDIT CONSOLE
        </span>
      </div>
    </Link>
  );
}