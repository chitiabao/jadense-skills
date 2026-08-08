import assert from "node:assert/strict"
import test from "node:test"
import { executeSearch } from "../src/search.js"
import { MissingCredentialError } from "../src/errors.js"
import type { PaperCandidate, ProviderAdapter, SearchRuntimeConfig } from "../src/types.js"

const runtime: SearchRuntimeConfig = { userAgent: "test-agent/1.0", contactEmail: "test@example.org" }

test("offline mode returns fixture candidates for all six providers", async () => {
  const cases: Array<["arxiv" | "openalex" | "crossref" | "pubmed" | "semantic_scholar" | "google_scholar", string, number]> = [
    ["arxiv", "transformer interpretability", 2],
    ["openalex", "transformer interpretability", 3],
    ["crossref", "A Mathematical Framework for Transformer Circuits", 1],
    ["pubmed", "biomedical rag pubmed", 2],
    ["semantic_scholar", "transformer interpretability", 1],
    ["google_scholar", "anything", 0],
  ]
  for (const [provider, query, count] of cases) {
    const response = await executeSearch({ queries: [query], providers: [provider] }, { runtime, offline: true })
    assert.equal(response.results.length, count, provider)
    assert.equal(response.queryPlan.providers[0], provider)
  }
})

test("date filtering rejects unknown dates instead of manufacturing a date", async () => {
  const response = await executeSearch({ queries: ["transformer interpretability"], providers: ["openalex"], dateRange: { from: "2020-01-01", to: "2024-12-31" } }, { runtime, offline: true })
  assert.equal(response.results.length, 1)
  assert.equal(response.results[0].publishedDate, "2024-04-15")
  assert.equal(response.queryPlan.dateRejectedCandidateCount, 2)
})

test("duplicate providers are normalized and candidates sharing a DOI are merged", async () => {
  const candidate = (provider: "openalex" | "crossref", title: string, abstract: string | null): PaperCandidate => ({ retrievalProvider: provider, externalSource: provider, externalId: provider === "openalex" ? "W1" : "10.1234/example", doi: "10.1234/example", title, authors: [{ displayName: "Researcher" }], abstract, publishedDate: "2024-01-02", venue: "Journal", url: "https://example.org/paper", citationCount: provider === "openalex" ? 10 : 2, sourceMetadata: { query: "same", relevanceScore: 0.8 }, diagnostics: [] })
  const adapters: Record<"openalex" | "crossref", ProviderAdapter> = {
    openalex: { id: "openalex", search: async () => [candidate("openalex", "Same Paper", "complete abstract")] },
    crossref: { id: "crossref", search: async () => [candidate("crossref", "Same Paper", null)] },
  }
  const response = await executeSearch({ queries: ["same"], providers: ["openalex", "openalex", "crossref"] }, { runtime, adapters })
  assert.equal(response.queryPlan.providers.length, 2)
  assert.equal(response.results.length, 1)
  assert.deepEqual(response.results[0].sourceMetadata.retrievalProviders, ["openalex", "crossref"])
  assert.equal(response.results[0].abstract, "complete abstract")
})

test("one provider failure does not discard successful providers", async () => {
  const good: PaperCandidate = { retrievalProvider: "openalex", externalSource: "openalex", externalId: "W2", doi: null, title: "Available Paper", authors: [], abstract: null, publishedDate: null, venue: null, url: null, citationCount: null, sourceMetadata: { query: "query", relevanceScore: 1 }, diagnostics: [] }
  const adapters: Partial<Record<"openalex" | "crossref", ProviderAdapter>> = {
    openalex: { id: "openalex", search: async () => [good] },
    crossref: { id: "crossref", search: async () => { throw new Error("secret request URL should not escape") } },
  }
  const response = await executeSearch({ queries: ["query"], providers: ["openalex", "crossref"] }, { runtime, adapters })
  assert.equal(response.results.length, 1)
  assert.equal(response.diagnostics[0]?.message, "Provider request failed.")
  assert.equal(response.queryPlan.queryStatuses.find((item) => item.provider === "crossref")?.status, "error")
})

test("Google Scholar requires an injected key outside offline mode", async () => {
  await assert.rejects(() => executeSearch({ queries: ["google scholar query"], providers: ["google_scholar"] }, { runtime }), MissingCredentialError)
})

test("optional persistence is host-owned and absent from the response contract", async () => {
  let saved: PaperCandidate[] | null = null
  const adapter: ProviderAdapter = { id: "openalex", search: async () => [{ retrievalProvider: "openalex", externalSource: "openalex", externalId: "W3", doi: null, title: "Transient", authors: [], abstract: null, publishedDate: null, venue: null, url: null, citationCount: null, sourceMetadata: {}, diagnostics: [] }] }
  const response = await executeSearch({ queries: ["transient"], providers: ["openalex"] }, { runtime, adapters: { openalex: adapter }, persistence: { save: async (items) => { saved = items } } })
  assert.equal(saved?.length, 1)
  assert.equal("persisted" in response, false)
})
