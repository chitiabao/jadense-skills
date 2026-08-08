import { providers } from "./providers/index.js";
import type { PersistenceAdapter, ProviderAdapter, SearchRequest, SearchResponse, SearchRuntimeConfig, SearchProviderId } from "./types.js";
export type SearchOptions = {
    runtime: SearchRuntimeConfig;
    offline?: boolean;
    persistence?: PersistenceAdapter;
    adapters?: Partial<Record<SearchProviderId, ProviderAdapter>>;
};
export declare function executeSearch(request: SearchRequest, options: SearchOptions): Promise<SearchResponse>;
export { providers };
//# sourceMappingURL=search.d.ts.map