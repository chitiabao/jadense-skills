import type { PaperCandidate, ProviderAdapter, ProviderSearchInput } from "../types.js";
export declare function buildArxivSearchUrl(input: ProviderSearchInput): string;
export declare function searchArxiv(input: ProviderSearchInput): Promise<PaperCandidate[]>;
export declare const arxivProvider: ProviderAdapter;
//# sourceMappingURL=arxiv.d.ts.map