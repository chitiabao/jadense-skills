import { MissingCredentialError, safeErrorMessage } from "./errors.js";
import { inferProviders, isCandidateWithinDateRange, normalizeLimit, normalizeQueries, rankCandidates, validateDateRange } from "./planning.js";
import { getProvider, providers } from "./providers/index.js";
function validateCandidate(candidate) {
    if (!candidate.title || !candidate.retrievalProvider || !candidate.externalSource)
        throw new Error("Provider returned an invalid paper candidate.");
    return candidate;
}
export async function executeSearch(request, options) {
    const queries = normalizeQueries(request.queries);
    if (!queries.length)
        throw new Error("At least one non-empty query is required.");
    const limit = normalizeLimit(request.limit);
    const dateRange = validateDateRange(request.dateRange);
    const selectedProviders = inferProviders({ queries, providers: request.providers });
    if (!options.offline && selectedProviders.includes("google_scholar") && !options.runtime.credentials?.serpApiKey)
        throw new MissingCredentialError("google_scholar", "SERPAPI_API_KEY");
    const diagnostics = [];
    const jobs = selectedProviders.flatMap((provider) => queries.map((query) => ({ provider, query })));
    const settled = await Promise.allSettled(jobs.map((job) => (options.adapters?.[job.provider] ?? getProvider(job.provider)).search({ query: job.query, limit, dateRange, runtime: options.runtime, offline: options.offline })));
    const candidates = [];
    const dateRejected = [];
    const queryStatuses = [];
    settled.forEach((result, index) => {
        const job = jobs[index];
        if (result.status === "fulfilled") {
            const valid = result.value.map(validateCandidate);
            const accepted = dateRange ? valid.filter((candidate) => isCandidateWithinDateRange(candidate, dateRange)) : valid;
            candidates.push(...accepted.map((candidate) => ({ candidate, query: job.query })));
            if (dateRange)
                dateRejected.push(...valid.filter((candidate) => !isCandidateWithinDateRange(candidate, dateRange)).map((candidate) => ({ candidate, query: job.query })));
            queryStatuses.push({ query: job.query, provider: job.provider, status: "success", hitCount: valid.length, dateFilteredCount: accepted.length });
        }
        else {
            const message = safeErrorMessage(result.reason);
            diagnostics.push({ severity: "warning", stage: "provider", provider: job.provider, query: job.provider === "google_scholar" ? null : job.query, message });
            queryStatuses.push({ query: job.query, provider: job.provider, status: "error", hitCount: 0, error: message });
        }
    });
    const results = rankCandidates(candidates);
    if (options.persistence)
        await options.persistence.save(results);
    return { results, queryPlan: { queries, providers: selectedProviders, limit, dateRange: dateRange ?? null, offline: Boolean(options.offline), totalHitCount: candidates.length + dateRejected.length, dateRejectedCandidateCount: dateRejected.length, mergedCandidateCount: results.length, queryStatuses }, diagnostics };
}
export { providers };
//# sourceMappingURL=search.js.map