# Architecture Decision Records

The decisions that shape Saltopia's architecture, in Michael Nygard's format (see
[ADR-0001](0001-record-architecture-decisions.md)). Numbers are never reused. A replaced
decision is marked *Superseded by* and kept.

| ADR | Decision | Status | Date |
| --- | --- | --- | --- |
| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-09-28 |
| [ADR-0002](0002-generate-the-world-in-code.md) | Generate the 3D world in code, not load a pre-built model | Accepted | 2026-09-14 |
| [ADR-0003](0003-pins-as-projected-html.md) | Render map pins as projected HTML | Accepted | 2026-09-14 |
| [ADR-0004](0004-full-document-navigation.md) | Navigate with full documents and a cross-document view transition | Accepted | 2026-09-15 |
| [ADR-0005](0005-data-layer-over-mariadb.md) | Keep MariaDB behind a single data layer | Accepted | 2026-09-14 |
| [ADR-0006](0006-content-as-typed-modules.md) | Keep content as typed modules and seed it | Accepted | 2026-09-28 |
| [ADR-0007](0007-menu-off-the-place-type.md) | Keep the menu off the Place type | Accepted | 2026-09-28 |
| [ADR-0008](0008-asset-paths-are-promises.md) | Treat an asset path as a promise, and draw a stand-in | Accepted | 2026-09-28 |
| [ADR-0009](0009-spec-driven-development.md) | Develop spec first, with OpenSpec | Accepted | 2026-09-14 |
| [ADR-0010](0010-night-palette-and-colour-distance.md) | Use the night palette, guarded by a distance test | Accepted | 2026-09-28 |
| [ADR-0011](0011-scroll-motion-in-css.md) | Tie scroll motion to CSS, not to a scroll library | Accepted | 2026-09-28 |
| [ADR-0012](0012-photographs-from-briefs.md) | Generate photographs from briefs through a manifest | Accepted | 2026-09-28 |
| [ADR-0013](0013-quality-tiers-step-down.md) | Adapt quality in tiers that only step down | Accepted | 2026-09-24 |
| [ADR-0014](0014-walk-heights-from-drawn-geometry.md) | Take walking heights from the drawn geometry | Accepted | 2026-09-24 |
| [ADR-0015](0015-trees-at-two-levels-of-detail.md) | Draw distant trees in a simpler form of themselves | Accepted | 2026-10-07 |

To add one, copy the structure of an existing record: title, status, date, context,
decision, consequences. Then link it from the design section it came from.
