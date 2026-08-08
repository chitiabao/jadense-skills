import type { SearchProviderId, SearchRuntimeConfig } from "../types.js";
export type JsonRecord = Record<string, unknown>;
export declare function record(value: unknown): JsonRecord | null;
export declare function runtimeFetch(runtime: SearchRuntimeConfig): typeof fetch;
export declare function providerHeaders(runtime: SearchRuntimeConfig, accept: string): Record<string, string>;
export declare function requestText(url: string, runtime: SearchRuntimeConfig, provider: SearchProviderId, init?: RequestInit): Promise<string>;
export declare function requestJson(url: string, runtime: SearchRuntimeConfig, provider: SearchProviderId, init?: RequestInit): Promise<unknown>;
export declare function yearFromDate(value: unknown): number | null;
//# sourceMappingURL=common.d.ts.map