import { DOMParser } from "@xmldom/xmldom";
import { compactMetadata, normalizeAuthors, normalizeDoi, normalizeExternalId, normalizeText, normalizeUrl } from "../normalize.js";
import { requestText } from "./common.js";
const ARXIV_URL = "https://export.arxiv.org/api/query";
const OFFLINE_RESULTS = {
    "transformer interpretability": [
        { id: "http://arxiv.org/abs/2307.08724v1", title: "A Mathematical Framework for Transformer Circuits", summary: "We present a mathematical framework for understanding transformer circuits.", published: "2023-07-17T17:59:00Z", authors: ["Nelson Elhage", "Tom McGrath"], doi: "10.48550/arXiv.2307.08724", categories: ["cs.LG"] },
        { id: "http://arxiv.org/abs/2501.01234v1", title: "Recent Mechanistic Interpretability Methods for Language Models", summary: "A recent survey of mechanistic interpretability methods for language models.", published: "2025-01-03T12:00:00Z", authors: ["Lin Analyst"], categories: ["cs.AI"] },
    ],
    "latest llm safety": [{ id: "http://arxiv.org/abs/2502.00001v1", title: "Latest Advances in LLM Safety Evaluation", summary: "A preprint describing recent safety evaluation methods for large language models.", published: "2025-02-01T09:00:00Z", authors: ["Ada Researcher"], categories: ["cs.CL"] }],
};
function elements(parent, tagName) {
    const nodes = parent.getElementsByTagName(tagName);
    return Array.from({ length: nodes.length }, (_, index) => nodes.item(index)).filter((node) => Boolean(node));
}
function first(parent, tagName) { const nodes = parent.getElementsByTagName(tagName); return nodes.length ? nodes.item(0) : null; }
function text(node) { return normalizeText(node?.textContent); }
function year(value) { const match = value.match(/^(19|20)\d{2}/); return match ? Number(match[0]) : null; }
function mapEntry(entry, query, index) {
    const rawId = text(first(entry, "id"));
    const externalId = normalizeExternalId("arxiv", rawId);
    const title = text(first(entry, "title"));
    if (!externalId || !title)
        return null;
    const published = text(first(entry, "published"));
    const links = elements(entry, "link");
    const alternate = links.find((link) => link.getAttribute("rel") === "alternate")?.getAttribute("href");
    const pdf = links.find((link) => link.getAttribute("title") === "pdf")?.getAttribute("href");
    return { retrievalProvider: "arxiv", externalSource: "arxiv", externalId, doi: normalizeDoi(text(first(entry, "arxiv:doi"))), title, abstract: text(first(entry, "summary")) || null, authors: normalizeAuthors(elements(entry, "author").map((author) => text(first(author, "name")))), publishedDate: published.slice(0, 10) || null, venue: text(first(entry, "arxiv:journal_ref")) || null, url: normalizeUrl(alternate) ?? normalizeUrl(rawId) ?? `https://arxiv.org/abs/${externalId}`, citationCount: 0, sourceMetadata: compactMetadata({ retrievalProvider: "arxiv", externalSource: "arxiv", arxivId: externalId, query, relevanceScore: Math.max(0.1, 1 - index * 0.03), publicationYear: year(published), pdfUrl: normalizeUrl(pdf) ?? `https://arxiv.org/pdf/${externalId}` }), diagnostics: [] };
}
function mapOffline(value, query, index) {
    const externalId = normalizeExternalId("arxiv", value.id);
    const title = normalizeText(value.title);
    if (!externalId || !title)
        return null;
    const published = normalizeText(value.published);
    return { retrievalProvider: "arxiv", externalSource: "arxiv", externalId, doi: normalizeDoi(value.doi), title, abstract: normalizeText(value.summary) || null, authors: normalizeAuthors(Array.isArray(value.authors) ? value.authors : []), publishedDate: published.slice(0, 10) || null, venue: normalizeText(value.journalRef) || null, url: `https://arxiv.org/abs/${externalId}`, citationCount: 0, sourceMetadata: compactMetadata({ retrievalProvider: "arxiv", externalSource: "arxiv", arxivId: externalId, query, relevanceScore: Math.max(0.1, 1 - index * 0.05), publicationYear: year(published), categories: Array.isArray(value.categories) ? value.categories.map(normalizeText).filter(Boolean) : [] }), diagnostics: [] };
}
export function buildArxivSearchUrl(input) {
    const url = new URL(ARXIV_URL);
    const terms = normalizeText(input.query).split(/\s+/).filter(Boolean).map((term) => `all:${term}`).join(" AND ");
    url.searchParams.set("search_query", input.dateRange ? `(${terms}) AND submittedDate:[${input.dateRange.from.replaceAll("-", "")}0000 TO ${input.dateRange.to.replaceAll("-", "")}2359]` : terms);
    url.searchParams.set("start", "0");
    url.searchParams.set("max_results", String(input.limit));
    url.searchParams.set("sortBy", input.dateRange || /latest|recent|new|最新|近期/i.test(input.query) ? "submittedDate" : "relevance");
    url.searchParams.set("sortOrder", "descending");
    return url.toString();
}
export async function searchArxiv(input) {
    const query = normalizeText(input.query);
    if (!query)
        return [];
    if (input.offline)
        return (OFFLINE_RESULTS[query.toLowerCase()] ?? []).slice(0, input.limit).map((item, index) => mapOffline(item, query, index)).filter((item) => Boolean(item));
    const document = new DOMParser().parseFromString(await requestText(buildArxivSearchUrl(input), input.runtime, "arxiv", { headers: { Accept: "application/atom+xml, application/xml, text/xml" } }), "application/xml");
    return document.documentElement ? elements(document.documentElement, "entry").map((entry, index) => mapEntry(entry, query, index)).filter((item) => Boolean(item)) : [];
}
export const arxivProvider = { id: "arxiv", search: searchArxiv, detail: async ({ candidate, runtime, offline }) => { const id = normalizeExternalId("arxiv", candidate.externalId); return id ? (await searchArxiv({ query: `id:${id}`, limit: 1, runtime, offline }))[0] ?? null : null; } };
//# sourceMappingURL=arxiv.js.map