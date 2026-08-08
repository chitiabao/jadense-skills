import type { PaperCandidate, ProviderAdapter, ProviderSearchInput } from "../types.js";
export declare function buildCrossrefSearchUrl(input: ProviderSearchInput): string;
export declare function searchCrossref(input: ProviderSearchInput): Promise<PaperCandidate[]>;
export declare const crossrefProvider: ProviderAdapter;
//# sourceMappingURL=crossref.d.ts.map