# Saltopia — Vision and Scope

| | |
| --- | --- |
| Document | Vision and Scope, following Wiegers' template (*Software Requirements*, 3rd ed.) |
| Product | Saltopia |
| Version | 1.0, 2026-09-28 |
| Status | Baselined for the academic release |
| Related | [`srs.md`](srs.md) (requirements) · [`../architecture/README.md`](../architecture/README.md) · [`../architecture/data-model.md`](../architecture/data-model.md) |

Saltopia began as the final project of the fifth-semester Systems Engineering course
(*Engenharia de Sistemas*) and is meant to become a product. This document states why it exists, who it serves, and what is in and out of
scope. The requirements themselves are in the SRS.

---

## 1. Business requirements

### 1.1 Background

Small tourist communities in the Serra Catarinense have what visitors travel for: the
landscape, the food, the farms, the festivals. What they lack is a way to be *seen as a
place*. A traveller who looks up the Salto do Rio Caveiras, outside Lages, finds
scattered listings:
- a restaurant on one map app;
- a farm on a social profile;
- an inn on a booking site.

Each is on its own, and none gives a sense of what it would be like to spend a weekend
there.

### 1.2 Business opportunity

The establishments have the same problem the other way round. Each pays to be listed
somewhere, alone, and nothing presents them as part of one destination.

A destination that can be explored before arriving would serve both sides:
- visitors get a reason to choose the place;
- establishments get presence inside something larger than their own listing.

`visitmeatopia.com` showed that a 3D map you can fly over holds attention far better
than a list. Saltopia adapts that interaction model to a real landscape and copies none of
its content (see principle P3).

### 1.3 Business objectives

| ID | Objective |
| --- | --- |
| BO-1 | Present the whole community as one destination that a visitor can explore before arriving. |
| BO-2 | Give every partner establishment a presence (pin, card, page, menu) that it could not build alone. |
| BO-3 | Bring visitors' own posts into the promotion of the destination (the ambassador contest). |
| BO-4 | Reach a model that can be offered to partners as a paid product. |

### 1.4 Success metrics

These cannot be measured until analytics exists (see §2.3). They are recorded now so the
product is built to be measured.

| ID | Metric | Target once measured |
| --- | --- | --- |
| SM-1 | Share of hub visits that open at least one place page | ≥ 40% |
| SM-2 | Share of place-page visits that reach the menu | ≥ 60% |
| SM-3 | Partner establishments with a complete page (menu of 6+ items, gallery of 6) | 100% |
| SM-4 | Visitors who can reach every destination with reduced motion enabled | 100% (a requirement, not a goal) |

### 1.5 Vision statement

**For** travellers deciding where to spend a weekend in the Serra Catarinense, **who** find
only scattered listings, **Saltopia** is an explorable 3D destination **that** shows the
whole community, from its landscape to each establishment's table, before the trip.
**Unlike** directories and map apps, it presents the place first and the listings inside
it. For the establishments, it is a presence that none of them could build alone.

### 1.6 Business risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| BR-1 | Reads as a copy of the reference site | No asset, text, name or colour is copied, and tests enforce the colour distance (§3.4, P3) |
| BR-2 | The 3D hub fails on the visitor's machine | Generated world with no downloads; quality tiers; a no-WebGL fallback is required (not yet built, see SRS NFR-11) |
| BR-3 | Partners do not keep their content current | A partner panel is the first product step (§2.3) |
| BR-4 | A real contest collects personal data | Nothing is collected today; a real contest needs LGPD consent designed with it (§2.4) |

### 1.7 Assumptions and dependencies

- **Photographs:** the page photographs can be produced by generation (Grok) from written
  briefs until partners supply their own.
- **Browsers:** visitors use a browser with WebGL2. The fallback covers the rest once it
  is built.
- **Deployment:** it will be a VPS, configured through `.env` only, with no code changes.

### 1.8 Idea validation

The idea rests on hypotheses. What has been validated so far is that it can be built, not
that the market wants it. This section keeps the two apart.

