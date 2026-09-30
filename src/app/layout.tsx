import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sanalyze-platform.vercel.app"),
  title: "Sanalyze | Accessibility Auditor",
  description: "Scan websites for accessibility issues and receive practical remediation guidance.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Sanalyze | Accessibility Auditor",
    description: "Scan websites for accessibility issues and receive practical remediation guidance.",
    url: "https://sanalyze-platform.vercel.app",
    siteName: "Sanalyze",
    images: [
      {
        url: "/og-image.svg",
        width: 800,
        height: 800,
        alt: "Sanalyze Shield Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sanalyze | Accessibility Auditor",
    description: "Scan websites for accessibility issues and receive practical remediation guidance.",
    images: ["/og-image.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sanalyze",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7faff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sansFont.variable} ${monoFont.variable}`}
      style={{ backgroundColor: "#f7faff", colorScheme: "light" }}
    >
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}