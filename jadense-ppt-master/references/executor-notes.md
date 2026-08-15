> See [`executor-base.md`](./executor-base.md) for the always-loaded Executor core.
> Academic decks also retain [`academic-core.md`](./academic-core.md); this
> branch owns the per-page full-source realization described there.

# Executor Speaker-notes Branch

Conditional late-stage authority for generating or validating the complete speaker-notes document.

**Trigger**: Default Generate loads this after the final quality check when the
effective Speaker Notes outcome in `design_spec.md §I` is enabled. Quick
Generate loads it after its final check when the current agent selected notes
or narration in active context. A missing legacy outcome defaults to enabled.
Narration requires notes; when notes are disabled, do not load this branch or
create `notes/total.md`.

## 1. Complete Speaker-notes Document

Write the complete deck to `notes/total.md` in one batch for coherent transitions. Use `# <number>_<page_title>` per page and `---` between pages; only the heading is stripped before TTS.

**Pre-SVG narration branch**: when `notes/total.md` already exists because the
user supplied a final/literal script or Quick is directly delivering narrated
video, validate it instead of regenerating it. Retain every word and segment of
a final/literal script. Agent-authored Quick narration may be repaired only for
final-SVG inconsistency and before audio generation. A `# Slide <number>`
heading remains valid until Generate Step 7.1 resolves the authored roster.

**Pure spoken narration**: `notes_to_audio.py` reads the body verbatim. Write prose only; never add Markdown list/bullet markup, stage markers, key-point labels, duration lines, or other metadata.

**Length follows content**: size natural sentences to semantic burden. Two to five is typical, not a cap; anchor pages may use less and dense pages more. Honor the active Design Spec or Quick context plus source rules. Duration is pacing guidance only: never pad, repeat, compress, or omit meaning to hit it.

### 1.1 Academic sources and evidence language

For an academic deck with ordinary speaker notes and Narration Audio disabled,
append one complete source block after each page's spoken prose:

```markdown
[Sources]
- [S1] 作者/机构. 题名. 期刊/会议/发布方, 年份. DOI 或稳定 URL. 本页支持：<具体论断/图表>。
- [S2] User-supplied: <文件名>, <页码/工作表/区段>. 未独立核验。
[/Sources]
```

Every academic page has the block. A cover/structure/conclusion page with no
external claim records the real basis, for example `本页无外部来源；仅含题目与结构信息`,
`User-supplied`, or `演示数据：非真实研究结果`; never invent a bibliographic item to
avoid an empty list. Include only sources actually used on that page, and make
each entry identify the supported claim/figure/table. The full entry and the
visible short citation must agree.

When Narration Audio is enabled, `notes_to_audio.py` reads the body verbatim, so
do not append a non-spoken `[Sources]` block to its input. Keep the notes pure
spoken prose and preserve complete citations in page-local sources, a
references/appendix page, and project source/provenance artifacts under
`academic-core.md`. Speak an attribution only when it materially changes the
argument; do not read DOI/URL strings aloud.

Academic narration keeps evidence state explicit: say “结果显示” only for
completed supported results; say “演示趋势”“预实验提示”“计划验证” or “作者解释”
when that is the actual status. Do not convert correlation into causation or a
non-significant difference into significance while making prose sound smoother.

## 2. Final-SVG Grounding and Coverage

**Hard rule — the final SVG is the visible page authority**: read every finalized `svg_output/<slide>.svg` in slide order. Use the active plan/context and approved sources; never write from the outline or core message alone.

Before drafting, internally inventory the visible title/subtitle and every information-bearing direct-root `<g id>`; structured placeholder content still counts. Coverage requires its unique claim, evidence, example, relationship, qualifier, or implication—not merely its label—to enter the narration.

For a pre-SVG narration branch, apply the same inventory in reverse: every
independent visible claim or relationship must be supported by its script
segment. Repair the visual page or return to planning for final/literal input;
for agent-authored Quick narration, repair the narration before audio without
inventing unsupported claims. Every spoken idea that requires orientation must
likewise have a visible state or an explicit speech-only role in the active plan.

- Text blocks, comparisons, and processes retain every independent fact or relationship; combine related short groups causally or comparatively.
- Charts, tables, and KPIs state the takeaway, decisive values or trend, comparison basis, implication, and material uncertainty—not every axis, row, or cell.
- Academic charts/tables also retain sample/analysis unit, uncertainty or test
  qualifier, data/demo status, and the limit on inference whenever these change
  the takeaway.
- Quotes retain the decisive clause, material attribution, and relevance. Explain semantic images or text-free diagrams only from the SVG plus locked plan/source; never infer facts from appearance.
- Speak a source or page-local footer only when attribution, uncertainty, or qualification changes the argument. Omit backgrounds, decoration, repeated chrome, page numbers, and fixed Master/Layout atoms.

Form one coherent argument in intended reading/reveal order: proposition → evidence or mechanism → implication or bridge. DOM order need not be speaking order. A sentence may cover related groups and a complex group may need several sentences, but no independent group may disappear to meet a sentence count. Keep the inventory internal: never vocalize IDs, positions, colors, icons, repetitive "this card shows" descriptions, or coverage markers.

## 3. Reading Mode and TTS

| `consumption_mode` | Notes emphasis |
|---|---|
| `text` | Interpret and connect a self-contained page; synthesize every independent SVG information group rather than omitting it. |
| `balanced` | Connect visible claim and evidence, explain the trade-off, and bridge forward. |
| `presentation` | Carry reasoning, context, and supporting detail intentionally omitted from the sparse page. |

Put transitions naturally in the opening sentence when useful; never label them. Keep one language. Spell out digits or symbols when literal TTS would sound wrong (for example, Chinese "百分之六十八" rather than "68%").

After `notes/total.md` is complete, return to Generate Step 7.1; the route authority owns splitting and its success criterion.
