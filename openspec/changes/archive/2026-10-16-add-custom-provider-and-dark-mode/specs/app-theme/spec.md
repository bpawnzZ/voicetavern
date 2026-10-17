# Spec Delta

## Purpose

Lets the operator choose a dark appearance, or follow the operating system, with the
choice remembered across launches.

## ADDED Requirements

### Requirement: Theme can be switched to dark and back

The UI SHALL provide a toggle in the header that switches every surface between the light
and dark palettes.

#### Scenario: Toggle applies the dark palette immediately

- **WHEN** the user clicks the theme toggle
- **THEN** backgrounds, panels, borders and text switch to the dark palette without a reload

#### Scenario: Toggle returns to light

- **WHEN** the user clicks the toggle again while in dark mode
- **THEN** the light palette is restored

### Requirement: Theme choice persists across launches

The selected theme SHALL be stored and applied on startup before the first paint.

#### Scenario: Reopening in dark

- **WHEN** the app is reopened after choosing dark
- **THEN** it starts dark, with no flash of the light palette

#### Scenario: First launch follows the OS

- **WHEN** no choice has been stored and the OS reports a dark appearance
- **THEN** the app starts dark

### Requirement: Dark palette keeps content readable

Text and controls SHALL remain legible against dark surfaces, and no light panels SHALL
remain to hide labels.

#### Scenario: Chat, sidebar and settings are readable in dark

- **WHEN** dark mode is active
- **THEN** the chat area, library sidebar and settings modal all render dark surfaces with light text
