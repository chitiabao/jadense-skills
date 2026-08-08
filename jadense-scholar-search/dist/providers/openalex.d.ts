import type { PaperCandidate, ProviderAdapter, ProviderSearchInput } from "../types.js";
export declare function buildOpenAlexSearchUrl(input: ProviderSearchInput): string;
export declare function searchOpenAlex(input: ProviderSearchInput): Promise<PaperCandidate[]>;
export declare const openAlexProvider: ProviderAdapter;
//# sourceMappingURL=openalex.d.ts.map