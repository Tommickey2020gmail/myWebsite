// src/lib/reading.ts
// Word count + reading time estimate for mixed CJK/Latin markdown.
// Heuristic: count CJK characters (each is its own "word") + Latin word groups.
// Reading speed: 250 wpm for Latin, 400 cpm for CJK (rough average for adults).

const CJK = /[\u4e00-\u9fff\u3400-\u4dbf]/g;
const LATIN_WORD = /[A-Za-z][A-Za-z'-]*/g;

export interface ReadingStats {
  cjkChars: number;
  latinWords: number;
  /** Combined token count, useful as a single "length" signal. */
  total: number;
  /** Estimated minutes, never less than 1. */
  minutes: number;
}

export function readingStats(markdown: string): ReadingStats {
  // Strip code fences and inline code so they don't dominate the count.
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ');
  const cjk = (text.match(CJK) ?? []).length;
  const latin = (text.match(LATIN_WORD) ?? []).length;
  const minutes = Math.max(1, Math.round(cjk / 400 + latin / 250));
  return { cjkChars: cjk, latinWords: latin, total: cjk + latin, minutes };
}
