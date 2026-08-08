import type { PaperCandidate, ProviderAdapter, ProviderSearchInput } from "../types.js";
export declare function buildSemanticScholarSearchUrl(input: ProviderSearchInput): string;
export declare function searchSemanticScholar(input: ProviderSearchInput): Promise<PaperCandidate[]>;
export declare const semanticScholarProvider: ProviderAdapter;
//# sourceMappingURL=semantic-scholar.d.ts.map