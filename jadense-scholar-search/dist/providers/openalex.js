import { compactMetadata, normalizeAuthors, normalizeDoi, normalizeExternalId, normalizeText, normalizeUrl, toFiniteNumber, toIntegerOrNull } from "../normalize.js";
import { record, requestJson } from "./common.js";
const OPENALEX_URL = "https://api.openalex.org";
const OFFLINE_WORKS = {
    circuits: { id: "https://openalex.org/W4317823110", display_name: "A Mathematical Framework for Transformer Circuits", publication_year: 2023, publication_date: null, cited_by_count: 2400, primary_location: { source: { display_name: "arXiv" } }, authorships: [{ author: { display_name: "Nelson Elhage" } }, { author: { display_name: "Tom McGrath" } }] },
    attention: { id: "https://openalex.org/W2741809807", doi: "https://doi.org/10.48550/arXiv.1706.03762", display_name: "Attention Is All You Need", publication_year: 2017, publication_date: "2017-06-12", cited_by_count: 150000, primary_location: { landing_page_url: "https://arxiv.org/abs/1706.03762", source: { display_name: "NeurIPS" } }, authorships: [{ author: { display_name: "Ashish Vaswani" } }, { author: { display_name: "Noam Shazeer" } }] },
    interpretability: { id: "https://openalex.org/W4391101111", doi: "https://doi.org/10.5555/llm.2024.001", display_name: "Interpretability in Large Language Models", publication_year: 2024, publication_date: "2024-04-15", cited_by_count: 120, primary_location: { landing_page_url: "https://example.org/llm-interpretability", source: { display_name: "Transactions on Machine Learning Research" } }, authorships: [{ author: { display_name: "Ada Researcher" } }] },
};
const OFFLINE_QUERY = { "transformer interpretability": [{ work: OFFLINE_WORKS.circuits, score: 0.95 }, { work: OFFLINE_WORKS.interpretability, score: 0.82 }, { work: OFFLINE_WORKS.attention, score: 0.62 }], "attention is all you need": [{ work: OFFLINE_WORKS.attention, score: 1 }] };
function mapAuthors(value) { return Array.isArray(value) ? normalizeAuthors(value.map((item) => normalizeText(record(record(item)?.author)?.display_name))) : []; }
function abstract(value) {
    const inverted = record(value);
    if (!inverted)
        return null;
    const positions = Object.entries(inverted).flatMap(([word, values]) => Array.isArray(values) ? values.map((position) => ({ word, position: Number(position) })) : []);
    const max = positions.reduce((current, item) => Number.isFinite(item.position) ? Math.max(current, item.position) : current, -1);
    if (max < 0)
        return null;
    const words = Array.from({ length: max + 1 }, () => "");
    positions.forEach(({ word, position }) => { if (Number.isInteger(position) && position >= 0)
        words[position] = word; });
    return words.filter(Boolean).join(" ").replace(/\s+([,.;:!?])/g, "$1") || null;
}
function mapWork(work, query, score) {
    const title = normalizeText(work.display_name) || normalizeText(work.title);
    if (!title)
        return null;
    const doi = normalizeDoi(work.doi) ?? normalizeDoi(record(work.ids)?.doi);
    const externalId = normalizeExternalId("openalex", work.id);
    const primary = record(work.primary_location);
    const venue = record(primary?.source) ?? record(work.host_venue);
    return { retrievalProvider: "openalex", externalSource: "openalex", externalId, doi, title, authors: mapAuthors(work.authorships), abstract: abstract(work.abstract_inverted_index), publishedDate: normalizeText(work.publication_date) || null, venue: normalizeText(venue?.display_name) || normalizeText(venue?.name) || null, url: normalizeUrl(primary?.landing_page_url) ?? (doi ? `https://doi.org/${doi}` : normalizeUrl(work.id)), citationCount: Math.max(0, toFiniteNumber(work.cited_by_count, 0)), sourceMetadata: compactMetadata({ retrievalProvider: "openalex", externalSource: "openalex", openalexId: externalId, query, relevanceScore: score ?? toFiniteNumber(work.relevance_score, 0), publicationYear: toIntegerOrNull(work.publication_year), type: normalizeText(work.type) || null }), diagnostics: [] };
}
function workUrl(doi, externalId) { return `${OPENALEX_URL}/works/${encodeURIComponent(doi ? `https://doi.org/${doi}` : externalId ?? "")}`; }
export function buildOpenAlexSearchUrl(input) {
    const url = new URL(`${OPENALEX_URL}/works`);
    url.searchParams.set("search", input.query);
    url.searchParams.set("per-page", String(input.limit));
    if (input.dateRange)
        url.searchParams.set("filter", `from_publication_date:${input.dateRange.from},to_publication_date:${input.dateRange.to}`);
    if (input.runtime.contactEmail)
        url.searchParams.set("mailto", input.runtime.contactEmail);
    return url.toString();
}
export async function searchOpenAlex(input) {
    const query = normalizeText(input.query);
    if (!query)
        return [];
    const doi = normalizeDoi(query);
    if (input.offline) {
        const matches = doi ? [{ work: OFFLINE_WORKS.attention, score: 1 }] : (OFFLINE_QUERY[query.toLowerCase()] ?? []);
        return matches.slice(0, input.limit).map(({ work, score }) => mapWork(work, query, score)).filter((item) => Boolean(item));
    }
    const payload = record(await requestJson(doi ? workUrl(doi) : buildOpenAlexSearchUrl(input), input.runtime, "openalex"));
    const works = doi ? [payload] : (Array.isArray(payload?.results) ? payload.results : []);
    return works.map((work) => mapWork(record(work) ?? {}, query, doi ? 1 : undefined)).filter((item) => Boolean(item));
}
export const openAlexProvider = {
    id: "openalex",
    search: searchOpenAlex,
    detail: async ({ candidate, runtime, offline }) => (await searchOpenAlex({ query: candidate.doi ?? candidate.externalId ?? candidate.title, limit: 1, runtime, offline }))[0] ?? null,
    references: async ({ candidate, runtime, offline }) => {
        if (offline)
            return [];
        const payload = record(await requestJson(workUrl(candidate.doi ?? undefined, candidate.doi ? undefined : candidate.externalId ?? undefined), runtime, "openalex"));
        const ids = Array.isArray(payload?.referenced_works) ? payload.referenced_works.slice(0, 50) : [];
        const references = await Promise.all(ids.map(async (value) => { const id = normalizeExternalId("openalex", value); if (!id)
            return null; return record(await requestJson(workUrl(undefined, id), runtime, "openalex")); }));
        return references.map((work) => { if (!work)
            return null; const mapped = mapWork(work, normalizeText(work.id)); if (!mapped)
            return null; return { identity: { doi: mapped.doi, externalSource: "openalex", externalId: mapped.externalId }, title: mapped.title, authors: mapped.authors, publishedDate: mapped.publishedDate, venue: mapped.venue, doi: mapped.doi, url: mapped.url, citationCount: mapped.citationCount, source: "openalex" }; }).filter((item) => Boolean(item));
    },
};
//# sourceMappingURL=openalex.js.map