---
name: "jadense-scholar-search"
description: "Search scholarly literature across arXiv, OpenAlex, Crossref, PubMed, Semantic Scholar, and optional Google Scholar through a provider-neutral search core. Invoke when an agent needs paper discovery, comparison, date-bounded retrieval, or a traceable literature shortlist."
license: MIT
---

# Jadense Scholar Search

Provider-neutral scholarly literature search. The core normalizes results from arXiv, OpenAlex, Crossref, PubMed, Semantic Scholar, and optional SerpApi-backed Google Scholar into one transient response with query planning, provider diagnostics, stable identities, and source metadata.

## Layout (self-contained)

This skill is self-contained. The underlying implementation and scripts live in this directory alongside this SKILL.md:

- `src/` — TypeScript source (core, providers, CLI entry).
- `dist/` — Built output run directly by Node (`dist/bin/scholar-search.mjs`).
- `node_modules/` — Installed runtime dependencies (`@xmldom/xmldom`).
- `tests/` — Test suites (`tsx --test tests/*.test.ts`).
- `package.json` — Scripts and CLI metadata (`bin.jadense-scholar-search`).
- `README.md` / `SECURITY.md` / `LICENSE` — CLI, provider, and security details.
- `references/html-result-guide.md` — HTML result delivery style guide, self-contained template, and usage steps.
- `references/translation-guide.md` — intelligent translation and reading-guide rules (bilingual title, tabbed abstract, recommendation rationale).
- `integrations/jadense/README.md` — Downstream integration notes.

## Running the CLI

Build is already present in `dist/`. Run from this directory:

```sh
npm run build          # rebuild dist from src (tsc)
npm test               # run the test suite
node dist/bin/scholar-search.mjs --offline --query "transformer interpretability"
node dist/bin/scholar-search.mjs --query "retrieval augmented generation" --provider openalex --provider crossref --from 2020-01-01 --to 2025-12-31 --format markdown
node dist/bin/scholar-search.mjs --query "coconut water composition" --provider pubmed --enrich --format json
```

CLI flags: `-q/--query` (repeat up to four), `-p/--provider` (repeat or comma-separate), `--limit 1..30`, `--from`/`--to` (YYYY-MM-DD), `--format json|markdown`, `--offline`, `--enrich` (complete missing abstracts via OpenAlex after ranking), `--user-agent`, `--contact-email`.

## Workflow

1. Decide whether the request is an exact lookup or a broad search.
2. Select one or two providers when the user gives a clear source preference. Use arXiv for preprints and recent work, OpenAlex for broad formal discovery and citations, PubMed for biomedical work, Crossref for DOI or publisher metadata, and Semantic Scholar for paper IDs or citation context.
3. Select Google Scholar only when web-visible coverage or Google Scholar citation discovery is explicitly needed. A SerpApi key is required; it is never enabled by default.
4. Create one to four focused queries and one search request. Use an explicit date range only when the user asks for a publication window.
5. Treat results as evidence for the final answer. Preserve DOI or provider external identity when rendering or saving a paper.
6. Do not infer methods, findings, or dates that the provider did not return. Unknown dates remain unknown.

## HTML Result Delivery

Deliver search results as a self-contained HTML page when the user asks for a visual, shareable, printable, or report-style deliverable, or when presenting multiple papers for comparison. The style and template live in `references/html-result-guide.md`.

- **When**: Use HTML for "网页 / 可视化 / 精美交付 / 报告页 / 保存成文件" requests and for multi-paper comparison pages. Keep markdown or plain text for simple Q&A or when the user needs the verbatim text pasted into chat.
- **How**: Read `references/html-result-guide.md`, copy its embedded self-contained template, then map `SearchResponse.queryPlan` (summary band), `results[]` (one card per paper), and `diagnostics[]` (severity-coded footer section) into the placeholders. Save as a single `.html` file and return its path.
- **Constraints**: The page must be zero-dependency (no CDN, external fonts, or external JS), use CSS variables for all colors, meet WCAG AA contrast, and be responsive (single column on mobile). Preserve each DOI / URL / external id. Do not fabricate missing fields (unknown dates stay unknown); Google Scholar records without a DOI must not get a fake stable identity.

## Enrichment, Translation & Reading Guide

After selecting the valuable papers, complete their missing abstracts and then add translation and a reading guide.

1. **Enrich**: run `--enrich` (or library call `enrich: true`) to complete missing abstracts via OpenAlex after ranking. Enrichment fills `abstract` and backfills missing venue/URL/date/citation metadata; failures are isolated as diagnostics and never discard results.
2. **Translate**: follow `references/translation-guide.md` to intelligently translate each paper's title + abstract into the user's language. Deliverables keep **bilingual content**: titles show Chinese and English simultaneously; abstracts toggle between languages via tabs (default Chinese).
3. **Reading guide**: follow `references/translation-guide.md` to write a short recommendation rationale and reading points per paper, plus an optional overall guide when presenting multiple papers.
4. **Deliver**: when rendering an HTML page, merge the enriched, translated, and guided content into the `references/html-result-guide.md` template.

## Credentials

Only Google Scholar requires a key: set `SERPAPI_API_KEY` when selecting `google_scholar`. Optional credentials are `SEMANTIC_SCHOLAR_API_KEY`, `NCBI_API_KEY`, and `NCBI_TOOL`. The CLI maps these environment variables into the injected runtime; the core itself does not read the environment.

## Host Boundaries

The package does not know about users, permissions, billing, databases, favorites, browser extensions, or CNKI. A host may inject a `PersistenceAdapter` for an explicit save operation, but the core response remains transient and contains no persistence or billing fields.

Google Scholar records without a DOI have temporary result or cluster metadata only. Do not invent a stable identity for them or pass them to identity-based persistence.

Provider failures are isolated per query/provider; successful providers still return results with a warning diagnostic. PubMed, OpenAlex, and other providers may return transient HTTP 429s; retry or inject the relevant API key when that happens.

See `README.md` for full CLI and provider configuration details.