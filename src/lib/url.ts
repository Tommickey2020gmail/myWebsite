// src/lib/url.ts
// URL helpers shared by listing pages, the homepage, and (in Task 7) RSS.
// Centralized so a slug-encoding bug only needs one fix.

/**
 * Convert a content-collection `entry.id` into a URL path fragment.
 *
 * `id` is the path relative to the collection's `base`, minus extension
 * (Astro 6 glob loader convention). It may contain `/` for subdirectories,
 * which we keep as route segment separators, plus arbitrary characters
 * (spaces, CJK) since Obsidian filenames are unrestricted on Windows.
 *
 * Each segment is URL-encoded; the segment separator is preserved.
 */
export function slugHref(id: string): string {
  return id.split('/').map(encodeURIComponent).join('/');
}

/**
 * Resolve a `papers` collection entry's `link` (and optional `doi`) into
 * an absolute URL suitable for an `<a href>`.
 *
 * Accepts:
 *   - Full URL: `https://...` or `http://...` → returned as-is.
 *   - arXiv ID: `arXiv:2301.00001` (case-insensitive) → arxiv.org/abs/.
 *   - Bare DOI: `10.1038/nature12373` → doi.org/.
 *
 * If the schema supplies a separate `doi` field we prefer it over `link`,
 * since `doi.org` resolves canonically.
 */
export function paperHref(link: string, doi?: string): string {
  if (doi) return `https://doi.org/${doi}`;
  if (/^https?:\/\//i.test(link)) return link;
  const arxiv = link.match(/^arxiv:\s*(.+)$/i);
  if (arxiv) return `https://arxiv.org/abs/${arxiv[1]}`;
  if (/^10\.\d{4,9}\//.test(link)) return `https://doi.org/${link}`;
  // Fallback: return the original string. The author can fix the frontmatter
  // if it doesn't match a known scheme.
  return link;
}
