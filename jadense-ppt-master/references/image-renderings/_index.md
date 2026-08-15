# Renderings — Index

A **rendering** is a visual style family: line quality, texture, depth, material, mood. Lock one rendering per deck — every AI image in the deck shares it.

> **HEX values are not in renderings.** Rendering describes how the image is drawn. The new flow starts from the deck's core color anchors in `spec_lock.md colors` and interprets them with the Design Spec/image context; it does not ask for or author a separate image palette. See [`image-generator.md`](../image-generator.md) §2.

> **Core deck identity has precedence.** Any sample HEX inside an individual rendering file is illustrative legacy prose. Prompt assembly replaces identity roles with the current deck anchors, then may derive coherent tints, light/shadow transitions, material colors, and atmospheric hues from the rendering and image context. Do not replace the deck identity with an unrelated palette. When one derived tone becomes a reusable semantic role across images/pages, promote it to a named lock row.

> **Jadense 学术图片门**：学术报告默认 `image_usage: none`；存在用户提供的论文图、实验图、装置图、现场图或院校资产时优先 `provided`。只有用户明确要求 AI 概念示意，且该示意不能由原生形状、图表、表格或公式更准确表达时，才启用 `ai` 并解析 rendering。默认不生成装饰图。
>
> AI 图片不能冒充实验结果、显微图、临床影像、遥感观测、历史现场、受试者照片或任何真实性证据。允许的概念示意必须在页面或图注明确标注“AI 生成概念示意”。学术自动 rendering 只限 `minimalist-swiss`、`editorial`、`blueprint`；其余 rendering 保留，但必须由用户显式点名或明确要求相应艺术/商业表现。

---

## 1. Catalog (20 renderings)

Each rendering keeps its own authoritative file with: style paragraph, line / texture / depth notes, deck HEX usage, and a fewshot prompt snippet. Read this index alone while choosing a direction. Only after a preset or custom bases are fixed may the active role read the selected sibling files: one file for a preset, every exact `image_rendering_references` file for a catalog-based custom, and none for a novel custom. Never glob the directory or read an unselected sibling. Whether AI imagery is recommended remains a separate source decision; Image_Generator follows the same selected-only rule.

### 1.1 Modern / commercial (the corporate-PPT main field)

| Rendering | One-liner | Best for |
|---|---|---|
| [`vector-illustration`](./vector-illustration.md) | Clean flat vector with bold shapes, no gradients | Consulting / SaaS / general professional decks |
| [`flat`](./flat.md) | Modern geometric blocks, slightly more design-forward than vector | Brand / product showcase decks |
| [`minimalist-swiss`](./minimalist-swiss.md) | Swiss-grid Bauhaus austerity, aggressive whitespace | High-end consulting / architecture / luxury / type foundries |
| [`glassmorphism`](./glassmorphism.md) | Frosted-glass translucent panels, soft shadows | Modern SaaS / fintech / health-tech / premium apps |
| [`3d-isometric`](./3d-isometric.md) | Isometric 3D forms with subtle shadows | Tech architecture / product structure |
| [`digital-dashboard`](./digital-dashboard.md) | Polished UI / data-viz aesthetic | SaaS demos / data products |
| [`corporate-photo`](./corporate-photo.md) | Editorial photography, real subjects | Team / lifestyle / product shots |
| [`blueprint`](./blueprint.md) | Technical schematic with grid, monospace cues | Architecture / engineering / AI systems |
| [`editorial`](./editorial.md) | Magazine-style infographic look | Finance / journalism / explainers |

### 1.2 Hand-drawn / educational

| Rendering | One-liner | Best for |
|---|---|---|
| [`sketch-notes`](./sketch-notes.md) | Warm cream paper, black hand-drawn lines, pastel fills | Education / training / onboarding |
| [`ink-notes`](./ink-notes.md) | Pure white, black ink, sparse semantic color | Methodology / Before-After / manifestos |
| [`chalkboard`](./chalkboard.md) | Chalk on board, classroom feel | Teaching / tutorials / classroom decks |
| [`paper-cut`](./paper-cut.md) | Layered paper craft, scissor-cut edges, soft shadows | Education / children / cultural / festival / sustainability |

### 1.3 Narrative / atmospheric

| Rendering | One-liner | Best for |
|---|---|---|
| [`watercolor`](./watercolor.md) | Painterly soft edges, color bleeding | Lifestyle / travel / brand story |
| [`warm-scene`](./warm-scene.md) | Golden-hour cinematic warmth | Personal growth / origin story |
| [`screen-print`](./screen-print.md) | Halftone poster art, 2-5 flat colors | Cultural / media / cinematic covers |
| [`vintage-poster`](./vintage-poster.md) | Mid-century modern poster, halftone + paper grain | Cultural / brand heritage / hospitality / anniversaries |

