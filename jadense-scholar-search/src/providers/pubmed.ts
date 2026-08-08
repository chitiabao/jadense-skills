import { DOMParser, type Element as XmlElement, type Node as XmlNode } from "@xmldom/xmldom"
import { compactMetadata, normalizeAuthors, normalizeDoi, normalizeExternalId, normalizeText, toIntegerOrNull } from "../normalize.js"
import type { PaperCandidate, PaperReference, ProviderAdapter, ProviderSearchInput } from "../types.js"
import { record, requestJson, requestText } from "./common.js"

const NCBI_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
const OFFLINE_SUMMARIES: Record<string, Array<Record<string, unknown>>> = { "biomedical rag pubmed": [{ uid: "39000001", title: "Retrieval-Augmented Generation for Biomedical Question Answering", fulljournalname: "Journal of Biomedical Informatics", pubdate: "2024 Jan", sortpubdate: "2024/01/15 00:00", articleids: [{ idtype: "pubmed", value: "39000001" }, { idtype: "doi", value: "10.5555/biomed.rag.2024.001" }], authors: [{ name: "Ada Clinician" }, { name: "Lin Bioinformatician" }] }, { uid: "39000002", title: "PubMed-Scale Evidence Retrieval for Clinical Language Models", fulljournalname: "NPJ Digital Medicine", pubdate: "2025 Feb", sortpubdate: "2025/02/20 00:00", articleids: [{ idtype: "pubmed", value: "39000002" }], authors: [{ name: "Rui Researcher" }] }] }

