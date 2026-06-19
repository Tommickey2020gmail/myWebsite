#!/usr/bin/env node
// Export an essay/garden markdown file to a WeChat Official Account (公众号) bundle.
//
// WeChat's web editor strips <script>, external CSS, classes/ids and external
// resources — only INLINE styles on common tags survive. So we render markdown
// with markdown-it and inject inline styles per tag via custom renderer rules.
//
// Output bundle (wechat-export/<slug>/):
//   - preview.html : full HTML doc — double-click to preview / select-all + copy
//   - body.html    : the styled <section> fragment only (for the RPA to inject)
//   - meta.json    : { title, author, digest, cover, content_images[...] }
//   - <images>     : cover.jpeg + inline-*.jpeg copied in, referenced by filename
//
// Usage:
//   node scripts/wechat-export.mjs <path-to-md> [--author="名字"]

import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';

// ---------- args ----------
const args = process.argv.slice(2);
const mdPath = args.find((a) => !a.startsWith('--'));
const authorArg = args.find((a) => a.startsWith('--author='))?.split('=')[1];

if (!mdPath) {
  console.error('Usage: node scripts/wechat-export.mjs <path-to-md> [--author="名字"]');
  process.exit(1);
}

// ---------- frontmatter ----------
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { fm, body: m[2] };
}

// ---------- inline-style theme (warm, site-consistent, WeChat-safe) ----------
const ACCENT = '#b5532a';
const S = {
  section: 'font-size:16px;color:#3a3a3a;line-height:1.9;letter-spacing:.02em;word-break:break-word;',
  h2: `font-size:20px;font-weight:bold;color:${ACCENT};margin:2em 0 .9em;padding-left:12px;border-left:4px solid ${ACCENT};line-height:1.4;`,
  h3: `font-size:17px;font-weight:bold;color:#5a3a2a;margin:1.6em 0 .7em;line-height:1.4;`,
  p: 'margin:1.2em 0;line-height:1.9;text-align:justify;',
  blockquote: `margin:1.6em 0;padding:.8em 1.1em;border-left:3px solid ${ACCENT};background:#faf6f2;color:#6b5d54;border-radius:0 4px 4px 0;`,
  ul: 'padding-left:1.4em;margin:1.1em 0;',
  ol: 'padding-left:1.4em;margin:1.1em 0;',
  li: 'margin:.5em 0;line-height:1.8;',
  strong: `color:${ACCENT};font-weight:bold;`,
  em: 'font-style:italic;color:#5a3a2a;',
  codeInline: 'background:#f3efe9;padding:2px 6px;border-radius:3px;font-family:Consolas,Menlo,monospace;font-size:14px;color:#a23b2a;',
  pre: 'background:#f6f3ee;padding:1em 1.1em;border-radius:6px;overflow-x:auto;font-size:14px;line-height:1.6;margin:1.5em 0;',
  img: 'max-width:100%;display:block;margin:1.6em auto;border-radius:4px;',
  hr: 'border:none;border-top:1px solid #e6ded5;margin:2.2em 0;',
  a: `color:${ACCENT};text-decoration:none;`,
};

// ---------- markdown-it with inline-style renderer rules ----------
const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: false });

const collectedImages = []; // ordered list of {filename} as they appear in body

function styleTag(tokens, idx, openTagName, style) {
  tokens[idx].attrSet('style', style);
  return md.renderer.renderToken(tokens, idx, md.options);
}

md.renderer.rules.heading_open = (tokens, idx) => {
  const tag = tokens[idx].tag;
  const style = tag === 'h2' ? S.h2 : tag === 'h3' ? S.h3 : '';
  if (style) tokens[idx].attrSet('style', style);
  return md.renderer.renderToken(tokens, idx, md.options);
};
md.renderer.rules.paragraph_open = (t, i) => styleTag(t, i, 'p', S.p);
md.renderer.rules.blockquote_open = (t, i) => styleTag(t, i, 'blockquote', S.blockquote);
md.renderer.rules.bullet_list_open = (t, i) => styleTag(t, i, 'ul', S.ul);
md.renderer.rules.ordered_list_open = (t, i) => styleTag(t, i, 'ol', S.ol);
md.renderer.rules.list_item_open = (t, i) => styleTag(t, i, 'li', S.li);
md.renderer.rules.strong_open = (t, i) => styleTag(t, i, 'strong', S.strong);
md.renderer.rules.em_open = (t, i) => styleTag(t, i, 'em', S.em);
md.renderer.rules.hr = (t, i) => { t[i].attrSet('style', S.hr); return md.renderer.renderToken(t, i, md.options); };
md.renderer.rules.link_open = (t, i) => styleTag(t, i, 'a', S.a);

