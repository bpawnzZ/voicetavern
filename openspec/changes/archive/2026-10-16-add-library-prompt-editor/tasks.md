# Tasks

## 1. Library tab

- [x] 1.1 Add `prompts` to the library panel's tab union and render a third tab button
- [x] 1.2 Render `PromptManager` in that tab (same component the settings modal uses)

## 2. Ordering

- [x] 2.1 Wrap prompt blocks in `DndContext` + `SortableContext` (vertical strategy)
- [x] 2.2 Per-block `useSortable` with a dedicated grip handle, `arrayMove` on drop
- [x] 2.3 Keep the up/down buttons as the keyboard/precision path
- [x] 2.4 Show the 1-based ordinal on each block, derived from the array index

## 3. Layout for a narrow panel

- [x] 3.1 Two-row card header: grip, ordinal, enable, name, delete / then position + arrows
- [x] 3.2 Confirm it renders in the 320 px sidebar without horizontal overflow

## 4. Verify

- [x] 4.1 `npx tsc -b` and `npm run build` pass
- [x] 4.2 Browser: Prompts tab lists blocks, add creates one, reorder changes stored order
- [x] 4.3 Order persists across a reload
- [x] 4.4 Built in CI (run 38998107390): 3,131,484 bytes, arm64 Mach-O, no _CodeSignature; released as v1.0.11-ios
