// src/lib/lang-split.ts
//
// Rehype plugin: splits a bilingual markdown body into two <section>
// elements based on the convention zh-first, then `---` + `## English`.
//
// Input HAST (excerpt):
//   <p>zh body...</p>
//   <h2>...</h2>
//   <hr/>
//   <h2>English</h2>
//   <p>en body...</p>
//
// Output:
//   <section lang="zh" data-lang-section="zh">
//     <p>zh body...</p>
//     <h2>...</h2>
//   </section>
//   <section lang="en" data-lang-section="en">
//     <p>en body...</p>
//   </section>
//
// The `<hr>` and the `## English` heading are consumed (used only as
// the boundary marker — the section element itself is the visual /
// semantic separator).
//
// Files without the boundary are left untouched.
import type { Root, Element, ElementContent, RootContent } from 'hast';

function nodeText(node: ElementContent | RootContent): string {
  if (node.type === 'text') return node.value;
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((c) => nodeText(c as ElementContent)).join('');
  }
  return '';
}

const BOUNDARY_TEXTS = new Set(['english', '中文', 'chinese']);

export default function rehypeLangSplit() {
  return (tree: Root) => {
    const children = tree.children;
    // Whitespace-only text nodes can sit between block elements in HAST — skip them.
    const isSkippable = (n: RootContent) =>
      n.type === 'text' && /^\s*$/.test((n as any).value || '');

    // Find next non-skippable index after `from`.
    const nextIdx = (from: number) => {
      for (let i = from; i < children.length; i++) {
        if (!isSkippable(children[i])) return i;
      }
      return -1;
    };

    // Locate boundary: <hr> followed (skipping whitespace) by <h2>English</h2> or <h2>中文</h2>.
    let hrIdx = -1;
    let headingIdx = -1;
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (c.type === 'element' && (c as Element).tagName === 'hr') {
        const j = nextIdx(i + 1);
        if (j === -1) continue;
        const h = children[j];
        if (h.type === 'element' && (h as Element).tagName === 'h2') {
          const text = nodeText(h).trim().toLowerCase();
          if (BOUNDARY_TEXTS.has(text)) {
            hrIdx = i;
            headingIdx = j;
            break;
          }
        }
      }
    }

    if (hrIdx === -1) return;

    const headingText = nodeText(children[headingIdx]).trim().toLowerCase();
    const afterLang = headingText === 'english' ? 'en' : 'zh';
    const beforeLang = afterLang === 'en' ? 'zh' : 'en';

    const before = children.slice(0, hrIdx) as ElementContent[];
    const after = children.slice(headingIdx + 1) as ElementContent[];

    const beforeSection: Element = {
      type: 'element',
      tagName: 'section',
      properties: {
        lang: beforeLang,
        'data-lang-section': beforeLang,
      },
      children: before,
    };

    const afterSection: Element = {
      type: 'element',
      tagName: 'section',
      properties: {
        lang: afterLang,
        'data-lang-section': afterLang,
      },
      children: after,
    };

    tree.children = [beforeSection, afterSection];
  };
}
