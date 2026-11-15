import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/domain';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The listing-copy tool and the JSON the app reads are not pages for search results.
      disallow: ['/tools/', '/api/'],
    },
    sitemap: `${SITE_CONFIG.baseUrl}/sitemap.xml`,
    host: SITE_CONFIG.baseUrl,
  };
}
