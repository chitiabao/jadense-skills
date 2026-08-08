# jadense-scholar-search

Provider-neutral scholarly literature search: one normalized result set from arXiv, OpenAlex, Crossref, PubMed, Semantic Scholar, and optional Google Scholar, delivered via CLI or library API.

[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](.github/workflows/ci.yml)

> **A note on language**: this package is written in English at the code level, but its result delivery is fully bilingual (Chinese + English). Titles render in both languages and abstracts switch between them via tabs, so it works equally well for Chinese- and English-speaking users.

---

## Overview

`jadense-scholar-search` abstracts a messy reality: every scholarly API returns differently shaped records, with different identity schemes, fields, and rate limits. This package normalizes all of them into one transient, predictable response --- a single list of `PaperCandidate` objects plus a query plan and provider diagnostics.

It is built for **agents and host applications** that need paper discovery, date-bounded retrieval, cross-source deduplication, or a traceable literature shortlist --- without coupling to any single vendor. It is *not* a database, a billing system, or a persistence layer; results are transient by design.

The core is deliberately **provider-neutral**: external providers plug in behind a `ProviderAdapter` interface, credentials are injected by the caller, and a failing provider never corrupts the results of the others.

## Features

- **Six providers, one interface** — arXiv, OpenAlex, Crossref, PubMed, Semantic Scholar, and optional SerpApi-backed Google Scholar, all behind a `ProviderAdapter`.
- **Query planning** — infers providers from your intent, normalizes and deduplicates up to four queries, and validates date ranges.
- **Cross-source deduplication** — merges the same paper found in multiple providers using DOI or trusted external IDs.
- **Weighted ranking** — scores candidates by relevance, citations, and recency so the best matches surface first.
- **Abstract enrichment** — `--enrich` completes missing abstracts via OpenAlex after ranking and backfills venue/URL/date/citation metadata.
- **Bilingual HTML delivery** — self-contained, zero-dependency result pages with Chinese + English titles and tabbed abstracts.
- **Failure isolation** — provider errors are captured as diagnostics and never discard successful results.
- **Offline mode** — `--offline` runs on bundled fixtures and never touches the network, perfect for tests and demos.
- **CLI + library** — a full CLI for scripting and a typed ESM API for embedding.

## Installation

```sh
npm install
```

This installs the runtime dependency (`@xmldom/xmldom`) and dev tooling (TypeScript, `tsx`, `@types/node`). Requires **Node.js >= 20**.

Build and verify:

```sh
npm run check   # tsc build + test suite
```

To install the package itself as a dependency:

```sh
npm install jadense-scholar-search
```

## Quick Start

The fastest path is the offline CLI, which uses bundled fixtures and reaches no external service:

```sh
npm run build
node dist/bin/scholar-search.mjs --offline --query "transformer interpretability"
```

For a live search across two providers, omit `--offline` and give a descriptive user agent:

```sh
node dist/bin/scholar-search.mjs \
  --query "retrieval augmented generation" \
  --provider openalex --provider crossref \
  --from 2020-01-01 --to 2025-12-31 \
  --format markdown
```

Complete missing abstracts and emit JSON:

```sh
node dist/bin/scholar-search.mjs \
  --query "coconut water composition" \
  --provider pubmed --enrich --format json
```

### Library API

```ts
import { executeSearch } from "jadense-scholar-search"

const response = await executeSearch({
  queries: ["transformer interpretability"],
  providers: ["openalex", "arxiv"],
  limit: 10,
  dateRange: { from: "2020-01-01", to: "2025-12-31" },
}, {
  offline: false,
  runtime: {
    userAgent: "my-agent/1.0 (research@example.org)",
    contactEmail: "research@example.org",
    credentials: { serpApiKey: process.env.SERPAPI_API_KEY },
  },
})

// response.results  -> PaperCandidate[]
// response.queryPlan -> providers, limit, dateRange, hit counts
// response.diagnostics -> redacted, severity-coded
```

Enable abstract enrichment from the library:

```ts
import { executeSearch } from "jadense-scholar-search"

const response = await executeSearch(
  { queries: ["coconut water nutrition"] },
  {
    enrich: { abstract: true, topN: 8, providers: ["openalex"] },
    offline: true,
    runtime: { userAgent: "my-agent/1.0" },
  }
)
```

For a bilingual HTML result page, follow the self-contained template in `references/html-result-guide.md` and map `response.queryPlan`, `response.results`, and `response.diagnostics` into it. HTML delivery is a documented workflow, not a bundled renderer.

