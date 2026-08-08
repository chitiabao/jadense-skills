import { safeErrorMessage } from "./errors.js"
import { getProvider } from "./providers/index.js"
import type { EnrichmentConfig, PaperCandidate, ProviderAdapter, SearchDiagnostic, SearchProviderId, SearchRuntimeConfig } from "./types.js"

export const DEFAULT_ENRICH_PROVIDERS: SearchProviderId[] = ["openalex"]

export function normalizeEnrichConfig(enrich: boolean | EnrichmentConfig | undefined, resultCount: number): EnrichmentConfig | null {
  if (enrich === undefined || enrich === false) return null
  if (enrich === true) return { abstract: true, topN: resultCount, providers: DEFAULT_ENRICH_PROVIDERS }
  const providers = enrich.providers && enrich.providers.length ? [...new Set(enrich.providers)] : DEFAULT_ENRICH_PROVIDERS
  const topN = enrich.topN !== undefined ? Math.max(0, Math.floor(Number(enrich.topN) || 0)) : resultCount
  return { abstract: enrich.abstract !== false, topN: Math.min(topN, resultCount), providers }
}

type EnrichResultsOptions = { runtime: SearchRuntimeConfig; offline?: boolean; adapters?: Partial<Record<SearchProviderId, ProviderAdapter>> }

function isMissing(value: unknown): boolean { return value === null || value === undefined }
function isMissingAuthors(authors: PaperCandidate["authors"]): boolean { return authors.length === 0 }

function mergeDetail(candidate: PaperCandidate, detail: PaperCandidate): PaperCandidate {
  return {
    ...candidate,
    abstract: detail.abstract ?? candidate.abstract,
    venue: isMissing(detail.venue) ? candidate.venue : detail.venue,
    url: isMissing(detail.url) ? candidate.url : detail.url,
    publishedDate: isMissing(detail.publishedDate) ? candidate.publishedDate : detail.publishedDate,
    citationCount: isMissing(detail.citationCount) ? candidate.citationCount : detail.citationCount,
    authors: isMissingAuthors(detail.authors) ? candidate.authors : detail.authors,
  }
}

function wasEnriched(candidate: PaperCandidate, merged: PaperCandidate, fillAbstract: boolean): boolean {
  if (fillAbstract && !candidate.abstract && merged.abstract) return true
  if (candidate.venue === null && merged.venue !== null) return true
  if (candidate.url === null && merged.url !== null) return true
  if (candidate.publishedDate === null && merged.publishedDate !== null) return true
  if (candidate.citationCount === null && merged.citationCount !== null) return true
  if (isMissingAuthors(candidate.authors) && !isMissingAuthors(merged.authors)) return true
  return false
}

export async function enrichResults(results: PaperCandidate[], config: EnrichmentConfig, options: EnrichResultsOptions): Promise<{ results: PaperCandidate[]; enrichedCount: number; diagnostics: SearchDiagnostic[] }> {
  const target = config.topN ? results.slice(0, config.topN) : results
  const providers = config.providers ?? DEFAULT_ENRICH_PROVIDERS
  const fillAbstract = config.abstract !== false
  const diagnostics: SearchDiagnostic[] = []
  let enrichedCount = 0

  const enriched = await Promise.all(target.map(async (candidate) => {
    if (fillAbstract && candidate.abstract) return candidate
    for (const provider of providers) {
      const adapter = options.adapters?.[provider] ?? getProvider(provider)
      const detail = adapter.detail
      if (!detail) {
        diagnostics.push({ severity: "info", stage: "enrich", provider, message: `${provider} has no detail lookup; abstract left unchanged.` })
        continue
      }
      try {
        const detailed = await detail({ candidate, runtime: options.runtime, offline: options.offline })
        if (!detailed) continue
        const merged = mergeDetail(candidate, detailed)
        if (wasEnriched(candidate, merged, fillAbstract)) enrichedCount += 1
        return merged
      } catch (error) {
        diagnostics.push({ severity: "warning", stage: "enrich", provider, message: safeErrorMessage(error) })
      }
    }
    return candidate
  }))

  return { results: config.topN ? [...enriched, ...results.slice(config.topN)] : enriched, enrichedCount, diagnostics }
}