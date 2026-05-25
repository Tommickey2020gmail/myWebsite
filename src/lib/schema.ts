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

/**
 * Map common tags from the content collections to canonical Wikipedia /
 * Wikidata URIs. Used as `mentions` / `about` on BlogPosting so AI search
 * engines can resolve tag concepts to known entities in their knowledge
 * graph instead of treating them as opaque strings.
 *
 * Only includes tags with an unambiguous Wikipedia article. Bilingual
 * pairs collapse to a single canonical entry. Niche project-specific
 * tags (e.g. `xiaonuan`, `livekit`, `claude-code`) are intentionally
 * omitted — they have no Wikipedia page and would degrade the signal.
 */
const TAG_TO_THING: Record<string, { name: string; wikipedia: string }> = {
  ai: { name: 'Artificial intelligence', wikipedia: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
  llm: { name: 'Large language model', wikipedia: 'https://en.wikipedia.org/wiki/Large_language_model' },
  rag: { name: 'Retrieval-augmented generation', wikipedia: 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation' },
  agents: { name: 'Intelligent agent', wikipedia: 'https://en.wikipedia.org/wiki/Intelligent_agent' },
  agent: { name: 'Intelligent agent', wikipedia: 'https://en.wikipedia.org/wiki/Intelligent_agent' },
  philosophy: { name: 'Philosophy', wikipedia: 'https://en.wikipedia.org/wiki/Philosophy' },
  psychology: { name: 'Psychology', wikipedia: 'https://en.wikipedia.org/wiki/Psychology' },
  neuroscience: { name: 'Neuroscience', wikipedia: 'https://en.wikipedia.org/wiki/Neuroscience' },
  'cognitive-science': { name: 'Cognitive science', wikipedia: 'https://en.wikipedia.org/wiki/Cognitive_science' },
  consciousness: { name: 'Consciousness', wikipedia: 'https://en.wikipedia.org/wiki/Consciousness' },
  attention: { name: 'Attention', wikipedia: 'https://en.wikipedia.org/wiki/Attention' },
  eeg: { name: 'Electroencephalography', wikipedia: 'https://en.wikipedia.org/wiki/Electroencephalography' },
  dementia: { name: 'Dementia', wikipedia: 'https://en.wikipedia.org/wiki/Dementia' },
  'free-energy': { name: 'Free energy principle', wikipedia: 'https://en.wikipedia.org/wiki/Free_energy_principle' },
  robotics: { name: 'Robotics', wikipedia: 'https://en.wikipedia.org/wiki/Robotics' },
  embodiment: { name: 'Embodied cognition', wikipedia: 'https://en.wikipedia.org/wiki/Embodied_cognition' },
  alignment: { name: 'AI alignment', wikipedia: 'https://en.wikipedia.org/wiki/AI_alignment' },
  voice: { name: 'Speech recognition', wikipedia: 'https://en.wikipedia.org/wiki/Speech_recognition' },
  speech: { name: 'Speech recognition', wikipedia: 'https://en.wikipedia.org/wiki/Speech_recognition' },
  asr: { name: 'Speech recognition', wikipedia: 'https://en.wikipedia.org/wiki/Speech_recognition' },
  webrtc: { name: 'WebRTC', wikipedia: 'https://en.wikipedia.org/wiki/WebRTC' },
  seo: { name: 'Search engine optimization', wikipedia: 'https://en.wikipedia.org/wiki/Search_engine_optimization' },
  geo: { name: 'Generative engine optimization', wikipedia: 'https://en.wikipedia.org/wiki/Generative_engine_optimization' },
  marketing: { name: 'Marketing', wikipedia: 'https://en.wikipedia.org/wiki/Marketing' },
  marx: { name: 'Karl Marx', wikipedia: 'https://en.wikipedia.org/wiki/Karl_Marx' },
  utopia: { name: 'Utopia', wikipedia: 'https://en.wikipedia.org/wiki/Utopia' },
  fiction: { name: 'Science fiction', wikipedia: 'https://en.wikipedia.org/wiki/Science_fiction' },
  networking: { name: 'Computer network', wikipedia: 'https://en.wikipedia.org/wiki/Computer_network' },
  security: { name: 'Computer security', wikipedia: 'https://en.wikipedia.org/wiki/Computer_security' },
  forensics: { name: 'Digital forensics', wikipedia: 'https://en.wikipedia.org/wiki/Digital_forensics' },
  memory: { name: 'Memory', wikipedia: 'https://en.wikipedia.org/wiki/Memory' },
  grief: { name: 'Grief', wikipedia: 'https://en.wikipedia.org/wiki/Grief' },
  parenting: { name: 'Parenting', wikipedia: 'https://en.wikipedia.org/wiki/Parenting' },
  management: { name: 'Management', wikipedia: 'https://en.wikipedia.org/wiki/Management' },
  writing: { name: 'Writing', wikipedia: 'https://en.wikipedia.org/wiki/Writing' },
  proxy: { name: 'Proxy server', wikipedia: 'https://en.wikipedia.org/wiki/Proxy_server' },
  shadowsocks: { name: 'Shadowsocks', wikipedia: 'https://en.wikipedia.org/wiki/Shadowsocks' },
  rdp: { name: 'Remote Desktop Protocol', wikipedia: 'https://en.wikipedia.org/wiki/Remote_Desktop_Protocol' },
};

/**
 * Build a `mentions` array of Thing entries for a post's tags. Unknown
 * tags are silently dropped. Returns undefined if nothing maps so callers
 * can omit the property entirely instead of emitting an empty array.
 */
export function mentionsForTags(tags: readonly string[]): Array<Record<string, unknown>> | undefined {
  const seen = new Set<string>();
  const out: Array<Record<string, unknown>> = [];
  for (const tag of tags) {
    const key = tag.toLowerCase();
    const entry = TAG_TO_THING[key];
    if (!entry) continue;
    if (seen.has(entry.wikipedia)) continue;
    seen.add(entry.wikipedia);
    out.push({
      '@type': 'Thing',
      name: entry.name,
      sameAs: entry.wikipedia,
    });
  }
  return out.length > 0 ? out : undefined;
}
