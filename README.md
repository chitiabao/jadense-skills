# Jadense Skills

**Provider-neutral scholarly literature search skill for agents and applications.**

**面向代理和应用程序的提供者中立学术文献搜索技能。**

[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📦 Skill / 技能包

### [jadense-scholar-search](./jadense-scholar-search/)

Search scholarly literature across arXiv, OpenAlex, Crossref, PubMed, Semantic Scholar, and optional Google Scholar through a unified interface.

通过统一接口搜索 arXiv、OpenAlex、Crossref、PubMed、Semantic Scholar 和可选的 Google Scholar 学术文献。

**Features / 功能特点：**
- Six providers, one interface / 六个提供者，一个接口
- Cross-source deduplication / 跨源去重
- Weighted ranking and relevance scoring / 加权排名和相关性评分
- Abstract enrichment / 摘要增强
- Bilingual HTML delivery (Chinese + English) / 双语 HTML 交付（中英双语）
- CLI + library API / 命令行 + 库 API

[![Documentation](https://img.shields.io/badge/docs-README-blue)](./jadense-scholar-search/README.md)
[![Skill](https://img.shields.io/badge/skill-SKILL.md-green)](./jadense-scholar-search/SKILL.md)

---

## 🚀 Quick Start / 快速开始

### Installation / 安装

```bash
cd jadense-scholar-search
npm install
```

### Usage / 使用

```bash
# Offline mode / 离线模式
node dist/bin/scholar-search.mjs --offline --query "transformer interpretability"

# Live search / 实时搜索
node dist/bin/scholar-search.mjs \
  --query "retrieval augmented generation" \
  --provider openalex --provider crossref \
  --from 2020-01-01 --to 2025-12-31 \
  --format markdown
```

---

## 📖 Documentation / 文档

- [README.md](./jadense-scholar-search/README.md) - Comprehensive usage guide / 全面使用指南
- [SKILL.md](./jadense-scholar-search/SKILL.md) - Agent-facing instructions / 代理面向的说明
- [SECURITY.md](./jadense-scholar-search/SECURITY.md) - Security policy / 安全策略

---

## 📄 License / 许可证

MIT - see [LICENSE](LICENSE)