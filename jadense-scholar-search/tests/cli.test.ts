import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import test from "node:test"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const cli = resolve(packageRoot, "dist", "bin", "scholar-search.mjs")
function run(args: string[]) { const env = { ...process.env }; delete env.SERPAPI_API_KEY; return spawnSync(process.execPath, [cli, ...args], { cwd: packageRoot, encoding: "utf8", env }) }

test("compiled CLI runs offline JSON and deduplicates repeated providers", () => {
  const result = run(["--offline", "--query", "transformer interpretability", "--provider", "openalex", "--provider", "openalex"])
  assert.equal(result.status, 0)
  const payload = JSON.parse(result.stdout) as { queryPlan: { providers: string[] }; results: unknown[] }
  assert.deepEqual(payload.queryPlan.providers, ["openalex"])
  assert.equal(payload.results.length, 3)
})

test("compiled CLI reports invalid providers and missing Google Scholar credentials", () => {
  const invalid = run(["--query", "x", "--provider", "not-a-provider"])
  assert.notEqual(invalid.status, 0)
  assert.match(invalid.stderr, /Invalid provider/)
  const missing = run(["--query", "x", "--provider", "google_scholar"])
  assert.equal(missing.status, 2)
  assert.match(missing.stderr, /SERPAPI_API_KEY/)
})
