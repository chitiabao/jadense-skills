import { executeSearch } from "../search.js"
import { MissingCredentialError, ScholarSearchError } from "../errors.js"
import { SEARCH_PROVIDER_IDS, type DateRange, type SearchProviderId, type SearchRequest } from "../types.js"
import { fileURLToPath } from "node:url"

type CliOptions = SearchRequest & { offline: boolean; format: "json" | "markdown"; userAgent: string; contactEmail?: string }
function valueFor(argv: string[], index: number, flag: string): string { const value = argv[index + 1]; if (!value || value.startsWith("-")) throw new Error(`${flag} requires a value.`); return value }
function splitValues(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean) }
function provider(value: string): SearchProviderId { if (!(SEARCH_PROVIDER_IDS as readonly string[]).includes(value)) throw new Error(`Invalid provider: ${value}. Expected one of ${SEARCH_PROVIDER_IDS.join(", ")}.`); return value as SearchProviderId }

function parseArgs(argv: string[]): CliOptions {
  const queries: string[] = []; const selected: SearchProviderId[] = []; let limit: number | undefined; let from: string | undefined; let to: string | undefined; let offline = false; let format: CliOptions["format"] = "json"; let userAgent = process.env.SCHOLAR_SEARCH_USER_AGENT?.trim() || "scholar-search-cli/0.1.0"; let contactEmail = process.env.SCHOLAR_SEARCH_CONTACT_EMAIL?.trim() || process.env.CONTACT_EMAIL?.trim() || undefined
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]; if (arg === "--help" || arg === "-h") { printHelp(); process.exit(0) }
    const [flag, inline] = arg.split("=", 2); const read = () => inline ?? valueFor(argv, index++, flag)
    if (flag === "--query" || flag === "-q") queries.push(...splitValues(read()))
    else if (flag === "--provider" || flag === "-p") selected.push(...splitValues(read()).map(provider))
    else if (flag === "--limit") limit = Number(read())
    else if (flag === "--from") from = read()
    else if (flag === "--to") to = read()
    else if (flag === "--format") { const candidate = read(); if (candidate !== "json" && candidate !== "markdown") throw new Error("--format must be json or markdown."); format = candidate }
    else if (flag === "--user-agent") userAgent = read()
    else if (flag === "--contact-email") contactEmail = read()
    else if (flag === "--offline") offline = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  const dateRange: DateRange | undefined = from || to ? { from: from ?? "", to: to ?? "" } : undefined
  return { queries, providers: selected.length ? [...new Set(selected)] : undefined, limit, dateRange, offline, format, userAgent, contactEmail }
}

function markdown(response: Awaited<ReturnType<typeof executeSearch>>): string {
  const lines = ["# Scholarly search results", "", `Providers: ${response.queryPlan.providers.join(", ")}`, `Queries: ${response.queryPlan.queries.join(" / ")}`, `Results: ${response.results.length}`, ""]
  response.results.forEach((paper, index) => { const authors = paper.authors.map((author) => author.displayName).join(", ") || "Unknown authors"; lines.push(`${index + 1}. **${paper.title}**`, `   - Authors: ${authors}`, `   - Date: ${paper.publishedDate ?? "Unknown"}`, `   - Venue: ${paper.venue ?? "Unknown"}`, `   - DOI: ${paper.doi ?? "None"}`, `   - Source: ${paper.externalSource}${paper.externalId ? ` (${paper.externalId})` : ""}`, `   - URL: ${paper.url ?? "None"}`, "") })
  if (response.diagnostics.length) { lines.push("## Diagnostics", ""); response.diagnostics.forEach((item) => lines.push(`- [${item.severity}] ${item.provider ?? item.stage}: ${item.message}`)) }
  return `${lines.join("\n")}\n`
}
function printHelp() { process.stdout.write(`jadense-scholar-search\n\nUsage:\n  node dist/bin/scholar-search.mjs --query <text> [options]\n\nOptions:\n  -q, --query <text>       Query; repeat up to four times\n  -p, --provider <id>      Provider; repeat or comma-separate\n      --limit <1..30>      Retrieval limit\n      --from <YYYY-MM-DD>  Inclusive publication date\n      --to <YYYY-MM-DD>    Inclusive publication date\n      --format <json|markdown>\n      --offline             Use fixtures and never call a provider\n      --user-agent <text>  Injected HTTP User-Agent\n      --contact-email <email>  Provider contact metadata\n`) }

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  try {
    const options = parseArgs(argv)
    const response = await executeSearch({ queries: options.queries, providers: options.providers, limit: options.limit, dateRange: options.dateRange }, { offline: options.offline, runtime: { userAgent: options.userAgent, contactEmail: options.contactEmail, credentials: { serpApiKey: process.env.SERPAPI_API_KEY?.trim() || undefined, semanticScholarApiKey: process.env.SEMANTIC_SCHOLAR_API_KEY?.trim() || undefined, ncbiApiKey: process.env.NCBI_API_KEY?.trim() || undefined, ncbiTool: process.env.NCBI_TOOL?.trim() || undefined } } })
    process.stdout.write(options.format === "markdown" ? markdown(response) : `${JSON.stringify(response, null, 2)}\n`); return 0
  } catch (error) {
    const code = error instanceof ScholarSearchError ? error.code : "invalid_request"; const message = error instanceof Error ? error.message : "Search failed."; const payload = { error: { code, message, ...(error instanceof ScholarSearchError && error.provider ? { provider: error.provider } : {}) } }; process.stderr.write(`${JSON.stringify(payload)}\n`); return error instanceof MissingCredentialError ? 2 : 1
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runCli().then((code) => { process.exitCode = code })
