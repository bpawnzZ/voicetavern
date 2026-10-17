# prompt-stack Specification

## Purpose
Gives the operator SillyTavern-style control over the text that reaches the model:
editable main prompt, importable auxiliary prompt blocks, and a defined stacking order
together with the character card and world book.

## Requirements

### Requirement: Auxiliary prompts can be added, imported and edited

The settings panel SHALL let the user add prompt blocks, edit their name and content,
enable or disable each one, and import prompts from JSON.

#### Scenario: Adding a prompt

- **WHEN** the user clicks "Add prompt" and types content
- **THEN** the block is stored and included in the assembled prompt on the next connection

#### Scenario: Importing a SillyTavern preset

- **WHEN** the user imports a preset JSON carrying a `prompts` array
- **THEN** each entry becomes a prompt block, with `injection_position: 1` mapping to the after position and `enabled: false` preserved
- **AND** a bare array of prompt objects, or a single `{name, content}` object, also imports

#### Scenario: Invalid import is rejected

- **WHEN** the imported file is not valid JSON
- **THEN** an error message is shown and the existing prompts are unchanged

### Requirement: Prompt blocks have an explicit position and order

Each prompt SHALL carry a position of `before` or `after` and keep a user-controlled
order, and the saved order SHALL survive a reload.

#### Scenario: Order is preserved and applied

- **WHEN** the user reorders prompts and reconnects
- **THEN** the assembled prompt reflects the saved order

#### Scenario: Disabled prompts are excluded

- **WHEN** a prompt's checkbox is cleared
- **THEN** its text does not appear in the assembled prompt

### Requirement: Assembly order is fixed and documented

The assembled system prompt SHALL be: main prompt → `before` prompts → character card
system prompt → world book entries → `after` prompts → post-history instructions → voice
rules, with the voice rules last.

#### Scenario: Sections appear in order

- **WHEN** a prompt is assembled from a card, lore and prompts in both positions
- **THEN** the card follows the `before` prompts and precedes lore, and the `after` prompts follow lore
- **AND** the voice-rule block is the final section

#### Scenario: Placeholders are substituted everywhere

- **WHEN** any block contains `{{char}}`, `{{user}}`, `{{description}}`, `{{personality}}`, `{{scenario}}` or {{'{{system_prompt}}'}}
- **THEN** the placeholder is replaced in that block before assembly

### Requirement: World book keyword entries are activated

Assembly SHALL include world book entries whose keywords match the conversation context,
not only entries marked constant.

#### Scenario: Triggered entry fires

- **WHEN** a world book entry has keys matching the character context or a recent message
- **THEN** its content is included, ordered by insertion order and de-duplicated

#### Scenario: Constant entries always fire

- **WHEN** an entry is marked constant
- **THEN** it is included regardless of keywords
