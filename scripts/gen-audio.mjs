#!/usr/bin/env node
// Generate a read-aloud mp3 for an article using Volcano/Doubao TTS
// (火山引擎·语音合成), upload it to Cloudflare R2, and write the public URL
// back into the article's frontmatter as `audio:`.
//
// Usage:
//   node --env-file=.env scripts/gen-audio.mjs <path-to-md> [--dry] [--force] [--no-upload]
//
// Required env (.env):
//   TTS (火山语音技术控制台 → 语音合成):
//     VOLC_TTS_APPID, VOLC_TTS_TOKEN, VOLC_TTS_CLUSTER, VOLC_TTS_VOICE
//   R2 (Cloudflare dashboard → R2 → Manage API Tokens → S3 credentials):
//     R2_ENDPOINT   e.g. https://<accountid>.r2.cloudflarestorage.com
//     R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
//   AUDIO_BASE_URL  public base, e.g. https://audio.tommickey.cn
//
// Flags:
//   --dry        extract + chunk text, print plan, no API calls, no writes
//   --force      regenerate even if frontmatter already has audio:
//   --no-upload  synthesize + save local mp3 only (audio-out/<slug>.mp3), skip R2

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
// undici fetch so we can route the (cn) TTS host through a proxy when needed.
import { fetch, ProxyAgent, Agent } from 'undici';

const _proxy = process.env.HTTPS_PROXY || process.env.https_proxy
  || process.env.HTTP_PROXY || process.env.http_proxy;
const _dispatcher = _proxy ? new ProxyAgent(_proxy) : new Agent();
if (_proxy) console.log(`🌐 using proxy for TTS: ${_proxy}`);

// ---------- config ----------
const TTS_HOST = process.env.VOLC_TTS_HOST ?? 'https://openspeech.bytedance.com/api/v1/tts';
const APPID = process.env.VOLC_TTS_APPID;
const TOKEN = process.env.VOLC_TTS_TOKEN;
const CLUSTER = process.env.VOLC_TTS_CLUSTER ?? 'volcano_tts';
const VOICE = process.env.VOLC_TTS_VOICE ?? 'BV001_streaming';
const SPEED = Number(process.env.VOLC_TTS_SPEED ?? '1.0');

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const AUDIO_BASE_URL = (process.env.AUDIO_BASE_URL ?? 'https://audio.tommickey.cn').replace(/\/$/, '');

const MAX_CHARS = Number(process.env.VOLC_TTS_MAX_CHARS ?? '280'); // per-request text cap

// ---------- args ----------
const args = process.argv.slice(2);
const mdPath = args.find((a) => !a.startsWith('--'));
const dry = args.includes('--dry');
const force = args.includes('--force');
const noUpload = args.includes('--no-upload');

if (!mdPath) {
  console.error('Usage: node --env-file=.env scripts/gen-audio.mjs <path-to-md> [--dry] [--force] [--no-upload]');
  process.exit(1);
}

// ---------- frontmatter ----------
function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { raw: '', body: text };
  return { raw: m[1], body: m[2] };
}
function fmValue(raw, key) {
  const m = raw.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : undefined;
}

// ---------- readable-text extraction ----------
function extractReadable(body, lang) {
  let t = body;
  t = t.replace(/```[\s\S]*?```/g, ' ');              // fenced code
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');         // images
  // Cut a trailing English translation section (site shows zh by default).
  if (lang !== 'en') {
    const en = t.search(/\n#{1,6}\s*English\b/i);
    if (en !== -1) t = t.slice(0, en);
  }
  t = t.replace(/^\s{0,3}>\s?/gm, '');                 // blockquote markers
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, '');            // heading hashes
  t = t.replace(/^\s*(?:---|\*\*\*|___)\s*$/gm, ' ');  // hr
  t = t.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2'); // [[a|b]] -> b
  t = t.replace(/\[\[([^\]]*)\]\]/g, '$1');            // [[a]] -> a
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');       // [text](url) -> text
  t = t.replace(/`([^`]*)`/g, '$1');                   // inline code
  t = t.replace(/^\s*[-*+]\s+/gm, '');                 // ul markers
  t = t.replace(/^\s*\d+\.\s+/gm, '');                 // ol markers
  t = t.replace(/(\*\*|\*|__|_|~~)/g, '');             // emphasis
  // Normalise: collapse intra-paragraph whitespace, keep blank lines as breaks.
  return t
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

// Chunk to <= MAX_CHARS, splitting on sentence punctuation, never mid-sentence.
function chunkText(text) {
  const chunks = [];
  for (const para of text.split('\n')) {
    if (para.length <= MAX_CHARS) { chunks.push(para); continue; }
    const sentences = para.split(/(?<=[。！？；.!?;])/);
    let buf = '';
    for (const s of sentences) {
      if ((buf + s).length > MAX_CHARS && buf) { chunks.push(buf); buf = ''; }
      if (s.length > MAX_CHARS) {
        // hard-wrap an over-long sentence
        for (let i = 0; i < s.length; i += MAX_CHARS) chunks.push(s.slice(i, i + MAX_CHARS));
      } else {
        buf += s;
      }
    }
    if (buf) chunks.push(buf);
  }
  return chunks.map((c) => c.trim()).filter(Boolean);
}

// ---------- TTS ----------
async function synthChunk(text) {
  const resp = await fetch(TTS_HOST, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer;${TOKEN}`,
    },
    body: JSON.stringify({
      app: { appid: APPID, token: TOKEN, cluster: CLUSTER },
      user: { uid: 'tommickey-web' },
      audio: { voice_type: VOICE, encoding: 'mp3', speed_ratio: SPEED },
      request: { reqid: crypto.randomUUID(), text, operation: 'query' },
    }),
    dispatcher: _dispatcher,
  });
  const json = await resp.json();
  if (json.code !== 3000 || !json.data) {
    throw new Error(`TTS ${json.code}: ${json.message ?? JSON.stringify(json).slice(0, 300)}`);
  }
  return Buffer.from(json.data, 'base64');
}