| ID | Hypothesis | Evidence today | How it will be validated | Validated when |
| --- | --- | --- | --- | --- |
| H1 | An explorable map makes a destination more attractive than a list of establishments | The interaction model it adapts, `visitmeatopia.com`, received an Awwwards Honourable Mention in August 2026. That is evidence of design quality, not yet of tourists' choices | **E1**, usability sessions | 4 of 5 participants prefer it to a listing site for choosing where to go |
| H2 | Visitors can find what matters to them (a place's food, what to do) without help | The prototype implements every flow (SRS FR-01 to FR-64) | **E1** | 4 of 5 complete each task unaided, including with reduced motion enabled |
| H3 | Establishments would supply content and pay for presence | None yet | **E2**, interviews with establishments near the Salto do Rio Caveiras | 3 of 5 would send their menu and photographs; 2 of 5 would pay a monthly fee |
| H4 | A contest brings visitors' own posts into the promotion | None yet | **E3**, a pilot with one partner after deployment | ≥ 20 posts with the hashtag in the campaign period |
| H5 | It can be built with a small team, run on untested hardware and grow into a product | **Validated.** Working prototype, 83 automated tests, generated world with zero 3D payload, data layer ready to be replaced | — | — |

**Experiments**

- **E1, usability.** Five participants, think-aloud, about 20 minutes each, on a laptop and
  a phone. The tasks:
  1. choose a place for dinner and find its menu;
  2. find something to do on a Saturday and how long it takes;
  3. walk from the square to the fairground;
  4. share a place with a friend;
  5. repeat task 1 with reduced motion enabled.

  Measures: completion, time, errors, preference, and the SUS questionnaire.
- **E2, partner interviews.** Five establishments in the region, 30 minutes each,
  semi-structured. The questions: how they are found today, what they pay for it, whether
  they would send the content listed in the partner manual, and at what price a presence
  would be worth it. The partner manual is shown as the offer.
- **E3, contest pilot.** Only after deployment, with the real contest's rules, consent
  (LGPD) and moderation built (FE-10).

Results will be recorded here. Until then H1 to H4 are open.

---

## 2. Scope and limitations

### 2.1 Major features

| ID | Feature |
| --- | --- |
| FE-1 | 3D hub: the community generated in the browser, with pins, fly-to and place cards |
| FE-2 | Place pages built around each place's colour: story, photographed menu, experiences, gallery, share |
| FE-3 | Experience pages and the experiences index |
| FE-4 | Walk mode: a character, the townsfolk, a passport of places visited |
| FE-5 | Ambassador contest page and its once-per-visit invitation |
| FE-6 | Design system: palette, type, motion, reduced-motion contract |
| FE-7 | Content pipeline: typed content modules, seed, photo briefs for generation |
| FE-8 | Partner panel *(later release)* |
| FE-9 | Real business data: hours, contact, prices, booking *(later release)* |
| FE-10 | Real contest, with entries, consent and voting *(later release)* |
| FE-11 | Analytics per partner *(later release)* |

### 2.2 Scope of the initial release (academic, 2026)

FE-1 to FE-7, running locally:
- 15 places, 25 experiences and 135 menu items;
- 268 photographs;
- the contest presented as fictional.

### 2.3 Scope of subsequent releases

In order of what they unlock:
1. FE-8, the partner panel.
2. FE-9, real business data.
3. FE-10, the real contest.
4. FE-11, analytics.
5. A second destination.

The data model changes each one needs are in
[`../architecture/data-model.md`](../architecture/data-model.md), "From assignment to
product". Each is a separate OpenSpec change with its own specs.

### 2.4 Limitations and exclusions

- **Visitor data:** the release collects no data from visitors. It has no forms, no
  accounts and no analytics.
- **Booking and payment:** none. Links out will come with FE-9.
- **Language:** Portuguese only.
- **Establishments:** all of them are imaginary. The landscape is real.

---

## 3. Business context

### 3.1 Stakeholder profiles

| Stakeholder | Major value | Attitudes | Interests | Constraints |
| --- | --- | --- | --- | --- |
| Visitor | Choosing a destination with confidence | Curious, browsing, often on a phone | The feel of the place, food, things to do | Untested devices; may prefer reduced motion |
| Partner establishment | Being found, being part of a destination | Wants results, little time | Its page, its menu, its offer | No technical staff; content arrives late and in pieces |
| Community promoter (tourism office, association) | One image of the destination | Supportive if it is accurate | The whole region presented well | Public-facing accuracy |
| Course evaluators (Engenharia de Sistemas) | Evidence of engineering practice | Critical | Requirements, architecture, traceability, tests, process | Live presentation on an untested machine |
| Development team | A product that can grow | — | Clean data model, specs before code | Small team |

### 3.2 Project priorities

| Dimension | Driver, constraint or degree of freedom |
| --- | --- |
| Quality: accessibility, robustness | **Constraint.** Reduced motion never blocks a destination; nothing breaks on a missing asset. |
| Features | **Degree of freedom.** Features move between releases; the specs define each one. |
| Schedule | **Driver.** The academic presentation date. |
| Originality | **Constraint.** Nothing copied from the reference. |
| Cost | **Degree of freedom.** Free and CC0 tools and assets only. |

### 3.3 Design principles

Every decision recorded in `openspec/` and in the ADRs follows these.

| ID | Principle |
| --- | --- |
| P1 | **The place comes first.** A page is built around its place's colour, words and photographs. |
| P2 | **Photographs, not illustrations, on the pages.** The map is the stylised layer; the pages show what the visitor will find. |
| P3 | **Nothing is a copy.** The reference's architecture and timing are studied; its content and colours are never taken. |
| P4 | **It works on the machine nobody tested.** Generated world, automatic quality, and reduced motion honoured everywhere. |
| P5 | **Calm, not pushy.** One invitation per visit, never over what the visitor is using; no data asked for. |
| P6 | **Content is data.** Words, colours and menus live in content, not in components. |
| P7 | **Every change has a spec.** Behaviour is specified before it is built. |

### 3.4 Deployment considerations

- **Today:** local development, with MariaDB in Docker.
- **Target:** a VPS, with the same application and configuration from environment
  variables.
- **Pages:** statically generated, apart from the contest page, which revalidates hourly
  so its calendar follows the date.
- **The 3D world:** its payload is generated code. The only downloaded models are six CC0
  characters.
