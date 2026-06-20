import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') ?? 'https://hirelens-ai.onrender.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  return publicPages;
}
