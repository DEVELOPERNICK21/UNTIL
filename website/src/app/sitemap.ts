import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/domain';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.baseUrl;
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/play`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/copyright`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
