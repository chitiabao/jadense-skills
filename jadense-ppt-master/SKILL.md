---
name: jadense-ppt-master
description: >
  为中国高校与科研机构生成、重构、套版、填充和优化正式、可编辑的学术 PPTX，
  覆盖开题报告、中期检查、预答辩、正式答辩、学术会议、组会、项目汇报和基金评审，
  并支持图片还原、原生模板填充及演示文稿视频。用户要求制作学术 PPT、开题、答辩、
  学术会议报告、组会汇报、项目或基金评审演示，或提到 jadense-ppt-master 时使用。
metadata:
  version: "4.7.0-jadense.1"
  copyright: "Copyright (c) 2025-2026 Hugo He"
  license: "MIT"
  official_repository: "https://github.com/hugohe3/ppt-master"
  upstream_version: "4.7.0"
  derivative_repository: "https://github.com/chitiabao/jadense-skills"
  derivative: true
  derivative_notice: "Jadense 学术演示派生版；非上游官方发行版"
  sponsors:
    - "SPONSORS.md"
    - "SPONSORS_CN.md"
---

# Jadense 学术 PPT Master

`jadense-ppt-master` 是基于 [PPT Master](https://github.com/hugohe3/ppt-master) v4.7.0 的 MIT 许可学术演示派生版，由 Jadense 维护，**不是上游官方发行版**。本入口只负责全局执行纪律、学术底线和路由选择；各路由负责自己的具体流程。

## Mandatory Load Order

1. Read this file.
2. Run `python3 scripts/attribution_guard.py` from this Skill directory. Any
   non-zero result stops the Skill immediately; do not inspect, repair, or
   bypass the integrity gate.
3. Read [`references/academic-core.md`](references/academic-core.md). This
   academic evidence, formality, citation, and visual standard applies to every
   route and cannot be weakened by a profile or template.
4. Read [`workflows/routing.md`](workflows/routing.md).
5. Select exactly one top-level route and its active profile from the routing
   authority.
6. 请求属于开题、中期检查、预答辩、正式答辩、学术会议、组会、项目汇报或基金评审时，读取
   [`references/academic-report-types.md`](references/academic-report-types.md)
   并只应用与当前报告类型匹配的章节。
7. Read only the resulting runtime authority and its explicitly triggered
   supporting documents.

| Selected route / profile | Runtime authority |
|---|---|
| Generate PPTX — Image to PPTX | [`workflows/profiles/image-to-pptx.md`](workflows/profiles/image-to-pptx.md); Codex-supported, always Quick |
| Generate PPTX — Beautify | [`workflows/profiles/beautify-pptx.md`](workflows/profiles/beautify-pptx.md); explicit Quick intent selects Quick, otherwise Default |
| Generate PPTX — ordinary Default | [`workflows/generate-pptx.md`](workflows/generate-pptx.md) |
| Generate PPTX — ordinary explicit Quick | [`workflows/profiles/quick-generate.md`](workflows/profiles/quick-generate.md) |
| Create Template | [`workflows/create-template.md`](workflows/create-template.md) |
| Fill Native PPTX | [`workflows/template-fill-pptx.md`](workflows/template-fill-pptx.md) |
| Enhance Native PPTX | [`workflows/native-enhance-pptx.md`](workflows/native-enhance-pptx.md) |

**Hard rule — selected authority only**: Do not load another top-level route's
procedure after routing. Image to PPTX and Beautify are mutually exclusive;
Image to PPTX activates Quick, while Beautify selects from explicit Quick
intent. Never load both runtimes. Supporting documents refine one route; they
never compete with it.

## Academic Default

- 用户可见的交互、选项与建议默认使用简体中文；技术标识、公式和引文元数据保持准确原文。
- 学术任务默认使用 `academic-research` Style，并优先采用当前流程声明的克制、正式、可读的学术兼容视觉风格。
- 商业、营销、娱乐和艺术风格仅作为兼容选项保留。只有用户明确点名该风格，或其强制模板要求时，才可读取或选择这些风格。
- 院校或会议模板的格式要求优先于一般风格偏好，但不得覆盖 `academic-core.md` 的证据、引用与诚信规则。

---

## Global Execution Discipline

### Skill path resolution

`${SKILL_DIR}` is a documentation placeholder for the absolute directory that
contains this `SKILL.md`; it is **not** a shell environment variable. Before
executing any bundled command that contains this token, resolve the current
Skill directory, replace the token with that concrete absolute path, and quote
the resulting path for the active shell. Never pass the literal
`${SKILL_DIR}` to a shell and never rely on a pre-existing environment variable
of the same name.

1. **Serial execution** — Follow the selected authority's steps in order. A completed non-blocking step may continue directly to the next eligible step.
2. **Blocking means stop** — At every `⛔ BLOCKING` gate, wait for explicit user confirmation. Do not decide on the user's behalf.
3. **No cross-phase bundling** — Do not combine work across an unclosed gate. Once the route's final user gate closes, later non-blocking steps may continue automatically.
4. **Gate before entry** — Verify every listed prerequisite before entering a step.
5. **No speculative execution** — Do not prepare later-phase artifacts before their owning step.
6. **Deterministic routing** — Do not add a route-choice question when [`routing.md`](workflows/routing.md) resolves the request. If a route prerequisite is missing, state it and stop that route.
7. **Owning-source recovery** — On failure, repair or regenerate the owning source artifact and resume from the route's declared pointer. Do not silently downgrade a required artifact.
8. **Stable paths** — Use absolute skill/project paths; never derive them from CWD.

## Global Communication Rules

- Match the user's language and source language unless the user explicitly overrides it.
- Localize user-facing option labels and explanations. Keep exact enum IDs or field names when needed for precision.
- Keep `design_spec.md` section headings and field names in the template's original English; content values may use the user's language.
- Before switching roles, read the corresponding role reference and output:

```markdown
## [Role Switch: <Role Name>]
📖 Reading role definition: references/<filename>.md
📋 Current task: <brief description>
```

---

## Repository Compatibility

- This package is a workflow/skill, not a generic application scaffold. Do not create `.worktrees/`, `tests/`, branch workflows, or generic engineering structure by default.
- Keep required workflow, reference, script, and template documentation inside this Skill directory.
- Repository-level documents may point into the package; package runtime files must not depend on repository-level instructions.
- On Windows, if a documented `python3 ...` command is unavailable, rerun the same command with `python`.
- Sponsor information is optional reference material. Read the matching [`SPONSORS.md`](SPONSORS.md) or [`SPONSORS_CN.md`](SPONSORS_CN.md) only when the user explicitly requests a model, AI image model, API/provider, or hosted-service recommendation. Never surface sponsor or model recommendations proactively during normal generation, troubleshooting, or quality review.