function ncbiUrl(path: string, input: ProviderSearchInput, params: Record<string, string>) {
  const url = new URL(`${NCBI_URL}/${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  url.searchParams.set("tool", input.runtime.credentials?.ncbiTool ?? "scholar-search")
  if (input.runtime.contactEmail) url.searchParams.set("email", input.runtime.contactEmail)
  if (input.runtime.credentials?.ncbiApiKey) url.searchParams.set("api_key", input.runtime.credentials.ncbiApiKey)
  return url
}
function articleId(summary: Record<string, unknown>, type: string) { const ids = Array.isArray(summary.articleids) ? summary.articleids : []; const match = ids.find((item) => normalizeText(record(item)?.idtype).toLowerCase() === type); return normalizeText(record(match)?.value) || null }
function date(summary: Record<string, unknown>) { const value = normalizeText(summary.sortpubdate).match(/\d{4}\/\d{2}\/\d{2}/)?.[0]; return value?.replaceAll("/", "-") ?? null }

function mapSummary(summary: Record<string, unknown>, query: string, index: number): PaperCandidate | null {
  const externalId = normalizeExternalId("pubmed", summary.uid) ?? articleId(summary, "pubmed")
  const title = normalizeText(summary.title); if (!externalId || !title) return null
  const pubdate = normalizeText(summary.pubdate)
  return { retrievalProvider: "pubmed", externalSource: "pubmed", externalId, doi: normalizeDoi(articleId(summary, "doi")), title, authors: normalizeAuthors(Array.isArray(summary.authors) ? summary.authors.map((author) => normalizeText(record(author)?.name)) : []), abstract: normalizeText(summary.abstract) || null, publishedDate: date(summary), venue: normalizeText(summary.fulljournalname) || normalizeText(summary.source) || null, url: `https://pubmed.ncbi.nlm.nih.gov/${externalId}/`, citationCount: null, sourceMetadata: compactMetadata({ retrievalProvider: "pubmed", externalSource: "pubmed", pmid: externalId, query, relevanceScore: Math.max(0.1, 1 - index * 0.03), publicationYear: toIntegerOrNull(pubdate.match(/\d{4}/)?.[0] ?? null), pubdate }), diagnostics: [] }
}

async function summaries(ids: string[], input: ProviderSearchInput) {
  if (!ids.length) return []
  const payload = record(await requestJson(ncbiUrl("esummary.fcgi", input, { db: "pubmed", retmode: "json", id: ids.join(",") }).toString(), input.runtime, "pubmed"))
  const result = record(payload?.result)
  return result ? ids.map((id) => record(result[id])).filter((item): item is Record<string, unknown> => Boolean(item)) : []
}

export function buildPubmedSearchUrl(input: ProviderSearchInput): string {
  const params: Record<string, string> = { db: "pubmed", retmode: "json", term: input.query, retmax: String(input.limit), sort: input.dateRange ? "pub_date" : "relevance" }
  if (input.dateRange) Object.assign(params, { datetype: "pdat", mindate: input.dateRange.from.replaceAll("-", "/"), maxdate: input.dateRange.to.replaceAll("-", "/") })
  return ncbiUrl("esearch.fcgi", input, params).toString()
}

export async function searchPubmed(input: ProviderSearchInput): Promise<PaperCandidate[]> {
  const query = normalizeText(input.query); if (!query) return []
  if (input.offline) return (OFFLINE_SUMMARIES[query.toLowerCase()] ?? []).slice(0, input.limit).map((item, index) => mapSummary(item, query, index)).filter((item): item is PaperCandidate => Boolean(item))
  const payload = record(await requestJson(buildPubmedSearchUrl({ ...input, query }), input.runtime, "pubmed"))
  const idList = record(payload?.esearchresult)?.idlist
  const ids = (Array.isArray(idList) ? idList : []).map((id) => normalizeText(id)).filter(Boolean)
  return (await summaries(ids, input)).map((item, index) => mapSummary(item, query, index)).filter((item): item is PaperCandidate => Boolean(item))
}

function xmlText(node: XmlNode | null) { return normalizeText(node?.textContent) || null }
function firstXml(parent: XmlNode, tag: string) { const nodes = (parent as XmlElement).getElementsByTagName(tag); return nodes.length ? nodes.item(0) : null }
function parseXml(xml: string): { abstract: string | null; references: PaperReference[] } {
  const document = new DOMParser().parseFromString(xml, "application/xml")
  const article = firstXml(document, "PubmedArticle"); if (!article) return { abstract: null, references: [] }
  const abstractNode = firstXml(article, "Abstract")
  const abstract = Array.from({ length: abstractNode?.childNodes.length ?? 0 }, (_, index) => xmlText(abstractNode?.childNodes.item(index) ?? null)).filter(Boolean).join(" ") || null
  const references: PaperReference[] = []
  const list = firstXml(article, "ReferenceList")
  for (let index = 0; index < (list?.childNodes.length ?? 0); index += 1) { const node = list?.childNodes.item(index); if (!node || (node as XmlElement).tagName !== "Reference") continue; const title = xmlText(firstXml(node, "Citation")); if (title) references.push({ title, authors: [], publishedDate: null, venue: null, doi: null, url: null, source: "pubmed" }) }
  return { abstract, references }
}

export const pubmedProvider: ProviderAdapter = {
  id: "pubmed",
  search: searchPubmed,
  detail: async ({ candidate, runtime, offline }) => {
    const id = normalizeExternalId("pubmed", candidate.externalId); if (!id) return null
    const found = offline ? Object.values(OFFLINE_SUMMARIES).flat().filter((item) => normalizeExternalId("pubmed", item.uid) === id) : await summaries([id], { query: id, limit: 1, runtime, offline })
    const mapped = found[0] ? mapSummary(found[0], id, 0) : null; if (!mapped || offline) return mapped
    const xml = await requestText(ncbiUrl("efetch.fcgi", { query: id, limit: 1, runtime }, { db: "pubmed", id, retmode: "xml" }).toString(), runtime, "pubmed", { headers: { Accept: "application/xml" } })
    return { ...mapped, abstract: parseXml(xml).abstract }
  },
  references: async ({ candidate, runtime, offline }) => { const id = normalizeExternalId("pubmed", candidate.externalId); if (!id || offline) return offline ? [] : null; const xml = await requestText(ncbiUrl("efetch.fcgi", { query: id, limit: 1, runtime }, { db: "pubmed", id, retmode: "xml" }).toString(), runtime, "pubmed", { headers: { Accept: "application/xml" } }); return parseXml(xml).references },
}
