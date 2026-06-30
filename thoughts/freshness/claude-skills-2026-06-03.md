---
topic: claude skills
window: 2026-05-04 .. 2026-06-03
created: 2026-06-03
---

# Freshness scan: Claude Skills (Agent Skills)

**Window:** 2026-05-04 → 2026-06-03 (last 30 days, ending today).
Items outside this window are kept only as **context** and labelled as such.

---

## 1. TL;DR (most decision-relevant changes this window)

- **Skills moved deeper into Claude Code's core UX.** In-window releases made
  `.claude/skills` plugins **auto-load without a marketplace** (v2.1.157, May 31),
  added `/reload-skills` + `SessionStart → reloadSkills:true` for hot-reload
  (v2.1.152, May 27), and let skills declare **`disallowed-tools` in frontmatter**
  to shrink the toolset while active (v2.1.152). *(durable)*
- **Opus 4.8 shipped May 28** with **Dynamic Workflows** (research preview,
  hundreds of parallel subagents) — described as the biggest Claude Code feature
  *"since the original Skills/Hooks system."* The trigger keyword was then
  **renamed `workflow` → `ultracode`** on June 2 (v2.1.160). *(durable)*
- **Security is now the dominant Skills story.** Marketplaces ballooned (1 registry
  Dec 2025 → ~8 by Q2 2026) and audits found pervasive prompt-injection. The
  guidance has hardened to: **only run skills you wrote or got from Anthropic;
  audit everything else.** *(durable — but the headline audits predate this window;
  see §4)*
- **Enterprise governance landed:** Team/Enterprise admins can now centrally
  provision skills and set which are enabled by default; partner directory
  (Atlassian, Canva, Cloudflare, Figma, Notion, Ramp, Sentry). *(durable)*
- **Vertical skill packs accelerated:** 10 finance agent templates (May 5) and a
  legal push (20+ connectors, 12 practice-area plugins packaging Skills). *(durable)*

---

## 2. What's new (in-window releases)

