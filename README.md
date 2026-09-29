# Sanalyze — Web Accessibility (a11y) Auditing Engine

> An automated, developer-first accessibility inspection and compliance platform designed to detect WCAG 2.1 violations, pinpoint broken DOM elements, simulate visual impairments, and deliver AI-assisted code remediation.

---

## 🌟 Key Highlights

- **Automated Axe-Core Auditing Engine**: Headless Chromium runner executing `axe-core` in-memory to uncover semantic, structural, and contrast violations.
- **Interactive Vision Deficiency Simulator**: Real-time SVG filter matrices simulating Protanopia, Deuteranopia, Tritanopia, Achromatopsia, and Refractive Blurs directly over audited UI components.
- **Precision Element Targeting**: Direct mapping of violated DOM selectors, target nodes, and raw code snippets with instant clipboard export.
- **AI-Powered Code Remediation**: Automated plain-language diagnostic explanations coupled with production-ready HTML/JSX auto-fix recommendations.
- **Executive Audit Reporting**: Comprehensive score breakdowns, severity indices (Critical, Serious, Moderate, Minor), and compliance verification summaries.

---

## 🛠️ Tech Stack & Engineering Architecture

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Static & Serverless Route Handlers)
- **Language**: TypeScript (Strict typing across DOM & Axe-core schemas)
- **Styling**: Tailwind CSS
- **Auditing Core**: [Playwright](https://playwright.dev/) + [axe-core](https://github.com/dequelabs/axe-core)
- **Icons**: Lucide React
- **Optics & Simulation**: SVG Color Matrices (`feColorMatrix`) & CSS Filters

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── ai/analyze/     # AI explanation & remediation endpoint
│   │   └── scan/           # Playwright headless browser audit pipeline
│   ├── audit/
│   │   ├── ai-insights/    # AI-assisted diagnostic guidance
│   │   ├── compare/        # Historical audit comparison
│   │   ├── inspector/      # DOM visual inspector & Vision simulator
│   │   ├── issues/         # Filterable WCAG findings list
│   │   ├── manual-review/  # Human-in-the-loop review guides
│   │   ├── report/         # Printable compliance report
│   │   └── page.tsx        # Audit dashboard overview & metrics
│   ├── page.tsx            # Landing & scan launcher
│   └── layout.tsx          # App root shell
└── components/
    └── layout/             # Reusable navigation & audit shell wrappers