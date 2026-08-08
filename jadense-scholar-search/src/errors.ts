import type { SearchProviderId } from "./types.js"

export type ProviderErrorClassification = "auth_failed" | "quota_exhausted" | "unavailable" | "invalid_request" | "provider_error" | "missing_credential"

export class ScholarSearchError extends Error {
  readonly provider?: SearchProviderId

  constructor(message: string, readonly code: string, options?: { provider?: SearchProviderId; cause?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause })
    this.name = "ScholarSearchError"
    this.provider = options?.provider
  }
}

export class ProviderRequestError extends ScholarSearchError {
  constructor(message: string, readonly status: number | null, readonly classification: ProviderErrorClassification, provider: SearchProviderId) {
    super(message, classification, { provider })
    this.name = "ProviderRequestError"
  }
}

export class MissingCredentialError extends ScholarSearchError {
  constructor(provider: SearchProviderId, credential: string) {
    super(`${provider} requires the injected ${credential} credential.`, "missing_credential", { provider })
    this.name = "MissingCredentialError"
  }
}

export function safeErrorMessage(error: unknown): string {
  return error instanceof ScholarSearchError ? error.message : "Provider request failed."
}

export function redactSecrets(value: string, secrets: Array<string | undefined>): string {
  return secrets.filter((secret): secret is string => Boolean(secret && secret.length > 3)).reduce((message, secret) => message.replaceAll(secret, "[REDACTED]"), value)
}
