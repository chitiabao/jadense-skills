import { arxivProvider } from "./arxiv.js";
import { crossrefProvider } from "./crossref.js";
import { googleScholarProvider } from "./google-scholar.js";
import { openAlexProvider } from "./openalex.js";
import { pubmedProvider } from "./pubmed.js";
import { semanticScholarProvider } from "./semantic-scholar.js";
export const providers = { arxiv: arxivProvider, openalex: openAlexProvider, crossref: crossrefProvider, pubmed: pubmedProvider, semantic_scholar: semanticScholarProvider, google_scholar: googleScholarProvider };
export function getProvider(id) { return providers[id]; }
//# sourceMappingURL=index.js.map