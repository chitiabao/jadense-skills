import { ProviderRequestError } from "../errors.js";
export function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
export function runtimeFetch(runtime) {
    return runtime.fetch ?? fetch;
}
export function providerHeaders(runtime, accept) {
    const headers = {
        Accept: accept,
        "User-Agent": runtime.userAgent,
    };
    if (runtime.contactEmail)
        headers["X-Contact-Email"] = runtime.contactEmail;
    return headers;
}
function classifyStatus(status) {
    if (status === 400)
        return "invalid_request";
    if (status === 401 || status === 403)
        return "auth_failed";
    if (status === 429)
        return "quota_exhausted";
    if (status >= 500)
        return "unavailable";
    return "provider_error";
}
export async function requestText(url, runtime, provider, init) {
    let response;
    try {
        response = await runtimeFetch(runtime)(url, { ...init, headers: { ...providerHeaders(runtime, "text/plain, */*"), ...init?.headers } });
    }
    catch {
        throw new ProviderRequestError(`${provider} is temporarily unavailable.`, null, "unavailable", provider);
    }
    if (!response.ok) {
        throw new ProviderRequestError(`${provider} request failed with status ${response.status}.`, response.status, classifyStatus(response.status), provider);
    }
    return response.text();
}
export async function requestJson(url, runtime, provider, init) {
    const text = await requestText(url, runtime, provider, {
        ...init,
        headers: { ...providerHeaders(runtime, "application/json"), ...init?.headers },
    });
    try {
        return JSON.parse(text);
    }
    catch {
        throw new ProviderRequestError(`${provider} returned invalid JSON.`, null, "provider_error", provider);
    }
}
export function yearFromDate(value) {
    const text = typeof value === "string" ? value : "";
    const match = text.match(/(?:19|20)\d{2}/);
    return match ? Number(match[0]) : null;
}
//# sourceMappingURL=common.js.map