md.renderer.rules.code_inline = (tokens, idx) =>
  `<code style="${S.codeInline}">${md.utils.escapeHtml(tokens[idx].content)}</code>`;

md.renderer.rules.fence = (tokens, idx) =>
  `<pre style="${S.pre}"><code style="font-family:Consolas,Menlo,monospace;">${md.utils.escapeHtml(tokens[idx].content)}</code></pre>`;

md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx];
  const src = token.attrGet('src') || '';
  const alt = token.content || '';
  const filename = path.basename(src);
  collectedImages.push(filename);
  // reference by bare filename so preview.html (with images copied alongside)
  // renders, and the RPA can map filename → uploaded media.
  return `<img src="${md.utils.escapeHtml(filename)}" alt="${md.utils.escapeHtml(alt)}" style="${S.img}" data-wechat-img="${md.utils.escapeHtml(filename)}" />`;
};

// ---------- main ----------
const raw = await fs.readFile(mdPath, 'utf8');
const { fm, body } = parseFrontmatter(raw);
const slug = path.basename(mdPath, '.md');

// Strip the leading cover image line — WeChat sets the cover (封面) separately,
// not inside the body. Match the first ![..](.../cover.*) occurrence.
const coverFilename = fm.cover ? path.basename(fm.cover) : null;
let bodyNoCover = body;
if (coverFilename) {
  bodyNoCover = body.replace(
    new RegExp(`^\\s*!\\[[^\\]]*\\]\\([^)]*${coverFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\s*\\n?`, 'm'),
    '',
  );
}

const fragment = `<section style="${S.section}">\n${md.render(bodyNoCover).trim()}\n</section>`;

// dedupe collected images, drop the cover if it slipped in
const inlineImages = [...new Set(collectedImages)].filter((f) => f !== coverFilename);

// ---------- write bundle ----------
const outDir = path.join('wechat-export', slug);
await fs.mkdir(outDir, { recursive: true });

// copy images (cover + inline) from public/illustrations/<slug>/
const imgSrcDir = path.join('public', 'illustrations', slug);
const copied = [];
for (const f of [coverFilename, ...inlineImages].filter(Boolean)) {
  const from = path.join(imgSrcDir, f);
  try {
    await fs.copyFile(from, path.join(outDir, f));
    copied.push(f);
  } catch {
    console.warn(`⚠  image not found, skipped: ${from}`);
  }
}

const digest = (fm.description || '').replace(/\s+/g, ' ').trim().slice(0, 120);
const author = authorArg || fm.author || '';

await fs.writeFile(path.join(outDir, 'body.html'), fragment);

const previewDoc = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${md.utils.escapeHtml(fm.title || slug)} — 公众号预览</title></head>
<body style="margin:0;background:#eee;">
<div style="max-width:677px;margin:0 auto;background:#fff;padding:24px 20px;">
<h1 style="font-size:22px;font-weight:bold;color:#1a1a1a;line-height:1.4;margin:0 0 1.2em;">${md.utils.escapeHtml(fm.title || '')}</h1>
${fragment}
</div></body></html>`;
await fs.writeFile(path.join(outDir, 'preview.html'), previewDoc);

const meta = {
  slug,
  title: fm.title || slug,
  author,
  digest,
  cover: coverFilename && copied.includes(coverFilename) ? coverFilename : null,
  content_images: inlineImages.filter((f) => copied.includes(f)),
  source: mdPath,
  generated_at: new Date().toISOString(),
};
await fs.writeFile(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));

console.log(`📄 ${mdPath}`);
console.log(`   slug:    ${slug}`);
console.log(`   title:   ${meta.title}`);
console.log(`   digest:  ${digest.slice(0, 50)}${digest.length > 50 ? '…' : ''}`);
console.log(`   cover:   ${meta.cover || '(none)'}`);
console.log(`   inline:  ${meta.content_images.length} image(s) ${meta.content_images.join(', ')}`);
console.log('');
console.log(`✓ bundle → ${outDir}/`);
console.log(`   • preview.html  双击在浏览器预览 → 全选复制 → 粘进公众号编辑器`);
console.log(`   • body.html     正文 HTML 片段（供 RPA 注入）`);
console.log(`   • meta.json     标题/摘要/封面/配图清单`);
