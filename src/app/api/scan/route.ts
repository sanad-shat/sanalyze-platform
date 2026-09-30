import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser } from "puppeteer-core";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AxeNode = {
  impact: string | null;
  html: string;
  target: string[];
  failureSummary?: string;
};

type AxeResultItem = {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
};

type AxeResults = {
  violations: AxeResultItem[];
  passes: AxeResultItem[];
  incomplete: AxeResultItem[];
};

let cachedAxeSource: string | null = null;

async function getAxeSource(): Promise<string> {
  if (cachedAxeSource) {
    return cachedAxeSource;
  }

  const axePath = path.join(
    process.cwd(),
    "node_modules",
    "axe-core",
    "axe.min.js"
  );

  cachedAxeSource = await fs.readFile(axePath, "utf8");
  return cachedAxeSource;
}

function formatScanError(rawMessage: string): string {
  if (rawMessage.includes("Timeout") || rawMessage.includes("exceeded")) {
    return "The scan timed out. The website is responding too slowly or blocking automated access.";
  }
  if (rawMessage.includes("ERR_NAME_NOT_RESOLVED")) {
    return "Domain name could not be resolved. Please check if the URL is typed correctly.";
  }
  if (rawMessage.includes("ERR_CONNECTION_REFUSED")) {
    return "Connection was refused by the target host.";
  }
  if (rawMessage.includes("net::ERR")) {
    return "Network error occurred while trying to connect to the target website.";
  }
  return rawMessage;
}

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    console.log("[Sanalyze] Scan request received");

    // 1. Read URL
    const body = await request.json().catch(() => ({}));
    const input = String(body?.url || "").trim();

    if (!input) {
      return NextResponse.json(
        { success: false, error: "Website URL is required." },
        { status: 400 }
      );
    }

    // 2. Validate URL
    let target: URL;
    try {
      target = new URL(input);
    } catch {
      return NextResponse.json(
        { success: false, error: "Please enter a valid website URL." },
        { status: 400 }
      );
    }

    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return NextResponse.json(
        { success: false, error: "Only HTTP and HTTPS URLs are supported." },
        { status: 400 }
      );
    }

    console.log("[Sanalyze] Target:", target.toString());

    // 3. Read axe-core script
    const axeSource = await getAxeSource();

    // 4. Launch Browser (Browserless on Vercel, or Local Chrome on localhost)
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    const browserlessToken = process.env.BROWSERLESS_API_KEY?.trim();

    if (isProduction && browserlessToken) {
      console.log("[Sanalyze] Connecting to remote Browserless instance");
      browser = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
      });
    } else {
      console.log("[Sanalyze] Launching local Chrome browser");
      browser = await puppeteer.launch({
        headless: true,
        channel: "chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SanalyzeAudit/1.0"
    );

   // Block heavy media only
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 5. Open website
    console.log("[Sanalyze] Opening target page");
    const response = await page.goto(target.toString(), {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // مهلة إضافية لضمان اكتمال تحميل عناصر الـ DOM والتفاعلات
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // فحص ما إذا كان الموقع قام بحجب الصفحة أو إرجاع رمز منع
    const pageTitle = await page.title();
    console.log(`[Sanalyze] Page loaded: "${pageTitle}" (Status: ${response?.status()})`);

    if (
      pageTitle.toLowerCase().includes("just a moment") ||
      pageTitle.toLowerCase().includes("attention required") ||
      pageTitle.toLowerCase().includes("access denied") ||
      response?.status() === 403
    ) {
      throw new Error("Target website blocked automated scanning with bot protection (Cloudflare/WAF).");
    }
    // 6. Inject axe.min.js
    console.log("[Sanalyze] Injecting axe-core");
    await page.addScriptTag({ content: axeSource });

    const axeAvailable = await page.evaluate(() => {
      return typeof (window as any).axe !== "undefined";
    });

    if (!axeAvailable) {
      throw new Error("axe-core could not be initialized inside the target page.");
    }

    // 7. Run accessibility audit
    console.log("[Sanalyze] Running axe-core");
    const axeResults = (await page.evaluate(async () => {
      const axeInstance = (window as any).axe;
      return await axeInstance.run(document, {
        resultTypes: ["violations", "passes", "incomplete"],
      });
    })) as AxeResults;

    // 8. Normalize violations
    const violations = axeResults.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      nodes: violation.nodes.map((node) => ({
        impact: node.impact,
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary || "",
      })),
    }));

    // 9. Normalize passes
    const passes = axeResults.passes.map((rule) => ({
      id: rule.id,
      impact: rule.impact,
      description: rule.description,
      help: rule.help,
      helpUrl: rule.helpUrl,
      tags: rule.tags,
      nodes: rule.nodes.length,
    }));

    // 10. Normalize incomplete results
    const incomplete = axeResults.incomplete.map((rule) => ({
      id: rule.id,
      impact: rule.impact,
      description: rule.description,
      help: rule.help,
      helpUrl: rule.helpUrl,
      tags: rule.tags,
      nodes: rule.nodes.map((node) => ({
        impact: node.impact,
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary || "",
      })),
    }));

    // 11. Severity totals
    const severity = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      unknown: 0,
    };

    let affectedElements = 0;
    for (const violation of violations) {
      const count = violation.nodes.length;
      affectedElements += count;

      switch (violation.impact) {
        case "critical":
          severity.critical += count;
          break;
        case "serious":
          severity.serious += count;
          break;
        case "moderate":
          severity.moderate += count;
          break;
        case "minor":
          severity.minor += count;
          break;
        default:
          severity.unknown += count;
          break;
      }
    }

    // 12. Score
    const passedChecks = passes.length;
    const failedRules = violations.length;
    const evaluatedRules = passedChecks + failedRules;

    const score =
      evaluatedRules > 0
        ? Math.round((passedChecks / evaluatedRules) * 100)
        : 100;

    // 13. Result
    const audit = {
      requestedUrl: target.toString(),
      finalUrl: page.url(),
      scannedAt: new Date().toISOString(),
      score,
      summary: {
        failedRules,
        affectedElements,
        passedChecks,
        needsReview: incomplete.length,
        severity,
      },
      violations,
      passes,
      incomplete,
    };

    console.log(`[Sanalyze] Scan completed for ${audit.finalUrl} (Score: ${score}%)`);

    return NextResponse.json({ success: true, audit });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const userMessage = formatScanError(rawMessage);

    console.error("[Sanalyze API ERROR]:", rawMessage);

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("[Sanalyze] Browser closed cleanly");
      } catch {
        console.error("[Sanalyze] Could not close Browser");
      }
    }
  }
}