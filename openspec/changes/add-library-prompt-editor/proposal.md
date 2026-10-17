# Add a prompt editor to the library panel

## Why

Auxiliary prompts exist, but the only way to reach them is the settings modal — the
library panel, where character cards and world books are managed, has no prompts tab. That
is backwards: prompts are library content, edited alongside the card they are stacked with,
not connection settings. Ordering is also arrows-only, while every other list in the library
is drag-sortable.

## What changes

- Third tab in the library panel: **Prompts**, rendering the existing prompt editor.
- Prompt blocks become drag-sortable (same `@dnd-kit` pattern as characters and world books),
  with the arrow buttons kept for keyboard/precision use.
- Each block shows its position in the stack, so "which prompt goes first" is answerable at a
  glance instead of inferred from vertical position.

## What does not change

- Assembly order, storage format, store actions, providers, or the settings modal (which keeps
  its copy of the editor).

## Impact

- Capability `prompt-stack`, requirements added.
- No new dependency: `@dnd-kit/core` and `@dnd-kit/sortable` are already used by the library.
- No migration: the same `vt_aux_prompts` array, same ids, same fields.
