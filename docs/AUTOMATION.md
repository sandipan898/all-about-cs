# AACS Automation Pipeline — Implementation & Usage

> A dispatch-first automation system for All About CS: content quality gates,
> weekly reporting, social drafts, SEO/Core-Web-Vitals checks, and a cost
> limiter — all runnable from GitHub Actions, the CLI, or any chatbot.

---

## 1. Design at a glance

Three layers, one contract:

1. **Primitives** — portable TypeScript scripts in `scripts/` (run with `tsx`,
   no heavy deps). Each exposes a `run*()` function and can run standalone.
2. **Orchestration** — GitHub Actions in `.github/workflows/` (push + cron +
   `workflow_dispatch` + `repository_dispatch`).
3. **Judgment** — you + the AI agent, invoking the same primitives on demand.

Everything routes through **one entrypoint** so any surface behaves identically:

```
npm run auto -- <task> [--flags]
```

### Dispatch-first (scheduler-agnostic)
Every scheduled workflow also listens on `workflow_dispatch` (manual) and
`repository_dispatch` (external). GitHub cron is the default trigger; swapping in
**cron-jobs.org** later is a 5-minute change — point it at either:
- the GitHub API `repository_dispatch` endpoint, or
- the secured `/api/cron/<task>` route (which relays to `repository_dispatch`).

No script or workflow changes are needed to switch schedulers.

---

## 2. Files

| Path | Responsibility |
| --- | --- |
| `scripts/auto.ts` | Universal CLI dispatcher (`validate`/`next-topic`/`curriculum`/`report`/`social`/`usage`). |
| `scripts/validate-content.ts` | Blocking content gate (frontmatter, links, placeholder-video guard). |
| `scripts/next-topic.ts` | Deterministic "what to write next" resolver. |
| `scripts/curriculum.ts` | Audit curriculum vs files; emit AI research brief; apply AI output. |
| `scripts/report.ts` | Weekly digest → rolling GitHub issue (+ optional Umami). |
| `scripts/social.ts` | Per-platform promo drafts (X, LinkedIn, Reddit, Dev.to, newsletter). |
| `scripts/usage-guard.ts` | GitHub Actions minutes limiter + pre-overage alert. |
| `scripts/test.ts` | Zero-dependency unit tests (Node `assert`). |
| `scripts/lib/{content,github,log}.ts` | Shared helpers. |
| `scripts/lib/gsc.ts` | GSC Search Analytics fetcher (raw RS256 JWT, zero deps). |
| `scripts/lib/cwv.ts` | PageSpeed Insights / CrUX CWV fetcher + threshold alerting. |
| `scripts/seo-signals.ts` | Orchestrates GSC + CWV, writes `automation-output/seo-signals.json`, opens CWV alert issue. |
| `content/curriculum.json` | Ordered per-pillar syllabus that drives `next-topic`. |
| `.github/workflows/ci.yml` | Lint → typecheck → test → validate → build (push/PR). |
| `.github/workflows/quality.yml` | Nightly Lighthouse + SEO-endpoint check (gated). |
| `.github/workflows/report.yml` | Weekly digest + social drafts (gated). |
| `.github/workflows/usage-guard.yml` | Daily budget watchdog + alert issue. |
| `src/app/api/cron/[task]/route.ts` | Secured external-scheduler trigger (relay). |

---

## 3. Usage

### Local / any chatbot (the portable contract)

```bash
npm run auto -- validate                     # content quality gate
npm run auto -- next-topic                    # next tutorial to write
npm run auto -- next-topic --topic="python generators"   # explicit override
npm run auto -- next-topic --pillar=dsa       # bias toward a pillar
npm run auto -- next-topic --by=opportunity   # rank gaps by baked-in SEO score
npm run auto -- seo-signals              # fetch GSC + CWV, write seo-signals.json
npm run auto -- seo-signals --cwv-only   # CWV only (skips GSC)
npm run auto -- curriculum                    # audit curriculum vs files
npm run auto -- curriculum --prompt           # emit AI research brief
npm run auto -- curriculum --apply <file>     # merge AI-produced curriculum
npm run auto -- report                        # build the weekly digest
npm run auto -- social --slug=python-loops    # promo drafts for one tutorial
npm run auto -- usage                         # check Actions minutes
npm run auto -- help
```

