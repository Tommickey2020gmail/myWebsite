#!/usr/bin/env node
// Generate cover + inline illustrations for an article.
// Provider auto-selection:
//   - If CF_ACCOUNT_ID + CF_API_TOKEN are set → Cloudflare Workers AI (flux-1-schnell)
//   - Else if ARK_API_KEY is set → Volcano Ark (Doubao Seedream)
// Override with --provider=cf | --provider=ark
// Usage:
//   node --env-file=.env scripts/gen-images.mjs <path-to-md> [--cover-only] [--dry] [--force] [--provider=cf|ark]

import fs from 'node:fs/promises';
import path from 'node:path';
// Use undici's fetch (not node's built-in fetch) so we can route through a
// proxy via ProxyAgent. Node 22's built-in fetch uses a bundled undici whose
// global dispatcher is separate from the installed undici package, so calling
// setGlobalDispatcher on the npm undici has no effect on built-in fetch.
import { fetch, ProxyAgent, Agent } from 'undici';

const _proxy = process.env.HTTPS_PROXY || process.env.https_proxy
  || process.env.HTTP_PROXY || process.env.http_proxy;
const _dispatcher = _proxy ? new ProxyAgent(_proxy) : new Agent();
if (_proxy) console.log(`🌐 using proxy: ${_proxy}`);

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = process.env.ARK_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_IMAGE_MODEL = process.env.ARK_IMAGE_MODEL ?? 'doubao-seedream-3-0-t2i-250415';
// Text model used as an "art director": reads the article and writes a vivid,
// article-specific image prompt (subject + mood-appropriate palette + medium).
const ARK_TEXT_MODEL = process.env.ARK_TEXT_MODEL ?? 'doubao-1-5-pro-32k-250115';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_IMAGE_MODEL = process.env.CF_IMAGE_MODEL ?? '@cf/black-forest-labs/flux-1-schnell';

// ---------- args ----------
const args = process.argv.slice(2);
const mdPath = args.find((a) => !a.startsWith('--'));
const dry = args.includes('--dry');
const coverOnly = args.includes('--cover-only');
const force = args.includes('--force');
const providerArg = args.find((a) => a.startsWith('--provider='))?.split('=')[1];

const provider = providerArg
  ?? (CF_ACCOUNT_ID && CF_API_TOKEN ? 'cf' : (ARK_API_KEY ? 'ark' : null));

if (!provider) {
  console.error('No provider available. Set CF_ACCOUNT_ID+CF_API_TOKEN or ARK_API_KEY in .env');
  process.exit(1);
}
if (provider === 'cf' && (!CF_ACCOUNT_ID || !CF_API_TOKEN)) {
  console.error('Missing CF_ACCOUNT_ID / CF_API_TOKEN');
  process.exit(1);
}
if (provider === 'ark' && !ARK_API_KEY) {
  console.error('Missing ARK_API_KEY');
  process.exit(1);
}

if (!mdPath) {
  console.error('Usage: node --env-file=.env scripts/gen-images.mjs <path-to-md> [--cover-only] [--dry] [--force] [--provider=cf|ark]');
  process.exit(1);
}

console.log(`🛠  provider: ${provider}`);

// ---------- helpers ----------
// generateImageToFile: provider-agnostic. Writes image directly to dest.
async function generateImageToFile(prompt, size, dest) {
  if (provider === 'cf') {
    // CF Workers AI returns { result: { image: "<base64 jpeg>" }, success: true }
    // flux-1-schnell supports width/height; size is parsed from "WxH"
    const [width, height] = size.split('x').map(Number);
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_IMAGE_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, steps: 4, width, height }),
        dispatcher: _dispatcher,
      },
    );
    const json = await resp.json();
    if (!resp.ok || !json.success) {
      throw new Error(`CF ${resp.status}: ${JSON.stringify(json).slice(0, 500)}`);
    }
    const b64 = json.result?.image;
    if (!b64) throw new Error(`CF: no image in response: ${JSON.stringify(json).slice(0, 300)}`);
    await fs.writeFile(dest, Buffer.from(b64, 'base64'));
    return;
  }
  // ark provider: returns presigned URL
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
  const url = json.data[0].url;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  await fs.writeFile(dest, Buffer.from(await r.arrayBuffer()));
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

// ---------- LLM art director (primary path) ----------
// A short, firm no-text guard appended to whatever the art director writes.
// Seedream 4.0 handles text well but still slips captions into artful covers.
const NO_TEXT_SHORT = 'Important: the illustration must contain absolutely no text, letters, words, numbers, captions, labels, signage, logos, book covers with visible titles, seals, or watermarks of any kind.';

function wrapPrompt(core) {
  return `${core.trim()} ${NO_TEXT_SHORT}`;
}

