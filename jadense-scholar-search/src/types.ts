export const SEARCH_PROVIDER_IDS = [
  "arxiv",
  "openalex",
  "crossref",
  "pubmed",
  "semantic_scholar",
  "google_scholar",
] as const

export type SearchProviderId = (typeof SEARCH_PROVIDER_IDS)[number]

export type DateRange = {
  from: string
  to: string
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined }

export type PaperAuthor = {
  displayName: string
  orcid?: string | null
  affiliation?: string | null
}

export type SearchDiagnostic = {
  severity: "info" | "warning" | "error"
  stage: string
  message: string
  provider?: SearchProviderId
  query?: string | null
  externalId?: string | null
}

export type PaperCandidate = {
  retrievalProvider: SearchProviderId
  externalSource: SearchProviderId
  externalId: string | null
  doi: string | null
  title: string
  authors: PaperAuthor[]
  abstract: string | null
  publishedDate: string | null
  venue: string | null
  url: string | null
  citationCount: number | null
  sourceMetadata: Record<string, JsonValue>
  diagnostics: SearchDiagnostic[]
}

export type PaperIdentity = {
  doi?: string | null
  externalSource?: SearchProviderId | null
  externalId?: string | null
}

export type PaperReference = {
  identity?: PaperIdentity
  title: string
  authors: PaperAuthor[]
  publishedDate: string | null
  venue: string | null
  doi: string | null
  url: string | null
  citationCount?: number | null
  source: SearchProviderId
}

export type ProviderCredentials = {
  serpApiKey?: string
  semanticScholarApiKey?: string
  ncbiApiKey?: string
  ncbiTool?: string
}

export type SearchRuntimeConfig = {
  fetch?: typeof fetch
  userAgent: string
  contactEmail?: string
  credentials?: ProviderCredentials
}

export type ProviderSearchInput = {
  query: string
  limit: number
  dateRange?: DateRange
  runtime: SearchRuntimeConfig
  offline?: boolean
}

export type ProviderDetailInput = {
  candidate: PaperCandidate
  runtime: SearchRuntimeConfig
  offline?: boolean
}

export type ProviderAdapter = {
  id: SearchProviderId
  search(input: ProviderSearchInput): Promise<PaperCandidate[]>
  detail?: (input: ProviderDetailInput) => Promise<PaperCandidate | null>
  references?: (input: ProviderDetailInput) => Promise<PaperReference[] | null>
}

export type SearchRequest = {
  queries: string[]
  providers?: SearchProviderId[]
  limit?: number
  dateRange?: DateRange
}

export type QueryStatus = {
  query: string
  provider: SearchProviderId
  status: "success" | "error"
  hitCount: number
  dateFilteredCount?: number
  error?: string
}

export type SearchQueryPlan = {
  queries: string[]
  providers: SearchProviderId[]
  limit: number
  dateRange: DateRange | null
  offline: boolean
  totalHitCount: number
  dateRejectedCandidateCount: number
  mergedCandidateCount: number
  queryStatuses: QueryStatus[]
}

export type SearchResponse = {
  results: PaperCandidate[]
  queryPlan: SearchQueryPlan
  diagnostics: SearchDiagnostic[]
}

export type PersistenceAdapter = {
  save(candidates: PaperCandidate[]): Promise<void>
}
