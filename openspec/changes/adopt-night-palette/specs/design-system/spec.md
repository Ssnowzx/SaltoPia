## MODIFIED Requirements

### Requirement: Palette tokens

The system SHALL expose the palette as named CSS custom properties. Components MUST
reference tokens, never literal colour values. Each token carries a fixed semantic role, and
that role MUST NOT vary by surface.

| Token | Value | Role |
| --- | --- | --- |
| `--color-night` | `#1F2346` | Primary: filled buttons, links and script headings on pale surfaces, deep surfaces |
| `--color-wine` | `#7B2D3F` | Accent: a primary button's hover, script accents, offers, ribbons |
| `--color-gold` | `#D9BF86` | Champagne: map pins, highlights, text and buttons on dark surfaces |
| `--color-mist` | `#F6EFE2` | Card and panel surface |
| `--color-straw` | `#EFE4D0` | Page background |
| `--color-lake` | `#5B93AD` | Secondary accent, tinted headers |
| `--color-bark` | `#2F2A24` | Body text |
| `--color-frost` | `#9FB8C8` | Cold/altitude accent, the postcard's sky |

Place colours are content, not tokens. They are governed by the place-pages capability.

No saturated token SHALL reproduce a signature colour of the reference site. A token with
an OKLab chroma above 0.04 SHALL stand at least 0.08 (OKLab) from each of the reference's
orange-red, coral, deep green, teal, mint and mustard. The paper neutrals are exempt: every
off-white sits near some cream.

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

#### Scenario: Palette checked against the reference
- **WHEN** the palette tokens are checked
- **THEN** every token with a chroma above 0.04 stands at least 0.08 from each of the
  reference's signature colours

#### Scenario: No retired colour left in the interface
- **WHEN** the interface's source is searched for the retired teal and araucária tokens
- **THEN** none is found