| Item | Version / ref | Date | What changed | Source |
|---|---|---|---|---|
| Claude Code: auto-load `.claude/skills` plugins (no marketplace); `claude plugin init <name>`; `/plugin` autocomplete | v2.1.157 | May 31 2026 | Skills/plugins discoverable without a marketplace registry | [releasebot CC](https://releasebot.io/updates/anthropic/claude-code) |
| Claude Code: `disallowed-tools` frontmatter for skills; `/reload-skills`; `SessionStart` hooks can return `reloadSkills:true`; `MessageDisplay` hook | v2.1.152 | May 27 2026 | Skills can restrict tools + hot-reload within a session | [releasebot CC](https://releasebot.io/updates/anthropic/claude-code) |
| Claude Code: plugins can declare `defaultEnabled:false`; `/plugin` Discover pins dir-suggested plugins; new env vars | v2.1.154 | May 29 2026 | Install-without-activate; better discovery | [releasebot CC](https://releasebot.io/updates/anthropic/claude-code) |
| Claude Code: `claude agents --json`; `/plugin` shows commands/agents/skills/hooks/MCP before install | v2.1.145 | May 20 2026 | Scriptable agents + pre-install transparency | [releasebot CC](https://releasebot.io/updates/anthropic/claude-code) |
| Opus 4.8 + Dynamic Workflows (research preview); Effort Control; Fast Mode (2.5×, 3× cheaper) | Opus 4.8 | May 28 2026 | New flagship; subagent orchestration "since Skills/Hooks" | [Anthropic](https://www.anthropic.com/news/claude-opus-4-8), [TechCrunch](https://techcrunch.com/2026/05/28/anthropic-releases-opus-4-8-with-new-dynamic-workflow-tool/) |
| Dynamic-workflow trigger renamed `workflow` → `ultracode` | v2.1.160 | June 2 2026 | Keyword change (update any scripts/docs) | [releasebot CC](https://releasebot.io/updates/anthropic/claude-code) |
| `/code-review --fix` applies findings to working tree; `/simplify` now calls `/code-review --fix` | June 2026 | June 2026 | Skill-driven review writes changes | [releasebot CC](https://releasebot.io/updates/anthropic/claude-code) |
| `/claude-api` skill gains Opus 4.8 support + 4.7→4.8 migration guidance | June 2026 | June 2026 | Skill content updated for new model | [releasebot CC](https://releasebot.io/updates/anthropic/claude-code) |
| Managed/Agent admin: central provisioning + default-enabled skills (Team/Enterprise) | — | ~May 7 2026 | Admin control over which skills users get | [9to5Mac](https://9to5mac.com/2026/05/07/anthropic-updates-claude-managed-agents-with-three-new-features/) |
| 10 finance agent templates (pitchbook, KYC, earnings, month-end close) | — | May 5 2026 | Vertical skill packs | [Let's Data Science](https://letsdatascience.com/news/anthropic-launches-ten-finance-agent-templates-for-claude-6516f048) |
| Legal vertical push: 20+ connectors, 12 practice-area plugins packaging Skills | — | May 2026 | Vertical skill packs | [releasebot Claude](https://releasebot.io/updates/anthropic/claude) |

---

## 3. Momentum (what's gaining vs. losing)

**Gaining**
- **Skills as the default extension format in Claude Code.** Auto-loading +
  hot-reload + frontmatter tool-scoping make skills first-class; you no longer
  need a marketplace to use them. *(durable — shipped in version notes)*
- **Cross-tool SKILL.md portability.** Same skill files reportedly run across
  Claude Code, Cursor, Gemini CLI, Codex CLI, Antigravity IDE — the format is
  becoming a de-facto standard (Anthropic pushing it as an open spec, MCP-style).
  *(durable trend; some claims single-source — verify per tool)*
- **Security-vetted / hosted marketplaces** (e.g. Agensi's 8-point scan; Agent37
  hosted execution) as a reaction to scraped mega-catalogs. *(single-source-ish)*

**Losing / under pressure**
- **Unvetted mega-catalogs** (scraped GitHub indexes). Community guidance is now
  to *skip* them unless you'll audit each skill yourself.
- **"Install everything" habits.** Repeated guidance: keep skill sets lean — too
  many cause slow startup + false activations.

---

## 4. Deprecations & gotchas

- **Keyword rename `workflow` → `ultracode`** (June 2, v2.1.160). Any
  docs/scripts/snippets referencing the old "workflow" trigger are stale.
- **Supply-chain risk is real and large** *(context — the headline audits are
  PRE-window, but still the current state of the world):*
  - Snyk **ToxicSkills** (Feb 5 2026): prompt injection in **36%** of skills
    tested; 1,467 malicious payloads; 13.4% of 3,984 skills had critical issues.
    [Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
  - **ClawHavoc** (Feb 2026): 341 malicious skills found in one registry.
  - **Mobb.ai** (Mar 2026): 22,511 skills, 140,963 issues (~6.3/skill).
  - **OWASP "Agentic Skills Top 10"** now exists. [OWASP](https://owasp.org/www-project-agentic-skills-top-10/)
  - Practical mitigation that IS in-window: use **`disallowed-tools`** frontmatter
    (v2.1.152) to least-privilege a skill, and the **pre-install `/plugin` view**
    (v2.1.145) to inspect bundled hooks/MCP before installing.
- **Skills run with the agent's full permissions** — a malicious SKILL.md can
  exfiltrate env vars (classic payload: append `$ANTHROPIC_API_KEY` to a URL).
  Audit SKILL.md *and* bundled scripts before use; review MEMORY/SOUL files for
  poisoning.
- **New top-level skill directories still require a restart**; only edits inside
  watched dirs hot-reload. (`/reload-skills` covers re-scans, not brand-new roots.)

---

## 5. Stale-belief corrections

- *You might assume* skills require a marketplace/plugin registry to load —
  **as of May 31 2026** (v2.1.157), `.claude/skills` plugins **auto-load** and you
  can scaffold with `claude plugin init`.
- *You might assume* you must restart Claude Code to pick up an edited skill —
  **as of May 27 2026** (v2.1.152), `/reload-skills` and `SessionStart`
  `reloadSkills:true` hot-reload within the session.
- *You might assume* a skill always exposes the full toolset — **as of May 27**
  skills can set **`disallowed-tools`** in frontmatter to remove tools while active.
- *You might assume* the big Claude Code agent feature is still Skills/Hooks —
  **as of May 28** the headline is **Dynamic Workflows** (`ultracode`), parallel
  subagent orchestration, layered *on top of* skills.
- *You might assume* community skills are reasonably safe — **multiple 2026 audits**
  show pervasive prompt injection; treat third-party skills as untrusted code.

---

## 6. Implications for selection / decisions

- **Authoring your own skills (e.g. for this repo's workflows): recommended, high
  confidence (durable).** With auto-load + hot-reload, a project-level
  `.claude/skills/` is now the cleanest way to encode repeatable workflows (image
  gen, Baidu push, deploy steps). Add `disallowed-tools` to least-privilege them.
- **Consuming third-party skills: default to NO unless audited (durable).** Prefer
  Anthropic's official directory or self-authored. If you must use community ones,
  read SKILL.md + scripts, and inspect the pre-install `/plugin` view.
- **Keep the set lean (durable).** Too many skills → slow startup + false
  activations. Install only what you'll use.
- **If you script around Claude Code:** update any `workflow` keyword references to
  `ultracode`, and you can now use `claude agents --json` for session scripting
  (medium confidence — niche).
- **Cross-tool portability is attractive but verify per tool (single-source).**
  Don't assume a SKILL.md behaves identically on Cursor/Gemini/Codex without testing.

---

## 7. Open questions (worth watching)

- Will Anthropic ship **signing / provenance** for skills (code-signing, verified
  publishers) to counter the supply-chain audits? Nothing shipped in-window.
- **Dynamic Workflows / `ultracode`** is research-preview — how it composes with
  skills (does a workflow invoke skills per-subagent?) is undocumented.
- Does `disallowed-tools` extend to **MCP servers and hooks** bundled in a plugin,
  or only model-facing tools? Unclear from notes.
- **Open-standard governance:** is the SKILL.md spec moving to a neutral body
  (MCP-style), and will competitors formally adopt it? Claims are vendor-led so far.
- **Mythos-class models** "in coming weeks" — may reshape agent/skill capabilities
  again shortly after this window.

---

### Source notes / cross-checks
- In-window release facts cross-checked between [releasebot Claude Code](https://releasebot.io/updates/anthropic/claude-code)
  and Anthropic/press for Opus 4.8 ([Anthropic](https://www.anthropic.com/news/claude-opus-4-8),
  [TechCrunch](https://techcrunch.com/2026/05/28/anthropic-releases-opus-4-8-with-new-dynamic-workflow-tool/),
  [Axios](https://www.axios.com/2026/05/28/anthropic-opus-release-mythos), [9to5Mac](https://9to5mac.com/2026/05/28/anthropic-upgrades-claude-with-new-opus-4-8-model-heres-whats-new/)).
- Security/marketplace landscape from [Snyk ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/),
  [Agensi](https://www.agensi.io/learn/toxicskills-clawhavoc-agent-skills-security-crisis-2026),
  [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) — **dated Feb–Mar 2026 (pre-window, context only).**
- Skills overview / best practices: [Anthropic engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills),
  [Claude Code docs](https://code.claude.com/docs/en/skills), [Firecrawl](https://www.firecrawl.dev/blog/best-claude-code-skills).
