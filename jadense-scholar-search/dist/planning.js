import { normalizeDoi, normalizeExternalId, normalizeText, normalizeTitle, publicationYear } from "./normalize.js";
import { SEARCH_PROVIDER_IDS } from "./types.js";
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 30;
export const MAX_QUERIES = 4;
export function normalizeQueries(queries) { return [...new Set(queries.map(normalizeText).filter(Boolean))].slice(0, MAX_QUERIES); }
export function normalizeLimit(limit) {
    if (limit !== undefined && (!Number.isFinite(limit) || !Number.isInteger(limit)))
        throw new Error("limit must be an integer.");
    return Math.max(1, Math.min(MAX_LIMIT, limit ?? DEFAULT_LIMIT));
}
export function validateDateRange(value) {
    if (!value)
        return undefined;
    const valid = (date) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
            return false;
        const parsed = new Date(`${date}T00:00:00.000Z`);
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
    };
    if (!valid(value.from) || !valid(value.to) || value.from > value.to)
        throw new Error("dateRange must contain valid YYYY-MM-DD dates with from <= to.");
    return value;
}
export function inferProviders(input) {
    const explicit = [...new Set(input.providers ?? [])];
    if (explicit.length)
        return explicit;
    const corpus = input.queries.join(" ").toLowerCase();
    const inferred = [];
    if (/google scholar|谷歌学术|cited by|高被引/.test(corpus))
        inferred.push("google_scholar");
    if (/latest|recent|preprint|state[- ]of[- ]the[- ]art|sota|最新|近期|预印本|前沿/.test(corpus))
        inferred.push("arxiv");
    if (/pubmed|biomedical|medicine|medical|clinical|biology|genomic|gene|drug|patient|trial|医学|生物|临床|药物|基因|患者/.test(corpus))
        inferred.push("pubmed");
    if (/crossref|doi|publisher|metadata|出版社|期刊元数据/.test(corpus))
        inferred.push("crossref");
    if (/semantic scholar|semantic_scholar|paperid|citation graph|语义学者|引用图谱/.test(corpus))
        inferred.push("semantic_scholar");
    if (/published|journal|citation|review|survey|formal|openalex|发表|期刊|引用|综述|正式论文/.test(corpus))
        inferred.push("openalex");
    const unique = [...new Set(inferred)].slice(0, 2);
    return unique.length ? unique : ["openalex"];
}
export function providerId(value) { return SEARCH_PROVIDER_IDS.includes(value) ? value : null; }
export function candidateIdentity(candidate) {
    const doi = normalizeDoi(candidate.doi);
    if (doi)
        return `doi:${doi}`;
    if (candidate.externalId)
        return `${candidate.externalSource}:${normalizeExternalId(candidate.externalSource, candidate.externalId) ?? candidate.externalId}`;
    const google = candidate.sourceMetadata.googleScholar;
    if (google && typeof google === "object" && !Array.isArray(google)) {
        const resultId = normalizeText(google.resultId);
        if (resultId)
            return `google_scholar:${resultId}`;
    }
    return `title:${normalizeTitle(candidate.title)}`;
}
export function isCandidateWithinDateRange(candidate, dateRange) {
    const date = candidate.publishedDate;
    return Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= dateRange.from && date <= dateRange.to);
}
function completeness(candidate) { return [candidate.doi, candidate.externalId, candidate.abstract, candidate.publishedDate, candidate.venue, candidate.url, candidate.authors.length ? "authors" : null].filter(Boolean).length; }
function relevance(candidate) { const value = Number(candidate.sourceMetadata.relevanceScore); return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; }
function mergeCandidates(candidates) {
    const primary = [...candidates].sort((left, right) => completeness(right) - completeness(left) || (right.citationCount ?? 0) - (left.citationCount ?? 0))[0];
    return { ...primary, sourceMetadata: { ...primary.sourceMetadata, retrievalProviders: [...new Set(candidates.map((candidate) => candidate.retrievalProvider))], matchedQueries: [...new Set(candidates.map((candidate) => normalizeText(candidate.sourceMetadata.query)).filter(Boolean))], mergedSources: candidates.map((candidate) => ({ provider: candidate.retrievalProvider, externalId: candidate.externalId, doi: candidate.doi })) } };
}
function score(candidate, query) {
    const citationScore = Math.min(1, Math.log10((candidate.citationCount ?? 0) + 1) / 5);
    const year = publicationYear(candidate);
    const recencyScore = year ? Math.max(0, Math.min(1, (new Date().getUTCFullYear() - year + 1) / 10)) : 0;
    const exactTitle = normalizeTitle(candidate.title) === normalizeTitle(query) ? 0.2 : 0;
    return relevance(candidate) * 0.6 + citationScore * 0.25 + recencyScore * 0.15 + exactTitle;
}
export function rankCandidates(input) {
    const groups = new Map();
    for (const item of input) {
        const key = candidateIdentity(item.candidate);
        groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.values()].map((group) => ({ candidate: mergeCandidates(group.map((item) => item.candidate)), score: Math.max(...group.map((item) => score(item.candidate, item.query))) })).sort((left, right) => right.score - left.score || left.candidate.title.localeCompare(right.candidate.title)).map(({ candidate, score: finalScore }, index) => ({ ...candidate, sourceMetadata: { ...candidate.sourceMetadata, rank: index + 1, finalScore } }));
}
//# sourceMappingURL=planning.js.map