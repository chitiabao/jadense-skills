import { compactMetadata, datePartsToIsoDate, normalizeAuthors, normalizeDoi, normalizeExternalId, normalizeText, normalizeUrl, toFiniteNumber, toIntegerOrNull } from "../normalize.js"
import type { PaperCandidate, ProviderAdapter, ProviderSearchInput } from "../types.js"
import { record, requestJson } from "./common.js"

const CROSSREF_URL = "https://api.crossref.org"
const OFFLINE_WORK: Record<string, unknown> = { DOI: "10.48550/arXiv.2307.08724", title: ["A Mathematical Framework for Transformer Circuits"], "container-title": ["arXiv"], issued: { "date-parts": [[2023, 7, 17]] }, type: "posted-content", URL: "https://doi.org/10.48550/arXiv.2307.08724", author: [{ given: "Nelson", family: "Elhage" }], "is-referenced-by-count": 100 }

function firstString(value: unknown): string | null {
  if (Array.isArray(value)) return value.map(normalizeText).find(Boolean) ?? null
  return normalizeText(value) || null
}

function mapMessage(message: Record<string, unknown>, query: string, score?: number): PaperCandidate | null {
  const doi = normalizeDoi(message.DOI)
  const title = firstString(message.title)
  if (!doi || !title) return null
  const publishedDate = datePartsToIsoDate(message.issued) ?? datePartsToIsoDate(message.published) ?? datePartsToIsoDate(message["published-print"]) ?? datePartsToIsoDate(message["published-online"])
  return {
    retrievalProvider: "crossref",
    externalSource: "crossref",
    externalId: normalizeExternalId("crossref", doi),
    doi,
    title,
    authors: normalizeAuthors(Array.isArray(message.author) ? message.author.map((author) => { const item = record(author); return [normalizeText(item?.given), normalizeText(item?.family)].filter(Boolean).join(" ") || normalizeText(item?.name) }) : []),
    abstract: normalizeText(message.abstract) || null,
    publishedDate,
    venue: firstString(message["container-title"]) ?? firstString(message["short-container-title"]),
    url: normalizeUrl(message.URL) ?? `https://doi.org/${doi}`,
    citationCount: Math.max(0, toFiniteNumber(message["is-referenced-by-count"], 0)),
    sourceMetadata: compactMetadata({ retrievalProvider: "crossref", externalSource: "crossref", doi, query, relevanceScore: score ?? toFiniteNumber(message.score, 0), publicationYear: toIntegerOrNull(publishedDate?.slice(0, 4)), type: normalizeText(message.type) || null, publisher: normalizeText(message.publisher) || null }),
    diagnostics: [],
  }
}

function crossrefUrl(input: ProviderSearchInput, doi?: string): URL {
  const url = new URL(doi ? `/works/${encodeURIComponent(doi)}` : "/works", CROSSREF_URL)
  if (!doi) {
    url.searchParams.set("rows", String(input.limit))
    url.searchParams.set("query.bibliographic", normalizeText(input.query))
    if (input.dateRange) url.searchParams.set("filter", `from-pub-date:${input.dateRange.from},until-pub-date:${input.dateRange.to}`)
  }
  if (input.runtime.contactEmail) url.searchParams.set("mailto", input.runtime.contactEmail)
  return url
}

export function buildCrossrefSearchUrl(input: ProviderSearchInput): string {
  return crossrefUrl(input).toString()
}

export async function searchCrossref(input: ProviderSearchInput): Promise<PaperCandidate[]> {
  const query = normalizeText(input.query)
  if (!query) return []
  const doi = normalizeDoi(query)
  if (input.offline) return (doi || query.toLowerCase() === "a mathematical framework for transformer circuits" ? [OFFLINE_WORK] : []).slice(0, input.limit).map((item) => mapMessage(item, query, 1)).filter((item): item is PaperCandidate => Boolean(item))
  const payload = record(await requestJson(crossrefUrl(input, doi ?? undefined).toString(), input.runtime, "crossref"))
  const items = record(payload?.message)?.items
  const messages: unknown[] = doi ? [record(payload?.message)] : (Array.isArray(items) ? items : [])
  return messages.map((item, index) => mapMessage(record(item) ?? {}, query, doi ? 1 : Math.max(0.1, 1 - index * 0.03))).filter((item): item is PaperCandidate => Boolean(item))
}

export const crossrefProvider: ProviderAdapter = {
  id: "crossref",
  search: searchCrossref,
  detail: async ({ candidate, runtime, offline }) => {
    const doi = normalizeDoi(candidate.doi ?? candidate.externalId)
    if (!doi) return null
    const results = await searchCrossref({ query: doi, limit: 1, runtime, offline })
    return results[0] ?? null
  },
}