### 1.4 Specialty

| Rendering | One-liner | Best for |
|---|---|---|
| [`fantasy-animation`](./fantasy-animation.md) | Ghibli/Disney hand-drawn warmth | Children / storybook / brand fable |
| [`pixel-art`](./pixel-art.md) | 8-bit retro game aesthetic | Gaming / retro tech / nostalgic |
| [`nature`](./nature.md) | Organic earthy illustration | Environment / wellness / sustainability |

### 1.5 Escape hatch — `custom`

Every coordinated Stage-2 direction carries one complete `rendering: custom` candidate even when `recommend.image_usage` does not include `ai`. The UI keeps rendering controls hidden until the current source selection includes AI, then exposes the three already-authored project candidates without another backend recommendation. The 20 fixed renderings remain lower-level single-select alternatives. A template-backed proposal must honor inherited identity and the confirmed template-application plan.

**Hard rule — `rendering_behavior` prose**:

| Rule | Value |
|---|---|
| Length | One paragraph, 2-5 sentences |
| Axes covered | line / texture / depth / material / mood (same as preset files) |
| Catalog basis | Freeze every exact id from this index, then read only those named files before synthesis |

```yaml
- image_rendering: custom
- image_rendering_behavior: "Hand-screened poster aesthetic — slightly misregistered halftone overlays, 3 flat ink colors with visible dot pattern at 12% opacity, no gradients, no anti-aliased edges; reads as silkscreen print."
```

**Hard rule**: three complete rendering candidates remain mandatory in every fresh Stage-2 direction set for UI/schema compatibility, but they are dormant and hidden while `image_usage` is `none` or `provided`. Candidate presence must never cause AI acquisition. For academic work, those dormant candidates stay formal and evidence-safe; AI source recommendation remains independent. See [`strategist-image.md`](../strategist-image.md) for the Stage-2 carrier and downstream lock behavior.

Write `image_rendering_references` only when the confirmed custom direction actually uses catalog material. A custom may use zero, one, or many renderings: keep one when it owns the whole specialized treatment, or include every rendering that contributes a distinct executable job across line, texture, depth, material, or mood. Reference count has no fixed cap; count is an outcome, not a target. A four-basis direction may assign `vector-illustration` to silhouette clarity, `minimalist-swiss` to negative-space composition, `screen-print` to restrained halftone texture, and `warm-scene` to light and mood; list all four ids. Omit every rendering whose contribution cannot be stated and never add a second merely to imply synthesis. A genuinely new rendering with no catalog source omits the field and proceeds from its standalone behavior; never invent a reference merely to legitimize `custom`.

---

## 2. 学术显式启用 AI 后的选择表 — `design_spec` → rendering

仅当已确认的 `image_usage` 包含 `ai` 时，才匹配 `design_spec.md` 的 mode + `visual_style`。首个命中生效；无行命中时使用 §1.5 的正式 `custom`，不得强配商业或艺术 rendering。未启用 AI 时跳过本表。

| 学术视觉 / 图像任务 | 推荐 rendering | 可选替代 |
|---|---|---|
| `swiss-minimal`；抽象研究对象、变量关系、简单机制 | `minimalist-swiss` | `editorial` |
| `editorial` / `data-journalism`；文献关系、信息图式概念解释 | `editorial` | `minimalist-swiss` |
| `blueprint`；工程系统、装置、技术路线或模块关系 | `blueprint` | `minimalist-swiss` |
| 无明确匹配，但用户坚持 AI 概念图 | `custom`，以白/暖白、海军蓝、冷灰、青蓝和无装饰为约束 | `minimalist-swiss` |

商业、摄影、3D、玻璃拟态、手绘、怀旧、幻想和氛围类 rendering 仅保留给用户显式选择。诸如“AI 研究”“前沿技术”“中国文化”或“更有艺术感”的含混描述，不得自动触发 `3d-isometric`、`digital-dashboard`、`ink-wash`、`watercolor` 等风格；需要用户清楚确认具体表现。

---

## 3. How to use

1. From `design_spec.md` extract `d. Style` mode + descriptor.
2. Find the matching row above; pick the primary recommendation.
3. For a preset, read `image-renderings/<chosen>.md`. For `custom`, read every file named in `image_rendering_references`, then synthesize them under the confirmed behavior; with no references, use the novel behavior directly. Apply the result when assembling prompts per [`image-generator.md`](../image-generator.md) §4.

**Lock for the whole deck.** Don't change rendering between images in the same deck.
