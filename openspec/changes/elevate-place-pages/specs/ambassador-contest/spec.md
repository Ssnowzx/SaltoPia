## Purpose

Defines the ambassador contest page: an invitation to run for Embaixador de Saltopia,
which explains how to take part, deals campaign ideas, shows the campaign calendar and
the prize, and states plainly that the contest is fictional.

## ADDED Requirements

### Requirement: Contest page anatomy

The contest page SHALL be served at `/embaixador` and SHALL present, in order:
- a hero with the contest's wordmark, its headline and a scene of the community;
- how to take part, with the steps, suggestions of what to post, the contest's hashtag
  and handle, and photographs of people taking part;
- a deck of campaign ideas;
- the campaign calendar;
- the prize;
- a short rulebook;
- the site footer.

Like the place pages, it SHALL scroll normally and MUST NOT render a 3D surface. It SHALL
carry a unique title, description and social preview image.

#### Scenario: Contest page opened
- **WHEN** a visitor opens `/embaixador`
- **THEN** every section is shown in order
- **AND** no WebGL context is created

#### Scenario: Contest page at phone width
- **WHEN** the page is rendered at a viewport 400px wide
- **THEN** every section is readable
- **AND** nothing overflows horizontally

### Requirement: The contest is presented as fictional and collects nothing

The page SHALL state, in the rulebook and in the fine print under how to take part, that
the contest is fictional and part of an academic project. The page MUST NOT contain any
form, upload or field that asks the visitor for anything. It MUST NOT send any request
that carries information from the visitor.

#### Scenario: Visitor reads the rules
- **WHEN** the visitor opens the rulebook
- **THEN** it says the contest is fictional, that no entry is received and that no prize
  is awarded

#### Scenario: Network inspection
- **WHEN** the visitor uses every control on the page
- **THEN** no request that carries visitor input is sent

### Requirement: Idea deck

The idea deck SHALL show one campaign idea at a time on its front card, with two cards
stacked behind it. Activating the deck's control SHALL deal the next idea. The deck SHALL
cycle through every idea before any idea repeats. A newly dealt idea SHALL be announced
to assistive technology. Under reduced motion the new idea SHALL replace the old one
without animation.

#### Scenario: Visitor asks for another idea
- **WHEN** the visitor activates "Outra ideia"
- **THEN** the front card shows a different idea

#### Scenario: Every idea before a repeat
- **WHEN** the visitor keeps asking for another idea
- **THEN** every idea is shown once before the first one comes back

### Requirement: Campaign calendar marks today

The calendar SHALL show the contest's phases in order, each with its dates. It SHALL mark
the phase that contains the current date as the one running now. Between two phases it
SHALL mark the next phase as coming up. After the last phase it SHALL show the contest as
finished. The marking SHALL follow the date on which the page is viewed, not the date on
which it was built, give or take a day.

#### Scenario: During the first phase
- **WHEN** the page is viewed on a date inside the first phase
- **THEN** that phase is marked as running now
- **AND** no other phase is marked as running

#### Scenario: Between two phases
- **WHEN** the page is viewed on a date after the first phase ends and before the second
  begins
- **THEN** the second phase is marked as coming up

#### Scenario: After the contest
- **WHEN** the page is viewed after the last phase has ended
- **THEN** no phase is marked as running
- **AND** the calendar says the contest has finished

### Requirement: The prize names its partners

The prize section SHALL list what the winner receives. Where an item comes from one of
the community's places, it SHALL name that place and link to its page.

#### Scenario: Visitor follows a partner
- **WHEN** the visitor activates a partner's name in the prize section
- **THEN** the application navigates to that place's page

### Requirement: The contest scene respects reduced motion

The moving parts of the page's scenes SHALL hold still when reduced motion is requested,
and every section SHALL remain readable and reachable.

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** no part of the hero scene moves
- **AND** every section and control remains reachable
