import { compactMetadata, normalizeAuthors, normalizeDoi, normalizeExternalId, normalizeText, normalizeUrl, toFiniteNumber, toIntegerOrNull, toJsonValue } from "../normalize.js"
import { record, requestJson } from "./common.js"
import type { PaperCandidate, PaperReference, ProviderAdapter, ProviderSearchInput } from "../types.js"

const SEMANTIC_URL = "https://api.semanticscholar.org/graph/v1"
const PAPER_FIELDS = ["paperId", "externalIds", "url", "title", "abstract", "venue", "year", "publicationDate", "citationCount", "authors.name"].join(",")
const OFFLINE_PAPER: Record<string, unknown> = { paperId: "ss-transformer-circuits", externalIds: { DOI: "10.48550/arxiv.2307.08724", ArXiv: "2307.08724" }, title: "A Mathematical Framework for Transformer Circuits", abstract: "Transformer circuit analysis paper.", venue: "arXiv", year: 2023, publicationDate: "2023-07-17", citationCount: 120, url: "https://www.semanticscholar.org/paper/ss-transformer-circuits", authors: [{ name: "Nelson Elhage" }, { name: "Tom McGrath" }] }

function fetchInput(input: ProviderSearchInput) {
  return { query: input.query, limit: input.limit, runtime: input.runtime, offline: input.offline }
}
async function request(url: URL, input: ProviderSearchInput) {
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": input.runtime.userAgent }
  const key = input.runtime.credentials?.semanticScholarApiKey
  if (key) headers["x-api-key"] = key
  return requestJson(url.toString(), input.runtime, "semantic_scholar", { headers })
}
function mapPaper(paper: Record<string, unknown>, query: string, index: number): PaperCandidate | null {
  const externalId = normalizeExternalId("semantic_scholar", paper.paperId); const title = normalizeText(paper.title); if (!externalId || !title) return null
  const ids = record(paper.externalIds); const year = toIntegerOrNull(paper.year)
  return { retrievalProvider: "semantic_scholar", externalSource: "semantic_scholar", externalId, doi: normalizeDoi(ids?.DOI) ?? normalizeDoi(ids?.doi), title, abstract: normalizeText(paper.abstract) || null, authors: normalizeAuthors(Array.isArray(paper.authors) ? paper.authors.map((author) => normalizeText(record(author)?.name)) : []), publishedDate: normalizeText(paper.publicationDate) || null, venue: normalizeText(paper.venue) || null, url: normalizeUrl(paper.url) ?? `https://www.semanticscholar.org/paper/${externalId}`, citationCount: Math.max(0, toFiniteNumber(paper.citationCount, 0)), sourceMetadata: compactMetadata({ retrievalProvider: "semantic_scholar", externalSource: "semantic_scholar", paperId: externalId, query, relevanceScore: Math.max(0.1, 1 - index * 0.03), publicationYear: year, arxivId: normalizeText(ids?.ArXiv) || null, pubmedId: normalizeText(ids?.PubMed) || null, externalIds: toJsonValue(ids ?? {}) }), diagnostics: [] }
}

export function buildSemanticScholarSearchUrl(input: ProviderSearchInput): string {
  const url = new URL("/paper/search", SEMANTIC_URL); url.searchParams.set("query", input.query); url.searchParams.set("limit", String(input.limit)); url.searchParams.set("fields", PAPER_FIELDS); if (input.dateRange) url.searchParams.set("publicationDateOrYear", `${input.dateRange.from}:${input.dateRange.to}`); return url.toString()
}
export async function searchSemanticScholar(input: ProviderSearchInput): Promise<PaperCandidate[]> {
  const query = normalizeText(input.query); if (!query) return []
  if (input.offline) return query.toLowerCase() === "transformer interpretability" ? [mapPaper(OFFLINE_PAPER, query, 0)].filter((item): item is PaperCandidate => Boolean(item)) : []
  const payload = record(await request(new URL(buildSemanticScholarSearchUrl(input)), input)); return (Array.isArray(payload?.data) ? payload.data : []).map((item, index) => mapPaper(record(item) ?? {}, query, index)).filter((item): item is PaperCandidate => Boolean(item))
}
function lookup(candidate: PaperCandidate) { if (candidate.externalSource === "semantic_scholar" && candidate.externalId) return candidate.externalId; if (candidate.doi) return `DOI:${candidate.doi}`; if (candidate.externalSource === "arxiv" && candidate.externalId) return `ARXIV:${candidate.externalId}`; if (candidate.externalSource === "pubmed" && candidate.externalId) return `PMID:${candidate.externalId}`; return null }

export const semanticScholarProvider: ProviderAdapter = {
  id: "semantic_scholar",
  search: searchSemanticScholar,
  detail: async ({ candidate, runtime, offline }) => { const id = lookup(candidate); if (!id) return null; if (offline) return id === "ss-transformer-circuits" || candidate.doi?.includes("2307.08724") ? mapPaper(OFFLINE_PAPER, id, 0) : null; const input = fetchInput({ query: id, limit: 1, runtime, offline }); const url = new URL(`/paper/${encodeURIComponent(id)}`, SEMANTIC_URL); url.searchParams.set("fields", PAPER_FIELDS); const paper = record(await request(url, input)); return paper ? mapPaper(paper, id, 0) : null },
  references: async ({ candidate, runtime, offline }) => {
    const id = lookup(candidate); if (!id) return null; if (offline) return []
    const input = fetchInput({ query: id, limit: 1, runtime, offline }); const url = new URL(`/paper/${encodeURIComponent(id)}`, SEMANTIC_URL); url.searchParams.set("fields", "references.paperId,references.externalIds,references.url,references.title,references.venue,references.year,references.publicationDate,references.citationCount,references.authors.name")
    const payload = record(await request(url, input)); return (Array.isArray(payload?.references) ? payload.references : []).map((item): PaperReference | null => { const paper = record(item); const title = normalizeText(paper?.title); if (!title) return null; const ids = record(paper?.externalIds); const doi = normalizeDoi(ids?.DOI); const externalId = normalizeExternalId("semantic_scholar", paper?.paperId); return { identity: { doi, externalSource: "semantic_scholar", externalId }, title, authors: normalizeAuthors(Array.isArray(paper?.authors) ? paper.authors.map((author) => normalizeText(record(author)?.name)) : []), publishedDate: normalizeText(paper?.publicationDate) || null, venue: normalizeText(paper?.venue) || null, doi, url: normalizeUrl(paper?.url), citationCount: Math.max(0, toFiniteNumber(paper?.citationCount, 0)), source: "semantic_scholar" } }).filter((item): item is PaperReference => Boolean(item))
  },
}
