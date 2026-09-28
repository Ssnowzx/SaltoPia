# Saltopia — documentation

The documentation is organised by software-engineering discipline. Each document follows
a recognised standard or template, named in the table.

```
docs/
├── requirements/     what the system must do, and why
├── architecture/     how it is built, and the decisions behind it
├── testing/          how it is verified
├── manual/           manuals for visitors, partners and operators (Portuguese)
├── image-prompts.md  content production: the photographic briefs
└── grok/             content production: generating missing photographs
```

## Requirements

| Document | Standard / template | Contents |
| --- | --- | --- |
| [Vision and Scope](requirements/vision.md) | Wiegers, *Software Requirements* (Vision and Scope) | Background, opportunity, objectives, success metrics, vision statement, risks, **idea validation** (hypotheses and experiments), scope by release, stakeholders, principles |
| [Software Requirements Specification](requirements/srs.md) | ISO/IEC/IEEE 29148:2018 | 64 functional requirements (FR) traced to OpenSpec specs, 15 non-functional requirements (NFR, ISO/IEC 25010 categories), constraints, interfaces, glossary |
| [Traceability Matrix](requirements/traceability.md) | ISO/IEC/IEEE 29148 §5.2.8 | Every FR/NFR back to its need and spec, and forward to its verification |

## Architecture

| Document | Standard / template | Contents |
| --- | --- | --- |
| [Architecture description](architecture/README.md) | arc42 (v8), C4 model diagrams | Goals, constraints, context (C4-1), containers (C4-2), runtime sequences, deployment, crosscutting concepts, quality, risks |
| [Architecture Decision Records](architecture/decisions/README.md) | ADR, Nygard format | 14 decisions: context, decision, consequences |
| [Data model](architecture/data-model.md) | ER diagram and data dictionary | Tables, columns, constraints, domain types, content sources, browser storage, invariants, the path to a product's model |
| [Building blocks](architecture/building-blocks.md) | arc42 §5 detail | The world's modules and their order, the rules that cost the most, the checks, the pages |

## Testing

| Document | Standard / template | Contents |
| --- | --- | --- |
| [Test plan and completion report](testing/test-plan.md) | ISO/IEC/IEEE 29119-3 (condensed) | Scope, levels, criteria, environment, results (83 tests, coverage), risks |

## Manuals (Portuguese)

| Document | For |
| --- | --- |
| [Manual do visitante](manual/manual-do-visitante.md) | Anyone using the site: the map, the pages, walk mode, the contest, accessibility, privacy |
| [Manual do parceiro](manual/manual-do-parceiro.md) | Partner establishments: what they get, exactly what to send, photo rules, offers, the contest |
| [Manual de instalação e operação](manual/manual-de-instalacao.md) | Whoever installs, runs, updates content or presents it: installation, operation, troubleshooting, deployment |

## Process and project

| Document | Standard / template |
| --- | --- |
| [`../README.md`](../README.md) | Installation, commands, overview |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Workflow: OpenSpec, code rules, tests, Conventional Commits |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Keep a Changelog 1.1, Semantic Versioning |
| [`../CLAUDE.md`](../CLAUDE.md) | The project's working rules and local traps (Portuguese) |
| [`../openspec/`](../openspec/) | Spec-driven change records: proposal, specs (SHALL/MUST + WHEN/THEN scenarios), design, tasks |

## Where to start

| If you want to know… | Read |
| --- | --- |
| Why Saltopia exists | `requirements/vision.md` |
| What it must do | `requirements/srs.md` |
| How it is built | `architecture/README.md`, then `data-model.md` |
| Whether it works | `testing/test-plan.md` §9 |
