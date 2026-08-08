import assert from "node:assert/strict"
import test from "node:test"
import { executeSearch } from "../src/search.js"
import { openAlexProvider } from "../src/providers/openalex.js"
import type { PaperCandidate, ProviderAdapter, SearchRuntimeConfig } from "../src/types.js"

const runtime: SearchRuntimeConfig = { userAgent: "test-agent/1.0", contactEmail: "test@example.org" }

function candidate(overrides: Partial<PaperCandidate> = {}): PaperCandidate {
  return { retrievalProvider: "openalex", externalSource: "openalex", externalId: "W1", doi: "10.1234/w1", title: "Paper One", authors: [{ displayName: "Researcher" }], abstract: null, publishedDate: "2024-01-02", venue: "Journal", url: "https://example.org/1", citationCount: 5, sourceMetadata: { query: "q" }, diagnostics: [], ...overrides }
}

test("enrich fills missing abstracts from a provider detail lookup", async () => {
  const adapter: ProviderAdapter = { id: "openalex", search: async () => [candidate()], detail: async () => candidate({ abstract: "Enriched abstract." }) }
  const response = await executeSearch({ queries: ["q"], providers: ["openalex"] }, { runtime, adapters: { openalex: adapter }, enrich: true })
  assert.equal(response.results[0]?.abstract, "Enriched abstract.")
  assert.equal(response.queryPlan.enrichedCount, 1)
})

test("enrich keeps existing abstracts without issuing a detail lookup", async () => {
  const adapter: ProviderAdapter = { id: "openalex", search: async () => [candidate({ abstract: "Already present." })] }
  const response = await executeSearch({ queries: ["q"], providers: ["openalex"] }, { runtime, adapters: { openalex: adapter }, enrich: true })
  assert.equal(response.results[0]?.abstract, "Already present.")
  assert.equal(response.queryPlan.enrichedCount, 0)
  assert.equal(response.diagnostics.length, 0)
})

test("enrich with a provider lacking detail logs info and leaves results unchanged", async () => {
  const adapter: ProviderAdapter = { id: "openalex", search: async () => [candidate()] }
  const response = await executeSearch({ queries: ["q"], providers: ["openalex"] }, { runtime, adapters: { openalex: adapter }, enrich: true })
  assert.equal(response.results[0]?.abstract, null)
  assert.equal(response.queryPlan.enrichedCount, 0)
  assert.ok(response.diagnostics.some((item) => item.stage === "enrich" && item.severity === "info"))
})

test("enrich isolates a failing detail lookup with a warning diagnostic", async () => {
  const bad: ProviderAdapter = { id: "openalex", search: async () => [candidate()], detail: async () => { throw new Error("detail boom") } }
  const good: PaperCandidate = { ...candidate(), externalId: "W2", doi: "10.1234/w2", title: "Paper Two", abstract: "Second abstract." }
  const goodAdapter: ProviderAdapter = { id: "crossref", search: async () => [good] }
  const response = await executeSearch({ queries: ["q"], providers: ["openalex", "crossref"] }, { runtime, adapters: { openalex: bad, crossref: goodAdapter }, enrich: true })
  assert.ok(response.diagnostics.some((item) => item.stage === "enrich" && item.severity === "warning"))
  assert.equal(response.results.length, 2)
  assert.ok(response.results.some((item) => item.title === "Paper Two"))
})

test("offline enrichment completes the interpretability abstract via OpenAlex", async () => {
  const adapter: ProviderAdapter = { id: "openalex", search: async () => [candidate({ externalId: "W4391101111", doi: "10.5555/llm.2024.001", title: "Interpretability in Large Language Models", abstract: null })], detail: openAlexProvider.detail }
  const response = await executeSearch({ queries: ["q"], providers: ["openalex"] }, { runtime, offline: true, adapters: { openalex: adapter }, enrich: true })
  assert.equal(response.results[0]?.abstract, "We study interpretability of large language models.")
  assert.equal(response.queryPlan.enrichedCount, 1)
})