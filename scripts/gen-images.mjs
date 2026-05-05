#!/usr/bin/env node
// Generate cover + inline illustrations for an article via Volcano Ark (Doubao Seedream).
// Usage:
//   node --env-file=.env scripts/gen-images.mjs <path-to-md> [--cover-only] [--dry] [--force]

import fs from 'node:fs/promises';
import path from 'node:path';

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = process.env.ARK_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_IMAGE_MODEL = process.env.ARK_IMAGE_MODEL ?? 'doubao-seedream-3-0-t2i-250415';

if (!ARK_API_KEY) {
  console.error('Missing ARK_API_KEY (load with: node --env-file=.env ...)');
  process.exit(1);
}

// ---------- args ----------
const args = process.argv.slice(2);
const mdPath = args.find((a) => !a.startsWith('--'));
const dry = args.includes('--dry');
const coverOnly = args.includes('--cover-only');
const force = args.includes('--force');
if (!mdPath) {
  console.error('Usage: node --env-file=.env scripts/gen-images.mjs <path-to-md> [--cover-only] [--dry] [--force]');
  process.exit(1);
}

// ---------- helpers ----------
async function generateImage(prompt, size = '1024x1024') {
  const resp = await fetch(`${ARK_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ARK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ARK_IMAGE_MODEL,
      prompt,
      size,
      guidance_scale: 2.5,
      watermark: false,
      response_format: 'url',
    }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`ARK ${resp.status}: ${JSON.stringify(json)}`);
  return json.data[0].url;
}

async function downloadImage(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(dest, buf);
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: text, raw: '' };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { fm, body: m[2], raw: m[1] };
}

function findH2s(body) {
  const lines = body.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) out.push({ index: i, title: m[1] });
  });
  return out;
}

function pickInlinePositions(h2s) {
  // 6+ H2: insert after #2 and #4 (1-based)  → sections that are content-rich, not intro/conclusion
  // 4-5 H2: insert after #2
  // <4 H2: skip
  if (h2s.length >= 6) return [h2s[1], h2s[3]];
  if (h2s.length >= 4) return [h2s[1]];
  return [];
}

function sectionPreview(body, h2Index) {
  const lines = body.split('\n');
  let preview = '';
  for (let j = h2Index + 1; j < lines.length && preview.length < 220; j++) {
    const line = lines[j];
    if (line.startsWith('#')) break;
    // Skip markdown image / link-only lines
    if (/^\s*!\[.*\]\(.*\)\s*$/.test(line)) continue;
    // Strip inline markdown image syntax + emphasis chars
    const clean = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`#>]/g, '')
      .trim();
    if (clean) preview += clean + ' ';
  }
  return preview.slice(0, 220);
}

// English-only style. Chinese prompts reflexively trigger calligraphy/chops/
// seals on Doubao Seedream. Switching to English suppresses Chinese typography
// almost entirely.
const STYLE_POSITIVE = 'minimalist conceptual illustration, soft watercolor texture, warm cream background, terracotta and deep brown palette, generous negative space, poetic atmosphere, cinematic mood, elegant and quiet';

// Negative directive in English, repeated at the front and end of the prompt.
const NO_TEXT = 'STRICT RULE: absolutely no text, no Chinese characters, no letters, no numbers, no punctuation, no seals, no chops, no signatures, no watermarks, no calligraphy, no labels, no captions, no diagrams, no charts, no signs';

// Concepts that almost guarantee labels/typography. Replace with neutral nouns
// or remove. Applied AFTER translation.
const FORBIDDEN_CONCEPTS = [
  /\b(pyramid|hierarchy chart|chart|diagram|infographic|chart of|table of|labeled)\b/gi,
  /\b(book|letter|sign|signpost|label|certificate|placard|banner|scroll)\b/gi,
  /\b(name plate|nameplate|tag|tagged)\b/gi,
];

