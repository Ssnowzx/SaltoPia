## Purpose

Defines the people of the community - who they are, where they walk or stand, how they move
and how they meet the visitor - so the world reads as inhabited rather than furnished.

## ADDED Requirements

### Requirement: Townsfolk are people like the visitor's character

The community's people SHALL be drawn with the same people as walk mode's characters,
varied in who they are, their outfit colour and their skin tone, and animated. No figure
built of plain boxes and spheres SHALL stand in the world.

#### Scenario: Visitor walks past a townsperson
- **WHEN** the visitor, walking, comes near any townsperson
- **THEN** that townsperson is a fully modelled, animated person like the visitor's own character

### Requirement: Townsfolk move about the community

Some townsfolk SHALL stroll along routes - round the square, along the pavements, down the
fairground's midway - with a walking animation matched to their pace, pausing where their
way ends before turning back. The others SHALL stand, idle, and from time to time gesture.

Every route and every standing place MUST lie on ground a walker is allowed on: never in the
water, inside a building or across a prop. A townsperson SHALL stand on the surface it is
over - the square's paving, a pavement, a road - as the visitor's character does, never
sunk into it.

#### Scenario: Townsperson on a pavement
- **WHEN** a townsperson strolls along a pavement
- **THEN** its feet are on the pavement's surface, not in it

#### Scenario: Watching the square
- **WHEN** the visitor watches the square for half a minute
- **THEN** at least one townsperson walks round it and at least one stands talking or gesturing

#### Scenario: Routes checked
- **WHEN** the townsfolk's routes and places are checked against the walk world
- **THEN** every point on them is walkable

### Requirement: Townsfolk notice the visitor

In walk mode, a townsperson the visitor comes within a couple of metres of SHALL stop, turn
to the visitor and wave, and SHALL go on its way once the visitor has moved off. The visitor
MUST NOT walk through a townsperson.

#### Scenario: Visitor approaches a stroller
- **WHEN** the visitor walks up to a strolling townsperson
- **THEN** it stops, faces the visitor and waves
- **AND** the visitor's character is held outside it

### Requirement: Townsfolk honour reduced motion

Under reduced motion the townsfolk SHALL stand where they are, idle, rather than stroll.

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** no townsperson walks a route

### Requirement: Townsfolk arrive after the world

The townsfolk's models SHALL be requested only after the world has been drawn, so that the
first frame of the hub never waits on a download. A model that cannot be downloaded SHALL
leave its townsfolk out and MUST NOT stop the hub from working.

#### Scenario: Hub first drawn
- **WHEN** the world is drawn for the first time
- **THEN** no character model had been requested before it

#### Scenario: A model fails to download
- **WHEN** the townsfolk's models cannot be downloaded
- **THEN** the hub goes on working without them