// ---------- R2 (S3 SigV4 PUT, dependency-free) ----------
const hmac = (key, msg) => crypto.createHmac('sha256', key).update(msg).digest();
const sha256hex = (msg) => crypto.createHash('sha256').update(msg).digest('hex');

async function putR2(key, body, contentType) {
  const url = new URL(`${R2_ENDPOINT.replace(/\/$/, '')}/${R2_BUCKET}/${key}`);
  const host = url.host;
  const region = 'auto';
  const service = 's3';
  const amzdate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const datestamp = amzdate.slice(0, 8);
  const payloadHash = sha256hex(body);
  const canonicalHeaders =
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzdate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['PUT', url.pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${datestamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzdate, scope, sha256hex(canonicalRequest)].join('\n');
  let k = hmac(`AWS4${R2_SECRET}`, datestamp);
  k = hmac(k, region); k = hmac(k, service); k = hmac(k, 'aws4_request');
  const signature = crypto.createHmac('sha256', k).update(stringToSign).digest('hex');
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${R2_KEY}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'x-amz-date': amzdate,
      'x-amz-content-sha256': payloadHash,
      'Content-Type': contentType,
    },
    body,
  });
  if (!resp.ok) throw new Error(`R2 PUT ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
}

// ---------- main ----------
const text = await fs.readFile(mdPath, 'utf8');
const { raw, body } = splitFrontmatter(text);
const slug = path.basename(mdPath, '.md');
const lang = fmValue(raw, 'lang') ?? 'zh';
const existingAudio = fmValue(raw, 'audio');

const readable = extractReadable(body, lang);
const chunks = chunkText(readable);
const totalChars = chunks.reduce((n, c) => n + c.length, 0);

console.log(`📄 ${mdPath}`);
console.log(`   slug: ${slug}  lang: ${lang}`);
console.log(`   readable chars: ${totalChars}  chunks: ${chunks.length}  (max ${MAX_CHARS}/chunk)`);
console.log(`   est. audio: ~${(totalChars / 250).toFixed(1)} min @ 250 cpm`);
if (existingAudio) console.log(`   existing audio: ${existingAudio}${force ? ' (will overwrite)' : ''}`);

if (dry) {
  console.log('\n--- chunks preview ---');
  chunks.slice(0, 3).forEach((c, i) => console.log(`  [${i}] ${c.slice(0, 60)}…`));
  console.log(`  … (${chunks.length} total)`);
  console.log('\n(dry run — no API calls, no writes)');
  process.exit(0);
}

if (existingAudio && !force) {
  console.log('\n✓ audio already set (use --force to regenerate). Nothing to do.');
  process.exit(0);
}

// Validate credentials only now (so --dry works without them).
const missTts = ['VOLC_TTS_APPID', 'VOLC_TTS_TOKEN'].filter((k) => !process.env[k]);
if (missTts.length) { console.error(`\n✗ Missing TTS env: ${missTts.join(', ')}`); process.exit(1); }
if (!noUpload) {
  const missR2 = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
    .filter((k) => !process.env[k]);
  if (missR2.length) { console.error(`\n✗ Missing R2 env: ${missR2.join(', ')} (or use --no-upload)`); process.exit(1); }
}

// 1) Synthesize each chunk → concat mp3 buffers.
console.log('\n🔊 synthesizing…');
const parts = [];
for (let i = 0; i < chunks.length; i++) {
  process.stdout.write(`   chunk ${i + 1}/${chunks.length}\r`);
  parts.push(await synthChunk(chunks[i]));
}
const mp3 = Buffer.concat(parts);
console.log(`\n   mp3 size: ${(mp3.length / 1024 / 1024).toFixed(2)} MB`);

// 2) Always keep a local copy (gitignored) for re-upload / inspection.
const outDir = 'audio-out';
await fs.mkdir(outDir, { recursive: true });
const localPath = path.join(outDir, `${slug}.mp3`);
await fs.writeFile(localPath, mp3);
console.log(`   saved local → ${localPath}`);

// 3) Upload to R2.
let audioUrl = existingAudio;
if (noUpload) {
  console.log('   --no-upload: skipped R2 + frontmatter.');
  process.exit(0);
}
const key = `${slug}.mp3`;
await putR2(key, mp3, 'audio/mpeg');
audioUrl = `${AUDIO_BASE_URL}/${key}`;
console.log(`   uploaded → ${audioUrl}`);

// 4) Write audio: into frontmatter (add or replace).
let newRaw = raw;
if (/^audio:/m.test(raw)) {
  newRaw = raw.replace(/^audio:.*$/m, `audio: ${audioUrl}`);
} else {
  newRaw = raw.trimEnd() + `\naudio: ${audioUrl}`;
}
await fs.writeFile(mdPath, `---\n${newRaw}\n---\n${body}`);
console.log(`\n✓ Updated frontmatter in ${mdPath}`);
