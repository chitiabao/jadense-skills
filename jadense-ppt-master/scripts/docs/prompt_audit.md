# Prompt Audit — 自包含预算与治理检查

> 仅供维护者使用，只读。该工具审计 Skill 内面向代理的 Markdown 语料，不修改文件，也不接入 CI 或 pre-commit。生成角色不得加载本文件、审计脚本或 manifest。

## Run

脚本根据自身位置定位 `jadense-ppt-master` 根目录，因此可从任意工作目录调用，不依赖上游仓库的 `AGENTS.md` 或固定安装目录：

```powershell
python D:\path\to\jadense-ppt-master\scripts\prompt_audit.py
python D:\path\to\jadense-ppt-master\scripts\prompt_audit.py --json
```

macOS/Linux 使用同样的绝对路径调用。只有维护审计需要 `tiktoken`，终端用户不需要；它不属于 `requirements.txt`：

```bash
pip install 'tiktoken>=0.7.0'
```

任何确定性错误返回退出码 `1`。未接受的精确重复或 schema projection 是可处理警告；启发式近似重复只进入报告，不进入 `findings`。使用 `--json` 时，初始化失败也返回稳定的 `AUDIT_SETUP_ERROR` JSON envelope，而不是 traceback 或纯文本错误。

`prompt_audit_manifest.json` 中的文档和权威边均使用 Skill 根目录相对路径；审计不读取仓库级 `AGENTS.md`，也不要求复制上游仓库目录结构。

## What It Checks

| Area | Failure class |
|---|---|
| Corpus and hot-file token ceilings | error on budget overflow |
| Declared load sets (route/stage scenarios) | error on budget overflow, unknown files, selector/registry drift |
| Load coverage | error when a corpus file is in no load set and has no `coverage.exempt` entry |
| Registry claims (layout patterns, modes, styles, renderings, types, charts) | error on ID/count/index drift |
| Markdown references and declared authority edges | error on broken links or unreferenced edges |
| Cross-file exact duplicates | warning until adjudicated via `duplicates.accepted` |
| Cross-file near duplicates | informational candidates in the report; no finding |
| Schema multi-definition | warning for each unaccepted owner-field / projection-path pair; accepted projections stay visible in the report |
| Accepted duplicate/schema drift | error when an accepted source or projection no longer matches |

## Manifest Maintenance — `prompt_audit_manifest.json`

The manifest is audit-only (`audit_only: true`, `runtime_consumed: false`); it is a lint fixture, never prompt context. It hand-transcribes the load rules stated in `SKILL.md` and the role/workflow docs, so **every change to read instructions in those docs must update the matching load set in the same change** — the coverage check catches unclassified files, but only humans can catch a changed read rule for an existing file.

- **New corpus file** → when no existing category exemption matches it, the audit fails with `LOAD_COVERAGE_GAP` until you add it to the load sets that read it or exempt it with a one-line reason. Exempt only material that never enters role context (for example, a legacy tombstone, generated maintenance asset, maintainer-only doc, or license notice); represent conditional runtime reads as incremental load sets.
- **Intentional exact duplicate** → run `--json`, copy the candidate's `kind`, `fingerprint`, and `paths` into `duplicates.accepted` with a reason. The acceptance identity is all three values, so separate path pairs with identical prose remain independently reviewable. Editing either reported raw block changes its fingerprint; stale acceptance fails with `DUPLICATE_ACCEPTED_STALE`.
- **Near duplicate** → inspect `duplicates.near` as heuristic maintenance information. It produces no warning. A maintainer may still record a stable intentional pair in `duplicates.accepted`; `--skip-near-duplicates` deliberately leaves accepted near pairs unchecked because that scan did not run.
- **Schema owner** → every configured field must have a field-local definition signal in its declared owner. Split fields into separate owner entries when they belong to different artifacts. Generic `key` / `value` prose elsewhere on a long line is not a grammar signal; explicit assignments, field-local grammar/format language, and forms such as `field ... one of ...` are.
- **Intentional schema projection** → run `--json`, then copy the field's `owner_fingerprint` and each reviewed projection's `path` / `fingerprint` into that `schema_grammars[]` entry. Classify every projection as `producer`, `consumer`, `reference`, or `compatibility`, and record a one-line reason:

  ```json
  {
    "source": "templates/schemas/spec_lock.schema.json",
    "fields": ["page_rhythm"],
    "scan": ["references/**/*.md", "workflows/**/*.md", "templates/*.md"],
    "accepted": [
      {
        "field": "page_rhythm",
        "owner_fingerprint": "0123456789ab",
        "projections": [
          {
            "path": "references/executor-base.md",
            "role": "consumer",
            "fingerprint": "abcdef012345",
            "reason": "Executor needs the selected page-rhythm key and closed values."
          }
        ]
      }
    ]
  }
  ```

  Acceptance is exact, not a path exemption. The owner fingerprint covers the configured field's owner contract; a projection fingerprint covers every current grammar-like line for that field in that path. Owner edits, projection edits, or projection removal fail with `SCHEMA_ACCEPTED_STALE`; a new field/path projection remains `SCHEMA_MULTIDEF_CANDIDATE`. The JSON report separates `schema_grammars[].open`, `.accepted`, and `.stale`, so adjudicated projections and drift remain auditable without turning stale accepted paths into duplicate warnings.
- **Budget ceilings** (`budget_policy: fixed_upper_bound`): budgets are stable, deliberately rounded limits rather than mirrors of the current token count. Establish a new ceiling with roughly 10% working headroom and round it up in 250-token increments below 10k, 1k increments below 100k, or 5k increments from 100k upward; the manifest loader enforces those increments. Once set, do not raise or lower a passing ceiling, including to restore headroom after prompt growth. Raise it only after the current audit reports `BUDGET_CORPUS`, `BUDGET_FILE`, or `BUDGET_LOAD_SET` against that exact ceiling; then choose the next rounded limit with comparable headroom, record the overflow-triggering scope in the same change, and leave it unchanged until another actual overflow.
