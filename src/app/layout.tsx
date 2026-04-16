import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import PWAScript from "./pwa-script";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";
import { DatabaseProvider } from "@/components/DatabaseProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oman POS - نظام نقاط البيع",
  description: "نظام نقاط بيع ومخزون للشركات الصغيرة والمتوسطة في سلطنة عمان",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oman POS",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <LoadingScreen />
        <ErrorBoundary>
          <Providers>
            <DatabaseProvider>
              {children}
              <PWAScript />
            </DatabaseProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
