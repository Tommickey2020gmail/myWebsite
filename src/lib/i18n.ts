// src/lib/i18n.ts
// Locale-aware path helpers shared by BaseLayout (hreflang) and LangSwitch.
// Convention: zh paths are unprefixed (`/`, `/garden/`); en paths are prefixed (`/en/`, `/en/garden/`).
// Astro is configured with `build.format: 'directory'` so every emitted route ends in `/`.

export type Lang = 'zh' | 'en';

/** Strip a leading `/en` or `/en/` from a path, returning the canonical zh path. */
export function stripLangPrefix(path: string): string {
  if (path === '/en' || path === '/en/') return '/';
  if (path.startsWith('/en/')) return path.slice(3); // `/en/x` -> `/x`
  return path;
}

/** Convert any path into the equivalent path for the given locale. */
export function localizePath(path: string, lang: Lang): string {
  const zhPath = stripLangPrefix(path);
  if (lang === 'zh') return zhPath;
  // en: prefix with `/en`, preserving trailing-slash semantics
  if (zhPath === '/') return '/en/';
  return `/en${zhPath}`;
}

/** Detect the language of the current request path. */
export function detectLang(path: string): Lang {
  return path === '/en' || path === '/en/' || path.startsWith('/en/') ? 'en' : 'zh';
}
