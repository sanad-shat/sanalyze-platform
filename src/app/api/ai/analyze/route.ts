import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FindingRequest = {
  ruleId?: string;
  impact?: string | null;
  help?: string;
  description?: string;
  tags?: string[];
  html?: string;
  selector?: string;
  failureSummary?: string;
  mode?: "explain" | "fix";
};

type AIResult = {
  explanation: string;
  whyItMatters: string;
  suggestedFixExplanation: string;
  suggestedCode: string | null;
  caveat: string;
};

// حلول جاهزة ومعيارية لأشهر قواعد axe-core في حال انقطاع الـ API أو الضغط اللحظي
function getLocalFallbackGuidance(ruleId: string, html: string, help: string): AIResult {
  switch (ruleId) {
    case "landmark-one-main":
      return {
        explanation: "The page does not contain a <main> landmark container, which is critical for screen readers to navigate directly to primary content.",
        whyItMatters: "Users relying on screen readers or keyboard shortcuts cannot bypass repetitive navigation and jump directly to the primary information.",
        suggestedFixExplanation: "Wrap your central page content in a semantic <main> tag or designate the main container using role=\"main\".",
        suggestedCode: "<main id=\"main-content\">\n  <!-- Your page primary content here -->\n</main>",
        caveat: "Ensure that each document has only one visible top-level <main> landmark element."
      };
    case "landmark-unique":
      return {
        explanation: "Multiple landmark regions of the same type exist without unique accessible labels (aria-label or aria-labelledby).",
        whyItMatters: "Screen reader users hearing duplicate landmark announcements cannot distinguish between different navigation or header blocks.",
        suggestedFixExplanation: "Add an aria-label attribute to differentiate identical landmarks (e.g., primary vs secondary navigation).",
        suggestedCode: "<header aria-label=\"Global Site Header\">\n  <!-- Header content -->\n</header>",
        caveat: "Keep landmark labels concise and descriptive for screen reader efficiency."
      };
    case "page-has-heading-one":
      return {
        explanation: "The document is missing a top-level <h1> heading.",
        whyItMatters: "Headings structure document hierarchy; the primary <h1> informs users immediately of the topic or function of the page.",
        suggestedFixExplanation: "Add a clear and descriptive <h1> at the beginning of the main content area.",
        suggestedCode: "<main>\n  <h1>Page Title</h1>\n</main>",
        caveat: "Avoid skipping heading levels and avoid having multiple unrelated <h1> tags per view."
      };
    default:
      return {
        explanation: help || "An accessibility violation was detected on this DOM node.",
        whyItMatters: "Addressing this issue improves compliance with WCAG standards and ensures accessible user interaction.",
        suggestedFixExplanation: "Review semantic markup and ARIA attributes for the affected element according to axe-core guidelines.",
        suggestedCode: html ? `<!-- Review element -->\n${html}` : null,
        caveat: "Validate the remediation in browser accessibility tools and screen readers."
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const body = (await request.json()) as FindingRequest;
    const { ruleId = "", impact = "moderate", help = "", description = "", tags = [], html = "", selector = "", failureSummary = "", mode = "explain" } = body;

    // محاولة استدعاء Gemini أولاً
    if (apiKey) {
      const prompt = `
You are an accessibility auditor assistant in Sanalyze. Explain this axe-core finding concisely:
Rule ID: ${ruleId}
Impact: ${impact}
Finding: ${help}
Description: ${description}
Tags: ${tags.join(", ")}
Affected HTML: ${html}
Selector: ${selector}
Failure Summary: ${failureSummary}
Requested Mode: ${mode}

Respond ONLY with valid JSON using this exact structure:
{
  "explanation": "Clear explanation of the issue.",
  "whyItMatters": "Why this affects users.",
  "suggestedFixExplanation": "How to fix it.",
  "suggestedCode": "HTML/JSX code snippet if applicable, otherwise null.",
  "caveat": "Verification note."
}
`;

      const candidateModels = ["gemini-3.8-flash", "gemini-1.5-flash", "gemini-2.0-flash"];

      for (const model of candidateModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
                maxOutputTokens: 1000,
              },
            }),
          });

          const data = await res.json();
          const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (res.ok && outputText) {
            const cleaned = outputText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
            const parsed = JSON.parse(cleaned);
            return NextResponse.json({
              success: true,
              provider: "gemini",
              result: parsed,
            });
          }
        } catch {
          // المتابعة للموديل التالي أو الـ Fallback
        }
      }
    }

    // Fallback محلي فوري وآمن يضمن استقرار المنصة 100%
    const fallbackResult = getLocalFallbackGuidance(ruleId, html, help);
    return NextResponse.json({
      success: true,
      provider: "sanalyze-engine",
      result: fallbackResult,
    });
  } catch (error: any) {
    console.error("[Sanalyze AI Route Error]:", error);
    return NextResponse.json(
      {
        success: true,
        provider: "sanalyze-engine",
        result: getLocalFallbackGuidance("generic", "", "Accessibility finding remediation"),
      }
    );
  }
}