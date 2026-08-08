import type { JsonValue, PaperAuthor, PaperCandidate, SearchProviderId } from "./types.js"

const DOI_PREFIX_RE = /^https?:\/\/(?:dx\.)?doi\.org\//i
const DOI_RE = /10\.\d{4,9}\/[\-._;()/:a-z0-9]+/i

export function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
}

export function normalizeDoi(value: unknown): string | null {
  const normalized = normalizeText(value)
  if (!normalized) return null
  const withoutPrefix = normalized.replace(DOI_PREFIX_RE, "").replace(/^doi:\s*/i, "")
  const matched = withoutPrefix.match(DOI_RE)
  return matched?.[0]?.replace(/[.)\],;]+$/, "").toLowerCase() ?? null
}

export function normalizeExternalId(provider: SearchProviderId, value: unknown): string | null {
  const text = normalizeText(value)
  if (!text) return null
  if (provider === "arxiv") return text.replace(/^https?:\/\/arxiv\.org\/abs\//i, "").replace(/^arxiv:/i, "").replace(/v\d+$/i, "") || null
  if (provider === "openalex") return text.match(/W\d+$/i)?.[0].toUpperCase() ?? text
  if (provider === "pubmed") return text.match(/\d+/)?.[0] ?? null
  if (provider === "semantic_scholar") return text.replace(/^https?:\/\/www\.semanticscholar\.org\/paper\//i, "") || null
  return normalizeDoi(text) ?? text
}

export function normalizeUrl(value: unknown): string | null {
  return normalizeText(value) || null
}

export function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const text = normalizeText(value)
    if (text && !seen.has(text)) {
      seen.add(text)
      result.push(text)
    }
  }
  return result
}

export function normalizeAuthors(values: unknown[]): PaperAuthor[] {
  return uniqueStrings(values).map((displayName) => ({ displayName }))
}

export function compactMetadata(value: Record<string, JsonValue | undefined>): Record<string, JsonValue> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Record<string, JsonValue>
}

export function toJsonValue(value: unknown): JsonValue {
  if (value === undefined) return null
  try { return JSON.parse(JSON.stringify(value)) as JsonValue } catch { return null }
}

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function toIntegerOrNull(value: unknown): number | null {
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

export function datePartsToIsoDate(value: unknown): string | null {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
  const root = Array.isArray(record?.["date-parts"]) ? record["date-parts"] : null
  const parts = Array.isArray(root?.[0]) ? root[0] as unknown[] : null
  if (!parts || parts.length < 3) return null
  const year = toIntegerOrNull(parts[0])
  const month = toIntegerOrNull(parts[1])
  const day = toIntegerOrNull(parts[2])
  if (!year || !month || !day) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : null
}

export function normalizeTitle(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/[\\/'"`]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
}

export function publicationYear(candidate: PaperCandidate): number | null {
  const metadataYear = toIntegerOrNull(candidate.sourceMetadata.publicationYear)
  return metadataYear || toIntegerOrNull(candidate.publishedDate?.slice(0, 4))
}
