## Purpose

Defines the card that invites the visitor to the ambassador contest when they open the
site: where and when it appears, how it goes away, and what it may never cover.

## ADDED Requirements

### Requirement: Invitation once per session

The invitation SHALL appear once per browser session, on the first page the visitor opens
where it is allowed:
- on the hub, once the title state has been left and the world has been drawn;
- on any content page other than the contest page, shortly after the page opens.

It SHALL NOT appear on the contest page. It SHALL NOT appear again in the same session once
it has been shown. When the page's address carries `convite`, it SHALL appear regardless of
the session.

#### Scenario: First visit to the hub
- **WHEN** a visitor in a new session enters the world from the title state
- **THEN** the invitation appears over the map

#### Scenario: Second page in the same session
- **WHEN** the invitation has already been shown in this session and the visitor opens
  another page
- **THEN** it does not appear

#### Scenario: Contest page
- **WHEN** a visitor in a new session opens `/embaixador` first
- **THEN** the invitation does not appear

#### Scenario: Forced for a demonstration
- **WHEN** a page is opened with `?convite` in its address
- **THEN** the invitation appears even if it was already shown in this session

### Requirement: The invitation never covers what the visitor is using

The invitation SHALL NOT appear while the hub's title state is on screen, while a place
card is open, or while the visitor is creating their walking character. If one of those
begins before the invitation has appeared, it SHALL wait rather than cover it.

#### Scenario: Visitor opens a place first
- **WHEN** the visitor opens a place card before the invitation has appeared
- **THEN** the invitation does not appear over the card

### Requirement: Invitation content and dismissal

The invitation SHALL show the contest's wordmark, a greeting, a headline, one sentence of
invitation and a line saying the contest is fictional. Its primary action SHALL navigate to
`/embaixador`. It SHALL close with its secondary action, with a close button, with the
Escape key and with a click outside it. While it is open, focus SHALL stay inside it and the
page behind SHALL NOT scroll. On closing, focus SHALL return to where it was.

Under reduced motion it SHALL appear without animation.

#### Scenario: Visitor accepts
- **WHEN** the visitor activates "Quero me candidatar"
- **THEN** the application navigates to `/embaixador`

#### Scenario: Visitor declines with the keyboard
- **WHEN** the invitation is open and the visitor presses Escape
- **THEN** it closes and the page is usable as before
