# Security Policy

## Reporting

Report suspected credential exposure or a security issue privately to the project maintainers. Do not open a public issue containing API keys, cookies, authorization headers, or provider response URLs with query credentials.

## Secret handling

- Provider credentials are injected through `SearchRuntimeConfig` and are never part of `SearchResponse`.
- The CLI reads `SERPAPI_API_KEY`, `SEMANTIC_SCHOLAR_API_KEY`, and `NCBI_API_KEY` only to construct the runtime.
- Diagnostics use stable provider messages and do not include request URLs, raw queries for Google Scholar, authorization headers, or key values.
- Do not add secret-bearing URLs to logs, fixtures, snapshots, or persisted records.

## Third-party APIs

Respect each provider's terms, rate limits, robots policies, and attribution requirements. Keep live tests disabled by default and use small, explicit fixtures for parser tests.
