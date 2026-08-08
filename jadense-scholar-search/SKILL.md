---
name: jadense-scholar-search
description: Search scholarly literature across arXiv, OpenAlex, Crossref, PubMed, Semantic Scholar, and optional Google Scholar through a provider-neutral search core. Use when an agent needs paper discovery, comparison, date-bounded retrieval, or a traceable literature shortlist.
license: MIT
---

# Jadense Scholar Search

Use the host's search capability backed by this package for transient scholarly retrieval. The core returns normalized paper candidates, query planning, provider diagnostics, stable identities, and source metadata.

## Workflow

1. Decide whether the request is an exact lookup or a broad search.
2. Select one or two providers when the user gives a clear source preference. Use arXiv for preprints and recent work, OpenAlex for broad formal discovery and citations, PubMed for biomedical work, Crossref for DOI or publisher metadata, and Semantic Scholar for paper IDs or citation context.
3. Select Google Scholar only when web-visible coverage or Google Scholar citation discovery is explicitly needed. The host must inject a SerpApi key; it is never enabled by default.
4. Create one to four focused queries and one search request. Use an explicit date range only when the user asks for a publication window.
5. Treat results as evidence for the final answer. Preserve DOI or provider external identity when rendering or saving a paper.
6. Do not infer methods, findings, or dates that the provider did not return. Unknown dates remain unknown.

## Host Boundaries

The package does not know about users, permissions, billing, databases, favorites, browser extensions, or CNKI. A host may inject a `PersistenceAdapter` for an explicit save operation, but the core response remains transient and contains no persistence or billing fields.

Google Scholar records without a DOI have temporary result or cluster metadata only. Do not invent a stable identity for them or pass them to identity-based persistence.

See `README.md` for CLI and provider configuration details.
