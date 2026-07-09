import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/providers/app-providers';

import './globals.css';

// 
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") ||
  "https://hirelens-ai.onrender.com";

export const metadata: Metadata = {
  title: {
    default: 'HireLens AI — AI-Powered Resume Screening & Interview Prep',
    template: '%s | HireLens AI',
  },
  description:
    'HireLens AI uses artificial intelligence to analyze resumes, match candidates to jobs, and generate interview questions. Built for students and recruiters.',
  keywords: [
    'resume screening',
    'AI recruitment',
    'interview preparation',
    'job matching',
    'candidate ranking',
    'resume analysis',
    'hiring platform',
  ],
  authors: [{ name: 'HireLens AI' }],
  creator: 'HireLens AI',
  publisher: 'HireLens AI',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'HireLens AI',
    title: 'HireLens AI — AI-Powered Resume Screening & Interview Prep',
    description:
      'AI-powered platform for resume analysis, job matching, and interview question generation.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'HireLens AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HireLens AI — AI-Powered Resume Screening & Interview Prep',
    description:
      'AI-powered platform for resume analysis, job matching, and interview question generation.',
    images: [`${BASE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {},
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HireLens AI',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'AI-powered resume screening and interview preparation platform for students and recruiters.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HireLens AI',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/jobs?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