// Proper nouns and specific names — get rendered as text every time. Strip.
const PROPER_NOUN_RE = /(马斯洛|德西|瑞安|塞利格曼|契克森米哈伊|弗兰克尔|庄子|马克思|康德|伊姆林|奥斯维辛|集中营|美国|日本|中国|法国大革命|文革|《[^》]+》|Maslow|Deci|Ryan|Seligman|Frankl|Zhuangzi|Marx|Kant|[A-Z][a-zA-Z]{2,})/g;

// Translate a Chinese essay snippet → very loose English visual concept.
// We don't aim for accuracy; we want a SAFE abstract subject the model can
// render without typography. Maps common essay concepts → safe visual nouns.
const ZH_TO_EN_HINTS = [
  // Hierarchy/structure metaphors → safe replacements
  [/(金字塔|层级|阶梯|阶层)/g, 'a winding mountain path'],
  [/(秩序|架构|框架|体系)/g, 'an open meadow at dawn'],
  // Inner state / emptiness
  [/(空虚|虚无|失落|崩塌|崩溃)/g, 'a single empty chair in soft light'],
  [/(孤独|孤立|寂寞)/g, 'a lone figure under a vast sky'],
  [/(焦虑|不安|恐惧)/g, 'wind through bare branches'],
  // Work / capability
  [/(工作|劳动|职业|岗位|胜任)/g, 'a quiet workshop bench'],
  [/(自主|自由|主动)/g, 'an open window letting in light'],
  [/(关联|连接|纽带|关系|社群)/g, 'two distant figures on a long bridge'],
  // Machines / AI
  [/(机器|算法|人工智能|AI|自动化)/g, 'a still mechanical silhouette in fog'],
  // Meaning / value
  [/(意义|价值|目的|信仰)/g, 'a single candle on a long table'],
  // People / society
  [/(人心|人性|内心|心灵)/g, 'a cupped pair of hands holding light'],
  [/(社会|时代|历史)/g, 'a wide horizon with low hills'],
  // Generic fallback nouns
  [/(吃饭|食物|餐饭)/g, 'a simple bowl on a wooden table'],
  [/(学习|思考|阅读)/g, 'an open notebook by a window'],
];

function distillVisual(text, maxConcepts = 2) {
  let t = text
    .replace(/[""'']/g, '')
    .replace(PROPER_NOUN_RE, '')
    .replace(/[，。！？、；：（）—…·]/g, ' ');
  // Translate metaphors to English visual hints. Cap at maxConcepts to avoid
  // busy compositions (more concepts = more chance of stray typography).
  const matched = new Set();
  const hits = [];
  for (const [from, to] of ZH_TO_EN_HINTS) {
    if (hits.length >= maxConcepts) break;
    if (matched.has(to)) continue;
    if (from.test(t)) {
      hits.push(to);
      matched.add(to);
    }
  }
  let visual = hits.join(', ');
  if (!visual) visual = 'a quiet still life with soft warm light';
  for (const re of FORBIDDEN_CONCEPTS) visual = visual.replace(re, '');
  return visual.replace(/\s+/g, ' ').trim();
}

function coverPrompt(title, description) {
  // Cover: cap at 1 concept — busy compositions invite stray text/inscriptions.
  const concept = distillVisual(description || title, 1);
  return `${NO_TEXT}. A symbolic conceptual illustration: ${concept}. ${STYLE_POSITIVE}. Reminder: ${NO_TEXT}`;
}

function inlinePrompt(_sectionTitle, preview) {
  // Inline: 1 concept (single-subject scene works best).
  const concept = distillVisual(preview, 1);
  return `${NO_TEXT}. A poetic single-subject scene: ${concept}. ${STYLE_POSITIVE}. One clear subject, lots of empty space, purely visual, zero typography of any kind. Reminder: ${NO_TEXT}`;
}

// ---------- main ----------
const text = await fs.readFile(mdPath, 'utf8');
const { fm, body, raw } = parseFrontmatter(text);
const slug = path.basename(mdPath, '.md');
const outDir = path.join('public', 'illustrations', slug);
await fs.mkdir(outDir, { recursive: true });

