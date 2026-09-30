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
  title: "Sanalyze | Accessibility Auditor",
  description: "Scan websites for accessibility issues and receive practical remediation guidance.",
  icons: {
    icon: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // يجعل شريط الآيفون فاتحاً وأيقوناته داكنة
    title: "Sanalyze",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7faff", // لون مطابق لمتغير --bg في globals.css
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