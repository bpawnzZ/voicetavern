# Spec Delta

## ADDED Requirements

### Requirement: Prompts are editable from the library panel

The library panel SHALL offer a Prompts view alongside the character and world book views,
containing the same prompt editing the settings panel offers.

#### Scenario: Prompts tab is reachable

- **WHEN** the user opens the library panel
- **THEN** a Prompts tab is available next to the library and sessions tabs
- **AND** selecting it shows the main prompt, the prompt blocks, and the add/import actions

#### Scenario: Edits are shared with the settings panel

- **WHEN** a prompt is added, edited or reordered from the library
- **THEN** the settings panel shows the same state, because both read one store collection

### Requirement: Prompt order can be set by dragging

Prompt blocks SHALL be reorderable by dragging, using the same drag mechanism as the
character and world book lists, and the new order SHALL persist.

#### Scenario: Dragging a prompt reorders the stack

- **WHEN** the user drags a prompt block to a new position in the list
- **THEN** the stored order changes to match
- **AND** the assembled prompt on the next connection follows the new order

#### Scenario: Arrow buttons still work

- **WHEN** the user presses a block's move-up or move-down button
- **THEN** it swaps with its neighbour and the order persists

#### Scenario: Order survives a reload

- **WHEN** the app is closed and reopened
- **THEN** the prompt order is the order the user left it in

### Requirement: The stack position of each prompt is visible

Each prompt block SHALL display its ordinal position in the stack.

#### Scenario: Positions are numbered

- **WHEN** three prompts exist
- **THEN** they are numbered 1, 2 and 3 in the order they will be assembled
- **AND** reordering renumbers them immediately
