import { compactMetadata, normalizeAuthors, normalizeDoi, normalizeText, normalizeUrl, toIntegerOrNull } from "../normalize.js";
import { MissingCredentialError, ProviderRequestError } from "../errors.js";
import { record, requestJson } from "./common.js";
const SERPAPI_URL = "https://serpapi.com/search.json";
function extractDoi(value) { const match = normalizeText(value).match(/(?:doi(?:\.org\/|:\s*)?)(10\.\d{4,9}\/[\-._;()/:a-z0-9]+)/i); return normalizeDoi(match?.[1]); }
function publication(value) { const text = normalizeText(value); const year = text.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/)?.[1] ?? null; const parts = text.split(" - ").map((item) => item.trim()).filter(Boolean); return { year, authors: parts[0] ?? "", venue: parts.slice(1).join(" - ") || null }; }
export function mapGoogleScholarResult(value) {
    const item = record(value);
    const title = normalizeText(item?.title);
    if (!item || !title)
        return null;
    const publicationSummary = record(item.publication_info)?.summary;
    const info = publication(publicationSummary);
    const links = record(item.inline_links);
    const citedBy = record(links?.cited_by);
    const resultId = normalizeText(item.result_id) || null;
    const clusterId = normalizeText(record(links?.versions)?.cluster_id) || null;
    const citedById = normalizeText(citedBy?.cites_id) || null;
    const doi = extractDoi(item.link) ?? extractDoi(item.snippet) ?? extractDoi(publicationSummary);
    return { retrievalProvider: "google_scholar", externalSource: "google_scholar", externalId: doi, doi, title, abstract: normalizeText(item.snippet) || null, authors: normalizeAuthors(info.authors.split(/,\s*/)), publishedDate: null, venue: info.venue, url: normalizeUrl(item.link) ?? (doi ? `https://doi.org/${doi}` : null), citationCount: toIntegerOrNull(citedBy?.total), sourceMetadata: compactMetadata({ retrievalProvider: "google_scholar", externalSource: "google_scholar", publicationYear: info.year ? Number(info.year) : null, googleScholar: { resultId, clusterId, citedById } }), diagnostics: [] };
}
export class SerpApiRequestError extends ProviderRequestError {
    constructor(message, status, classification) { super(message, status, classification, "google_scholar"); this.name = "SerpApiRequestError"; }
}
function classify(status, hasProviderError) { if (status === 401 || status === 403)
    return new SerpApiRequestError("SerpApi authentication failed.", status, "auth_failed"); if (status === 429)
    return new SerpApiRequestError("SerpApi quota is exhausted.", status, "quota_exhausted"); if (status === 400)
    return new SerpApiRequestError("SerpApi rejected the request.", status, "invalid_request"); if (status === 503 || status === null)
    return new SerpApiRequestError("SerpApi is temporarily unavailable.", status, "unavailable"); return new SerpApiRequestError(hasProviderError ? "SerpApi returned an error." : "SerpApi request failed.", status, "provider_error"); }
export function buildGoogleScholarSearchUrl(input, start = 0) {
    const url = new URL(SERPAPI_URL);
    url.searchParams.set("engine", "google_scholar");
    url.searchParams.set("q", input.query);
    url.searchParams.set("start", String(start));
    if (input.runtime.credentials?.serpApiKey)
        url.searchParams.set("api_key", input.runtime.credentials.serpApiKey);
    if (input.dateRange) {
        url.searchParams.set("as_ylo", input.dateRange.from.slice(0, 4));
        url.searchParams.set("as_yhi", input.dateRange.to.slice(0, 4));
    }
    ;
    return url.toString();
}
export async function searchGoogleScholar(input) {
    if (input.offline)
        return [];
    if (!input.runtime.credentials?.serpApiKey)
        throw new MissingCredentialError("google_scholar", "SERPAPI_API_KEY");
    const results = [];
    const seen = new Set();
    for (let start = 0; start < input.limit; start += 10) {
        let payload;
        try {
            payload = record(await requestJson(buildGoogleScholarSearchUrl(input, start), input.runtime, "google_scholar", { headers: { Accept: "application/json" } }));
        }
        catch (error) {
            if (error instanceof ProviderRequestError)
                throw classify(error.status, true);
            throw error;
        }
        const providerError = normalizeText(payload?.error);
        const status = normalizeText(record(payload?.search_metadata)?.status).toLowerCase();
        if (providerError || (status && status !== "success" && status !== "cached"))
            throw classify(200, true);
        const page = (Array.isArray(payload?.organic_results) ? payload.organic_results : []).map(mapGoogleScholarResult).filter((item) => Boolean(item));
        let added = 0;
        for (const candidate of page) {
            const google = record(candidate.sourceMetadata.googleScholar);
            const key = candidate.doi ?? normalizeText(google?.resultId) ?? `${candidate.title}:${candidate.sourceMetadata.publicationYear ?? ""}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            results.push(candidate);
            added += 1;
            if (results.length >= input.limit)
                break;
        }
        if (results.length >= input.limit || added === 0 || !record(payload?.serpapi_pagination)?.next)
            break;
    }
    return results;
}
export const googleScholarProvider = { id: "google_scholar", search: searchGoogleScholar };
//# sourceMappingURL=google-scholar.js.map