## Repository Structure

```
jadense-scholar-search/
├── src/                    # TypeScript source
│   ├── bin/scholar-search.mts   # CLI entry point
│   ├── providers/               # one adapter per provider + index
│   ├── enrichment.ts            # abstract completion via OpenAlex
│   ├── planning.ts              # provider inference, query normalization
│   ├── normalize.ts             # candidate identity + dedup
│   ├── search.ts                # orchestration
│   ├── errors.ts                # classified error types
│   ├── types.ts                 # public types (PaperCandidate, etc.)
│   └── index.ts                 # public exports
├── tests/                  # test suites (tsx --test tests/*.test.ts)
├── examples/               # ready-to-open sample result pages
├── references/              # delivery guides
│   ├── html-result-guide.md     # self-contained HTML template + style
│   └── translation-guide.md     # bilingual translation + reading-guide rules
├── integrations/jadense/   # downstream integration notes
├── docs/images/            # screenshots used in this README
├── .github/workflows/      # CI + release pipelines
├── dist/                   # built output (from src, gitignored for source)
├── SKILL.md                # skill/agent-facing instructions
├── README.md               # this file
├── SECURITY.md             # security policy
└── package.json            # scripts, exports, CLI metadata
```

## Configuration

### CLI flags

| Flag | Description |
|------|-------------|
| `-q, --query <text>` | Query; repeat up to four times |
| `-p, --provider <id>` | Provider; repeat or comma-separate |
| `--limit <1..30>` | Retrieval limit per query |
| `--from / --to <YYYY-MM-DD>` | Inclusive publication date range |
| `--format <json\|markdown>` | Output format |
| `--offline` | Use fixtures, never call a provider |
| `--enrich` | Complete missing abstracts via OpenAlex after ranking |
| `--user-agent <text>` | Injected HTTP User-Agent |
| `--contact-email <email>` | Provider contact metadata |

### Environment variables

Only **Google Scholar** requires a key. The others are optional.

| Variable | Required for | Notes |
|----------|--------------|-------|
| `SERPAPI_API_KEY` | `google_scholar` | Google Scholar is BYOK through SerpApi; never inferred without explicit intent |
| `SEMANTIC_SCHOLAR_API_KEY` | `semantic_scholar` (optional) | Raises rate limits |
| `NCBI_API_KEY` | `pubmed` (optional) | Raises rate limits |
| `NCBI_TOOL` | `pubmed` (optional) | Tool identifier for NCBI |

The CLI reads these to build the runtime. The **core itself never reads the environment** — credentials are always injected through `SearchRuntimeConfig`, keeping the library side-effect free.

## Examples

The `examples/` directory contains a real result page from a live search on **椰子水的营养价值** (nutritional value of coconut water) across OpenAlex and PubMed, then enriched and rendered with the bilingual HTML template.

Full page: the dark summary band shows the query, providers, and pipeline statistics (total hits, merged candidates, enriched abstracts, warnings).

![Coconut water search results, full page](docs/images/coconut-results-full.png)

Each paper is a card with a bilingual title, a reading-guide panel, tabbed Chinese/English abstracts, citation count, and provider badges.

![Coconut water search results, paper card](docs/images/coconut-paper-card.png)

Open `examples/coconut-water-nutrition-search.html` in any browser to explore the live page.

## Contributing

Contributions are welcome. This is a focused package, so please keep changes aligned with its provider-neutral philosophy.

- **Fork and branch** — open a PR against `main`.
- **Respect the boundaries** — the core must stay vendor-neutral; new providers implement `ProviderAdapter` and register in `src/providers/index.ts`.
- **Keep credentials injected** — never read environment variables inside the core.
- **Add tests** — run `npm run check` (build + `tsx --test tests/*.test.ts`). Live smoke tests must remain opt-in; use fixtures for parser tests.
- **Read `SECURITY.md`** before touching providers or logging — diagnostics must stay redacted and stable.

For a larger or long-lived project, please move this content into a dedicated `CONTRIBUTING.md`.

## License, Security & Support

- **License**: MIT — see [LICENSE](LICENSE).
- **Security**: see [SECURITY.md](SECURITY.md) for how to report suspected credential exposure, how secrets are handled, and how to use third-party APIs safely. If you execute this code, touch third-party services, or pass credentials, please read it before adding providers or logging.
- **Support**: this is a maintained open-source package. For bugs and feature requests, open an issue; for security matters, use the private reporting path in `SECURITY.md` rather than a public issue.