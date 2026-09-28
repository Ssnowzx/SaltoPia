## MODIFIED Requirements

### Requirement: Palette tokens

The system SHALL expose the palette as named CSS custom properties. Components MUST
reference tokens, never literal colour values. Each token carries a fixed semantic role, and
that role MUST NOT vary by surface.

| Token | Value | Role |
| --- | --- | --- |
| `--color-teal` | `#1F6068` | Primary accent: links, script headings, glyphs |
| `--color-teal-deep` | `#174C53` | Filled button background |
| `--color-teal-dark` | `#113A40` | Filled button hover/active |
| `--color-gold` | `#E2B04A` | Map pins, highlights, the sun's colour in the interface |
| `--color-mist` | `#F6EFE2` | Card and panel surface |
| `--color-straw` | `#EFE4D0` | Page background, marquee band |
| `--color-lake` | `#5B93AD` | Secondary accent, tinted headers |
| `--color-araucaria` | `#24443A` | Deep surface on the hub, display headings |
| `--color-bark` | `#2F2A24` | Body text |
| `--color-frost` | `#9FB8C8` | Cold/altitude accent, the postcard's sky |
| `--color-wine` | `#7B2D3F` | Rare emphasis, high-altitude wine motif, the contest's ribbon |
| `--color-night` | `#1F2346` | Deep surface of the content pages: footer, the contest's dark bands |

Place colours are content, not tokens. They are governed by the place-pages capability.

#### Scenario: Component requests a brand colour
- **WHEN** a component needs any brand colour
- **THEN** it resolves it through a `--color-*` custom property
- **AND** no literal hex value for a brand colour appears outside the token definition file

#### Scenario: Text contrast on every defined pairing
- **WHEN** a token pairing defined by this system places text over a background
- **THEN** the pairing meets WCAG 2.1 AA contrast - at least 4.5:1 for body text and 3:1 for
  text at 24px or larger, or 19px or larger when bold

#### Scenario: Night surface
- **WHEN** text in `--color-mist` or `--color-gold` is set on `--color-night`
- **THEN** the pairing reaches at least 4.5:1
