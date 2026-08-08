import type { PaperCandidate, ProviderAdapter, ProviderSearchInput } from "../types.js";
export declare function buildPubmedSearchUrl(input: ProviderSearchInput): string;
export declare function searchPubmed(input: ProviderSearchInput): Promise<PaperCandidate[]>;
export declare const pubmedProvider: ProviderAdapter;
//# sourceMappingURL=pubmed.d.ts.map