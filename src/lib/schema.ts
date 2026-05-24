// src/lib/schema.ts
// Shared Schema.org JSON-LD fragments. Reused across page templates so
// publisher / author / breadcrumb shape stays consistent.

export const SITE_URL = 'https://tommickey.cn';

/** Compact author reference — embed inside BlogPosting / CreativeWork. */
export const AUTHOR = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: 'Tommy',
  url: `${SITE_URL}/`,
} as const;

/** Publisher (Organization) — embed as `publisher` on every BlogPosting. */
export const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#publisher`,
  name: "Tommy's Digital Garden",
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/avatar.png`,
  },
} as const;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Build a BreadcrumbList JSON-LD object. */
export function breadcrumbList(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
