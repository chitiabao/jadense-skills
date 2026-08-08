import { ProviderRequestError, type ProviderErrorClassification } from "../errors.js";
import type { PaperCandidate, ProviderAdapter, ProviderSearchInput } from "../types.js";
export declare function mapGoogleScholarResult(value: unknown): PaperCandidate | null;
export declare class SerpApiRequestError extends ProviderRequestError {
    constructor(message: string, status: number | null, classification: ProviderErrorClassification);
}
export declare function buildGoogleScholarSearchUrl(input: ProviderSearchInput, start?: number): string;
export declare function searchGoogleScholar(input: ProviderSearchInput): Promise<PaperCandidate[]>;
export declare const googleScholarProvider: ProviderAdapter;
//# sourceMappingURL=google-scholar.d.ts.map