import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { PortfolioVariantProvider } from "@/contexts/portfolio-variant-context";
import { portfolioContent } from "@/config/portfolio-content";
import { BotIdClient } from 'botid/client';
import ScrollReset from "@/components/scroll-reset";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define the paths that need bot protection
const protectedRoutes = [
  {
    path: '/api/contact',
    method: 'POST',
  },
  {
    path: '/api/newsletter',
    method: 'POST',
  },
  {
    // Protect any form submission endpoints
    path: '/api/*/submit',
    method: 'POST',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const subdomain = headersList.get('x-subdomain') || 'general';
  const variant = (subdomain === 'general' || subdomain === 'swe' || subdomain === 'csr') ? subdomain : 'general';
  const content = portfolioContent[variant];

  return {
    title: content.metadata.title,
    description: content.metadata.description,
    keywords: content.metadata.keywords,
    authors: [{ name: "Frank Palmisano" }],
    openGraph: {
      title: content.metadata.title,
      description: content.metadata.description,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.title,
      description: content.metadata.description,
    },
  };
}

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const subdomain = headersList.get('x-subdomain') || 'general';
  const variant = (subdomain === 'general' || subdomain === 'swe' || subdomain === 'csr') ? subdomain : 'general';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <BotIdClient protect={protectedRoutes} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PortfolioVariantProvider variant={variant}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <ScrollReset />
            {children}
            <Analytics />
          </ThemeProvider>
        </PortfolioVariantProvider>
      </body>
    </html>
  );
}
