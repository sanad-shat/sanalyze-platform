import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Sanalyze | Automated Accessibility Auditor";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070d18",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75% 20%, rgba(35, 136, 255, 0.25), transparent 45%), radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.2), transparent 40%)",
          backgroundSize: "100% 100%, 100% 100%, 100% 100%",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
        }}
      >
        {/* شارة علوية */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 20px",
            borderRadius: "999px",
            background: "rgba(35, 136, 255, 0.12)",
            border: "1px solid rgba(35, 136, 255, 0.35)",
            color: "#60a5fa",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "36px",
          }}
        >
          Automated Accessibility Auditor
        </div>

        {/* الشعار والاسم */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "26px",
          }}
        >
          {/* أيقونة اللوجو البرمجية */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "26px",
              background: "linear-gradient(145deg, #20c9f6 0%, #2f7df5 48%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 16px 40px rgba(47, 125, 245, 0.45)",
              color: "#ffffff",
              fontSize: 52,
              fontWeight: 900,
              fontStyle: "italic",
            }}
          >
            S
          </div>

          {/* نص اللوجو */}
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: "-2px",
            }}
          >
            <span style={{ color: "#ffffff" }}>SAN</span>
            <span
              style={{
                background: "linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              ALYZE
            </span>
          </div>
        </div>

        {/* وصف المنصة */}
        <p
          style={{
            fontSize: 26,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "850px",
            lineHeight: 1.5,
            margin: "0 0 40px 0",
          }}
        >
          Powered by axe-core & AI remediation guidance. Detect WCAG violations and fix them in seconds.
        </p>

        {/* ميزات سريعة */}
        <div
          style={{
            display: "flex",
            gap: "18px",
          }}
        >
          {["WCAG 2.1 AA Audit", "Visual Inspector", "AI Guided Fixes"].map((pill) => (
            <div
              key={pill}
              style={{
                padding: "10px 22px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e2e8f0",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ✓ {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}