Direct npm aliases also exist: `npm run validate`, `npm test`, `npm run typecheck`.

> **Any chatbot** that cannot run tools simply emits one of the commands above
> (or a `curl` to `/api/cron/...`) for you to run. Same script, same result.

### Trigger a workflow without pushing code

Manual (GitHub UI): Actions → pick workflow → **Run workflow**.

Via API (`repository_dispatch`) — the form any external scheduler/chatbot uses:

```bash
curl -X POST \
  -H "Authorization: Bearer $GH_DISPATCH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/sandipan898/all-about-cs/dispatches \
  -d '{"event_type":"report"}'   # or "quality" / "usage"
```

### Via the secured HTTP endpoint (for cron-jobs.org)

```
GET https://allaboutcs.dev/api/cron/report?secret=YOUR_CRON_SECRET
# or send header:  x-cron-secret: YOUR_CRON_SECRET
```

- Light tasks (`ping`, `sitemap-ping`) run inline.
- Heavy tasks (`report`, `quality`, `usage`) are relayed to GitHub Actions.
- Missing/incorrect secret → `401`.

---

## 4. The "next topic" strategy

`next-topic` resolves in strict priority order:

1. **Explicit** — `--topic="..."` wins over everything.
2. **Unfinished series** — any `<SeriesNavigation>` whose parts aren't all published.
3. **Curriculum gap** — next planned slug in `content/curriculum.json`
   (anchor pillar `python` first, then spokes; `--pillar` biases the order).
4. **Research fallback** — nothing queued → open the weekly digest and pick a
   keyword-driven topic.

**To steer content:** edit `content/curriculum.json` — add/reorder `planned`
items, or change `anchor` / a pillar's `priority`.

## 4a. Curriculum: how it's maintained (AI-assisted)

`content/curriculum.json` is the ordered, per-pillar syllabus that drives
`next-topic`. It is **not** hand-typed guesswork — it is kept in sync and
refreshed by AI research through the chat-in-the-loop model:

```bash
npm run auto -- curriculum            # AUDIT: files missing from curriculum,
                                      #        planned-but-unwritten topics,
                                      #        slug-quality flags
npm run auto -- curriculum --prompt   # write automation-output/curriculum-brief.md
npm run auto -- curriculum --apply automation-output/curriculum.candidate.json
```

Workflow: run `--prompt` → paste the brief into any AI chat → save the JSON
reply → `--apply` it. `--apply` **refuses to drop or rename an existing
published slug** unless you pass `--allow-slug-changes` (protects live URLs).

### Where the SEO/trend intelligence lives
`curriculum.ts` is the **AI planner** (market research + keyword demand + trend
analysis + pedagogical ordering); `next-topic.ts` is a **thin deterministic
executor** that just consumes the plan — no AI, no network, fully testable. The
planner writes optional per-item SEO metadata:

```json
{ "slug": "python-f-strings-and-formatting", "title": "f-Strings and Formatting",
  "keyword": "python f-string", "intent": "how-to", "opportunity": "high" }
```

- `next-topic --by=opportunity` ranks the curriculum gaps by that `opportunity`
  score (default order stays pedagogical). Still 100% deterministic.
- If `automation-output/seo-signals.json` exists (e.g. a GSC export), the
  `--prompt` brief embeds it as authoritative demand data so the AI ranks against
  YOUR real Search Console numbers instead of guesses.

### SEO slug facts (important)
- Tutorial URLs are **flat**: `/tutorials/<slug>` — there is **no**
  `/topics/<pillar>/` path segment. So the `python-` prefix is **not redundant**;
  it is the only thing carrying the topic keyword into the URL. Keep it.
- **Renaming a published slug changes a live, indexed URL.** Only do it with a
  301 redirect (add it to `src/middleware.ts`). Candidates worth fixing:
  `python_packages_and_pip` (underscores), `guide-to-lambda-expressons` (typo),
  `working-with-database` / `working-with-web-apis` (missing `python-` keyword).

---

## 5. Configuration

