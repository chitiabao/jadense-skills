import type { SearchProviderId } from "./types.js";
export type ProviderErrorClassification = "auth_failed" | "quota_exhausted" | "unavailable" | "invalid_request" | "provider_error" | "missing_credential";
export declare class ScholarSearchError extends Error {
    readonly code: string;
    readonly provider?: SearchProviderId;
    constructor(message: string, code: string, options?: {
        provider?: SearchProviderId;
        cause?: unknown;
    });
}
export declare class ProviderRequestError extends ScholarSearchError {
    readonly status: number | null;
    readonly classification: ProviderErrorClassification;
    constructor(message: string, status: number | null, classification: ProviderErrorClassification, provider: SearchProviderId);
}
export declare class MissingCredentialError extends ScholarSearchError {
    constructor(provider: SearchProviderId, credential: string);
}
export declare function safeErrorMessage(error: unknown): string;
export declare function redactSecrets(value: string, secrets: Array<string | undefined>): string;
//# sourceMappingURL=errors.d.ts.map