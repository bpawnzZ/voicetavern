# Design

## Reuse the existing editor

`PromptManager` already owns add/import/enable/position/delete/edit against the store, and the
settings modal already mounts it. The library tab mounts the same component — one editor, two
doors. A copy would drift the moment either side changes.

## Drag ordering

`@dnd-kit/core` + `@dnd-kit/sortable` are already dependencies and already used twice in
`LibrarySidebar` (`rectSortingStrategy` for cards, `verticalListSortingStrategy` for rows).
Prompts use the same vertical strategy inside their own `DndContext`, because the library's
context wraps a different `SortableContext` in a different subtree.

A dedicated drag handle is used rather than making the whole card draggable: the card contains
inputs and textareas, and whole-card dragging would swallow text selection on touch.

Arrows are kept. They are the only reorder path for keyboard users and are exact for a
one-slot nudge; drag is the coarse gesture.

## Position badge

The ordinal is rendered from the array index. It is derived state, not stored — storing it
would allow duplicates and require renumbering on every mutation.
