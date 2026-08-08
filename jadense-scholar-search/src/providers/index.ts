import { arxivProvider } from "./arxiv.js"
import { crossrefProvider } from "./crossref.js"
import { googleScholarProvider } from "./google-scholar.js"
import { openAlexProvider } from "./openalex.js"
import { pubmedProvider } from "./pubmed.js"
import { semanticScholarProvider } from "./semantic-scholar.js"
import type { ProviderAdapter, SearchProviderId } from "../types.js"

export const providers: Record<SearchProviderId, ProviderAdapter> = { arxiv: arxivProvider, openalex: openAlexProvider, crossref: crossrefProvider, pubmed: pubmedProvider, semantic_scholar: semanticScholarProvider, google_scholar: googleScholarProvider }
export function getProvider(id: SearchProviderId): ProviderAdapter { return providers[id] }
