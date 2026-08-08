# jadense-scholar-search

An independent TypeScript/Node ESM scholarly search core and CLI. It normalizes results from arXiv, OpenAlex, Crossref, PubMed, Semantic Scholar, and optional SerpApi-backed Google Scholar into one transient response.

## Quick start

```sh
npm install
npm run build
node dist/bin/scholar-search.mjs --offline --query "transformer interpretability"
```

The offline command uses bundled fixtures and never calls a third-party API. For a live search, omit `--offline` and inject a descriptive `SCHOLAR_SEARCH_USER_AGENT`. `SCHOLAR_SEARCH_CONTACT_EMAIL` is sent only as provider contact metadata.

```sh
node dist/bin/scholar-search.mjs --query "retrieval augmented generation" --provider openalex --provider crossref --from 2020-01-01 --to 2025-12-31 --format markdown
```

## Credentials

Only Google Scholar requires a key: set `SERPAPI_API_KEY` when selecting `google_scholar`. Optional credentials are `SEMANTIC_SCHOLAR_API_KEY` and `NCBI_API_KEY`. The CLI maps these environment variables into the injected runtime; the core itself does not read the environment.

## Library API

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
```

The response contains `results`, `queryPlan`, and redacted `diagnostics`. It intentionally has no database, billing, execution, or persisted-result contract. Use the exported `PersistenceAdapter` only when the host owns an explicit save action. Candidates with `publishedDate: null` must remain unknown at the persistence boundary.

## Provider notes

- Google Scholar is BYOK through SerpApi, is never inferred without an explicit Google Scholar intent, and paginates in ten-result pages.
- Search failures are isolated per query/provider; successful providers still return results with a warning diagnostic.
- DOI and trusted external IDs are used for deduplication. Google Scholar results without a DOI remain temporary and use only source metadata for display deduplication.
- CI and tests use fixtures. Live smoke tests must be opt-in.

## Development

```sh
npm run check
npm run cli -- --offline --query "transformer interpretability"
```

See `SECURITY.md` before adding a provider or logging request diagnostics.
