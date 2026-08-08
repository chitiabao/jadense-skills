import { type DateRange, type PaperCandidate, type SearchProviderId } from "./types.js";
export declare const DEFAULT_LIMIT = 10;
export declare const MAX_LIMIT = 30;
export declare const MAX_QUERIES = 4;
export declare function normalizeQueries(queries: string[]): string[];
export declare function normalizeLimit(limit: number | undefined): number;
export declare function validateDateRange(value: DateRange | undefined): DateRange | undefined;
export declare function inferProviders(input: {
    queries: string[];
    providers?: SearchProviderId[];
}): SearchProviderId[];
export declare function providerId(value: string): SearchProviderId | null;
export declare function candidateIdentity(candidate: PaperCandidate): string;
export declare function isCandidateWithinDateRange(candidate: PaperCandidate, dateRange: DateRange): boolean;
export declare function rankCandidates(input: Array<{
    candidate: PaperCandidate;
    query: string;
}>): PaperCandidate[];
//# sourceMappingURL=planning.d.ts.map