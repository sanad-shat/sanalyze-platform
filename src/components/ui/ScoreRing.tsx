"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({
  score,
  size = 110,
  strokeWidth = 10,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // تحديد اللون حسب النتيجة
  const getColor = (val: number) => {
    if (val >= 90) return "#10b981"; // emerald-500
    if (val >= 70) return "#f59e0b"; // amber-500
    return "#f43f5e"; // rose-500
  };

  const ringColor = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* خلفية الدائرة الرمادية */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          fill="transparent"
        />
        {/* دائرة النسبة الملونة */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* النصوص الداخلية بتباين عالي وواضح */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {score}
          </span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-0.5">
            %
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 -mt-0.5">
          Score
        </span>
      </div>
    </div>
  );
}