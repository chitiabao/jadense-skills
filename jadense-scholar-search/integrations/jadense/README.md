# Jadense host integration

This directory documents the optional Jadense adapter boundary. It is deliberately free of Jadense imports so the public package remains installable on its own.

The host should map its `searchScholarPapers` tool to `executeSearch` and translate:

- `queries`, `searchProviders`, `limit`, and explicit `dateRange` into `SearchRequest`;
- its request-scoped fetch, User-Agent, contact email, and BYOK SerpApi credential into `SearchRuntimeConfig`;
- `SearchResponse.results` into the existing paper-card hydration path;
- an explicit public-library action into a `PersistenceAdapter` after permission and billing checks;
- private favorites into the existing favorites service, without writing a public paper record first.

Keep CNKI and browser-extension flows outside this adapter. Keep authorization, billing settlement, database writes, and UI compatibility in Jadense. Results with no DOI or trusted external ID must remain transient.