const coverRel = `/illustrations/${slug}/cover.jpeg`;
const inlineRel = (i) => `/illustrations/${slug}/inline-${i + 1}.jpeg`;

// Plan: cover + inline positions
const h2s = findH2s(body);
const inlinePositions = coverOnly ? [] : pickInlinePositions(h2s);

console.log(`📄 ${mdPath}`);
console.log(`   slug: ${slug}`);
console.log(`   title: ${fm.title}`);
console.log(`   H2 sections: ${h2s.length}`);
console.log(`   plan: 1 cover + ${inlinePositions.length} inline`);
console.log('');

// 1) Cover
const coverPath = path.join(outDir, 'cover.jpeg');
const coverExists = await fs.access(coverPath).then(() => true).catch(() => false);
if (coverExists && !force) {
  console.log(`✓ cover exists → ${coverPath} (use --force to regen)`);
} else {
  const cprompt = coverPrompt(fm.title, fm.description);
  console.log(`📸 cover: ${cprompt.slice(0, 120)}...`);
  if (!dry) {
    const url = await generateImage(cprompt, '1280x720');
    await downloadImage(url, coverPath);
    console.log(`   → ${coverPath}`);
  }
}

// 2) Inline images
for (let i = 0; i < inlinePositions.length; i++) {
  const pos = inlinePositions[i];
  const dest = path.join(outDir, `inline-${i + 1}.jpeg`);
  const exists = await fs.access(dest).then(() => true).catch(() => false);
  if (exists && !force) {
    console.log(`✓ inline-${i + 1} exists → ${dest} (use --force to regen)`);
    continue;
  }
  const preview = sectionPreview(body, pos.index);
  const iprompt = inlinePrompt(pos.title, preview);
  console.log(`📸 inline-${i + 1} (after H2 "${pos.title}"): ${iprompt.slice(0, 120)}...`);
  if (!dry) {
    const url = await generateImage(iprompt, '1024x1024');
    await downloadImage(url, dest);
    console.log(`   → ${dest}`);
  }
}

if (dry) {
  console.log('\n(dry run — no files modified)');
  process.exit(0);
}

// 3) Insert markdown image refs (idempotent: skip if already present)
const lines = body.split('\n');
let newBody = '';

// 3a) Cover at top of body
if (body.includes(coverRel)) {
  console.log('⏭  cover already in markdown');
  newBody = lines.join('\n');
} else {
  newBody = `![${fm.title}](${coverRel})\n\n` + lines.join('\n');
}

// 3a') Add cover: to frontmatter for og:image (idempotent)
let newRaw = raw;
if (!/^cover:/m.test(raw)) {
  newRaw = raw.trimEnd() + `\ncover: ${coverRel}`;
  console.log('+ added cover: to frontmatter');
}

// 3b) Inline insertions — apply on the (possibly already-prefixed) body
for (let i = 0; i < inlinePositions.length; i++) {
  const rel = inlineRel(i);
  if (newBody.includes(rel)) {
    console.log(`⏭  inline-${i + 1} already in markdown`);
    continue;
  }
  // Re-find position in current body since indices shift
  const curLines = newBody.split('\n');
  let h2Count = 0;
  let insertAfter = -1;
  for (let j = 0; j < curLines.length; j++) {
    if (curLines[j].match(/^##\s+/)) {
      h2Count++;
      if (h2Count - 1 === (inlinePositions.length === 2 ? (i === 0 ? 1 : 3) : 1)) {
        insertAfter = j;
        break;
      }
    }
  }
  if (insertAfter === -1) {
    console.warn(`⚠  could not locate H2 for inline-${i + 1}, skipping`);
    continue;
  }
  curLines.splice(insertAfter + 1, 0, '', `![${inlinePositions[i].title}](${rel})`, '');
  newBody = curLines.join('\n');
}

const newText = `---\n${newRaw}\n---\n${newBody}`;
await fs.writeFile(mdPath, newText);
console.log(`\n✓ Updated ${mdPath}`);
