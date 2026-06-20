import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') ?? 'https://hirelens-ai.onrender.com';

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    rules: [
      {
        userAgent: '*',
        allow: isProduction ? '/' : '/',
        disallow: ['/dashboard', '/resumes/new', '/jobs/new', '/applications', '/matches', '/interviews'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
