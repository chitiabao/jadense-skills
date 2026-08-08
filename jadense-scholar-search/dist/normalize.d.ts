import type { JsonValue, PaperAuthor, PaperCandidate, SearchProviderId } from "./types.js";
export declare function normalizeText(value: unknown): string;
export declare function normalizeDoi(value: unknown): string | null;
export declare function normalizeExternalId(provider: SearchProviderId, value: unknown): string | null;
export declare function normalizeUrl(value: unknown): string | null;
export declare function uniqueStrings(values: unknown[]): string[];
export declare function normalizeAuthors(values: unknown[]): PaperAuthor[];
export declare function compactMetadata(value: Record<string, JsonValue | undefined>): Record<string, JsonValue>;
export declare function toJsonValue(value: unknown): JsonValue;
export declare function toFiniteNumber(value: unknown, fallback?: number): number;
export declare function toIntegerOrNull(value: unknown): number | null;
export declare function datePartsToIsoDate(value: unknown): string | null;
export declare function normalizeTitle(value: unknown): string;
export declare function publicationYear(candidate: PaperCandidate): number | null;
//# sourceMappingURL=normalize.d.ts.map