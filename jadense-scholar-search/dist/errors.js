export class ScholarSearchError extends Error {
    code;
    provider;
    constructor(message, code, options) {
        super(message, options?.cause === undefined ? undefined : { cause: options.cause });
        this.code = code;
        this.name = "ScholarSearchError";
        this.provider = options?.provider;
    }
}
export class ProviderRequestError extends ScholarSearchError {
    status;
    classification;
    constructor(message, status, classification, provider) {
        super(message, classification, { provider });
        this.status = status;
        this.classification = classification;
        this.name = "ProviderRequestError";
    }
}
export class MissingCredentialError extends ScholarSearchError {
    constructor(provider, credential) {
        super(`${provider} requires the injected ${credential} credential.`, "missing_credential", { provider });
        this.name = "MissingCredentialError";
    }
}
export function safeErrorMessage(error) {
    return error instanceof ScholarSearchError ? error.message : "Provider request failed.";
}
export function redactSecrets(value, secrets) {
    return secrets.filter((secret) => Boolean(secret && secret.length > 3)).reduce((message, secret) => message.replaceAll(secret, "[REDACTED]"), value);
}
//# sourceMappingURL=errors.js.map