// src/lib/registry.ts
// Sync-readable index of wikilink-targetable entries (garden + essays).
// Built once at module load by scanning the markdown filesystem so it is
// available inside synchronous remark plugins (which run before content
// collections are queryable).
//
// Each entry is keyed by both its lowercased title and its slug, so authors
// can write [[Welcome to the garden]] OR [[welcome-to-the-garden]].
import fs from 'node:fs';
import path from 'node:path';
import { slugHref } from './url';

export interface RegistryEntry {
  id: string;       // entry id (== filename without .md, with subdirs)
  title: string;
  href: string;     // resolved URL with trailing slash
  collection: 'garden' | 'essays';
}

// Resolve from CWD because Astro re-bundles lib files into dist/.prerender/
// during build, where `import.meta.url` no longer points at the source tree.
// pnpm/astro always run from the project root, so cwd is reliable.
const CONTENT_ROOT = path.resolve(process.cwd(), 'src', 'content');

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) yield* walk(p);
    else if (stat.isFile() && p.endsWith('.md')) yield p;
  }
}

/** Extract the `title:` field from frontmatter without a YAML parser. */
function readTitle(file: string): string | null {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end < 0) return null;
  const fm = text.slice(3, end);
  // Match `title: ...` or `title: "..."`/`title: '...'`. Strip surrounding quotes.
  const m = fm.match(/^title:\s*(.+?)\s*$/m);
  if (!m) return null;
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

function buildRegistry(): Map<string, RegistryEntry> {
  const map = new Map<string, RegistryEntry>();
  for (const collection of ['garden', 'essays'] as const) {
    const root = path.join(CONTENT_ROOT, collection);
    for (const file of walk(root)) {
      const id = path.relative(root, file).replace(/\.md$/, '').split(path.sep).join('/');
      const title = readTitle(file);
      const href = `/${collection}/${slugHref(id)}/`;
      const entry: RegistryEntry = { id, title: title ?? id, href, collection };
      map.set(id.toLowerCase(), entry);
      if (title) map.set(title.toLowerCase(), entry);
    }
  }
  return map;
}

const registry = buildRegistry();

/** Resolve a wikilink target (case-insensitive). Returns null when no match. */
export function resolveWikilink(target: string): RegistryEntry | null {
  return registry.get(target.trim().toLowerCase()) ?? null;
}

/** Internal: expose for backlinks. */
export function allRegisteredEntries(): RegistryEntry[] {
  // Deduplicate by id since title and id both index into the map.
  const seen = new Set<string>();
  const out: RegistryEntry[] = [];
  for (const e of registry.values()) {
    if (seen.has(e.id + ':' + e.collection)) continue;
    seen.add(e.id + ':' + e.collection);
    out.push(e);
  }
  return out;
}