async function arkChat(messages) {
  const resp = await fetch(`${ARK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ARK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ARK_TEXT_MODEL,
      messages,
      temperature: 0.9,
      max_tokens: 900,
    }),
  });
  const j = await resp.json();
  if (!resp.ok) throw new Error(`ARK chat ${resp.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j.choices?.[0]?.message?.content ?? '';
}

const ART_SYSTEM = `You are the art director for a warm, literary personal blog (essays on philosophy, psychology, AI, and life). For a given essay you invent illustration prompts for a text-to-image model (Doubao Seedream 4.0).

Rules for every prompt:
- Write in English only.
- Translate the essay's THEME and MOOD into ONE strong, specific, symbolic image — not a literal restatement. Be concrete and visual (a scene, an object, a gesture, a landscape), evocative and unique to THIS essay.
- Choose a color palette that FITS this essay's emotional tone, and VARY it between essays — it may be warm, cool, muted, moody, twilight, monochrome, or vivid as the mood demands. Name 2 to 4 specific colors.
- Choose a medium/style that fits (e.g. soft watercolor, gouache, cinematic light, ink wash, oil-pastel, textured risograph, dreamy film photograph) and vary it across essays. Editorial-illustration quality, poetic and quiet.
- Compose for the given aspect ratio, with intentional negative space.
- The scene must contain NO text of any kind: no letters, words, numbers, signage, labeled diagrams, charts, books with visible titles, seals, or watermarks. Avoid subjects that beg for writing (open books with legible pages, street signs, screens full of text, posters).
- Never mention real proper nouns, brand names, real person names, or book titles.

Return STRICT JSON only, no prose, no markdown fences:
{"cover":"<one prompt, wide 16:9>","inline":["<one prompt, square 1:1>", ...]}
The "inline" array length MUST exactly match the number of sections given (0 → []).`;

async function artDirect({ title, description, excerpt, inlines }) {
  const parts = [];
  parts.push(`Essay title: ${title || '(untitled)'}`);
  if (description) parts.push(`One-line summary: ${description}`);
  if (excerpt) parts.push(`Opening excerpt: ${excerpt}`);
  parts.push('');
  parts.push('Cover: one wide 16:9 illustration capturing the whole essay.');
  if (inlines.length) {
    parts.push(`Inline: ${inlines.length} square 1:1 illustration(s), one per section below, each capturing that section's specific idea (and visually varied from the cover and from each other):`);
    inlines.forEach((s, i) => parts.push(`  Section ${i + 1} — "${s.title}": ${s.preview || '(no preview)'}`));
  } else {
    parts.push('Inline: none needed → "inline": [].');
  }
  const content = await arkChat([
    { role: 'system', content: ART_SYSTEM },
    { role: 'user', content: parts.join('\n') },
  ]);
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`no JSON in art-direction response: ${content.slice(0, 200)}`);
  const parsed = JSON.parse(m[0]);
  const cover = typeof parsed.cover === 'string' && parsed.cover.trim() ? parsed.cover.trim() : null;
  const inline = Array.isArray(parsed.inline)
    ? parsed.inline.slice(0, inlines.length).map((s) => (typeof s === 'string' ? s.trim() : ''))
    : [];
  return { cover, inline };
}

function bodyExcerpt(body, max = 500) {
  return body
    .split('\n')
    .filter((l) => !/^\s*!\[.*\]\(.*\)\s*$/.test(l))
    .join(' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
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

// 0) Art direction — let a text model read the article and write vivid,
// article-specific prompts (subject + mood palette + medium). Falls back to
// the keyword heuristic if the call fails.
const inlineCtx = inlinePositions.map((pos) => ({
  title: pos.title,
  preview: sectionPreview(body, pos.index),
}));
let art = null;
try {
  process.stdout.write('🎨 art-directing via LLM… ');
  art = await artDirect({
    title: fm.title,
    description: fm.description,
    excerpt: bodyExcerpt(body),
    inlines: inlineCtx,
  });
  console.log(`ok (${ARK_TEXT_MODEL})`);
} catch (e) {
  console.log(`failed → falling back to heuristic\n   ${e.message}`);
}
console.log('');

// 1) Cover
const coverPath = path.join(outDir, 'cover.jpeg');
const coverExists = await fs.access(coverPath).then(() => true).catch(() => false);
if (coverExists && !force) {
  console.log(`✓ cover exists → ${coverPath} (use --force to regen)`);
} else {
  const cprompt = art?.cover ? wrapPrompt(art.cover) : coverPrompt(fm.title, fm.description);
  console.log(`📸 cover: ${dry ? cprompt : cprompt.slice(0, 120) + '...'}`);
  if (!dry) {
    await generateImageToFile(cprompt, '1280x720', coverPath);
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
  const iprompt = art?.inline?.[i]
    ? wrapPrompt(art.inline[i])
    : inlinePrompt(pos.title, preview);
  console.log(`📸 inline-${i + 1} (after H2 "${pos.title}"): ${dry ? iprompt : iprompt.slice(0, 120) + '...'}`);
  if (!dry) {
    await generateImageToFile(iprompt, '1024x1024', dest);
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