### Secrets (repo Settings → Secrets and variables → **Secrets**)
| Secret | Used by | Notes |
| --- | --- | --- |
| `UMAMI_API_URL` / `UMAMI_API_TOKEN` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | report | Optional analytics enrichment. |
| `GSC_SERVICE_ACCOUNT_JSON` | seo-signals, report | Google service-account JSON (plain or base64). Add service-account email as a User on the GSC property. |
| `PAGESPEED_API_KEY` | seo-signals, quality | Free API key from Google Cloud (enable PageSpeed Insights API). |
| `CRON_SECRET` | `/api/cron` | Set in **Vercel** env. Protects the endpoint. |
| `GH_DISPATCH_TOKEN` | `/api/cron` relay | Set in **Vercel** env. Fine-grained PAT, Actions: read/write, this repo only. |

> `GITHUB_TOKEN` is provided automatically inside Actions — no setup needed.

### Variables (repo Settings → Secrets and variables → **Variables**)
| Variable | Default | Effect |
| --- | --- | --- |
| `AUTOMATION_ENABLED` | `true` | **Master switch.** Set `false` to pause ALL scheduled jobs. |
| `REPORTS_ENABLED` | `true` | Toggle the weekly report job. |
| `LIGHTHOUSE_ENABLED` | `true` | Toggle the nightly quality job. |
| `USAGE_WARN_THRESHOLD` | `75` | Warn at this % of included minutes. |
| `USAGE_ALERT_THRESHOLD` | `90` | Alert + (in enforce mode) skip heavy jobs. |
| `GSC_SITE_URL` | _(none)_ | Verified GSC property (e.g. `https://allaboutcs.dev/`). Not a secret; set as a Variable. |

---

## 6. Cost control & limiter

- **`usage-guard`** checks GitHub Actions minutes each day and before the
  expensive quality job. At `USAGE_ALERT_THRESHOLD` it opens/updates a single
  `actions-usage-alert` issue **before** any overage — so you're warned even if
  you never open the Actions tab. In `--enforce` mode it skips the heavy job.
- **Public repos** have unlimited free minutes → the guard reports "unlimited"
  and always passes.
- **Pausing when idle:** flip `AUTOMATION_ENABLED=false` (one variable stops all
  cron). Individual jobs: `REPORTS_ENABLED` / `LIGHTHOUSE_ENABLED`. GitHub also
  auto-disables scheduled workflows after 60 days of repo inactivity.

### What can cost money
| Component | Cost |
| --- | --- |
| GitHub Actions | Free/unlimited on public repos; metered on private (2,000 min/mo free). |
| Vercel | Hobby free (non-commercial); Pro (~$20/mo) if commercial. |
| Umami / Supabase / Wandbox / GSC | Free tiers. |
| Email (future digest) / social scheduler | Free tiers, paid at volume. |

At current scale the pipeline runs at **≈ $0/month**.

---

## 7. First-run checklist

1. Push to GitHub → `ci.yml` runs on the PR/commit.
2. Add repo **Variables** (section 5) — or accept defaults (all enabled).
3. (Optional) Add Umami **Secrets** for richer reports.
4. (Optional) **GSC + CWV:**
   - Create a Google Cloud service account, download its JSON key, add as a GSC User, store JSON as secret `GSC_SERVICE_ACCOUNT_JSON` and set variable `GSC_SITE_URL`.
   - Enable PageSpeed Insights API in Google Cloud, create a free API key, store as `PAGESPEED_API_KEY`.
   - On next `report.yml` run the digest will include a full GSC + CWV section.
5. (Optional, for cron-jobs.org) set `CRON_SECRET` + `GH_DISPATCH_TOKEN` in
   Vercel, then create cron-jobs.org jobs pointing at
   `https://allaboutcs.dev/api/cron/<task>`.
6. Trigger a dry run: Actions → **Weekly report** → Run workflow.

---

## 8. Known follow-ups (not yet implemented)

- **User weekly-digest email**: needs a subscriber table (Supabase) + email
  provider (Resend/Buttondown). The digest *content* generator already exists
  (`scripts/report.ts`); only delivery + subscription capture remain.
- **Auto-posting social** drafts (currently review-only) via Buffer/Typefully.
- **GSC integration** in `report.ts` (currently Umami-only) for low-CTR queries.
