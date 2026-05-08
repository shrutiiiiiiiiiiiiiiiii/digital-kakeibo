import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Shippori_Mincho_B1 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/query";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/lib/toast";

const display = Shippori_Mincho_B1({
  variable: "--font-shippori-mincho",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Digital Kakeibo",
    template: "%s | Digital Kakeibo",
  },
  description: "A digital kakeibo, faithful to mindful money practice since 1904.",
  applicationName: "Digital Kakeibo",
  keywords: ["kakeibo", "mindful budgeting", "money journal", "personal finance", "weekly reflection"],
  openGraph: {
    title: "Digital Kakeibo",
    description: "A digital kakeibo, faithful to mindful money practice since 1904.",
    type: "website",
    siteName: "Digital Kakeibo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Kakeibo",
    description: "A digital kakeibo, faithful to mindful money practice since 1904.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <QueryProvider>{children}</QueryProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
