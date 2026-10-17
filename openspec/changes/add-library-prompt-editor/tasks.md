# Tasks

## 1. Library tab

- [ ] 1.1 Add `prompts` to the library panel's tab union and render a third tab button
- [ ] 1.2 Render `PromptManager` in that tab (same component the settings modal uses)

## 2. Ordering

- [ ] 2.1 Wrap prompt blocks in `DndContext` + `SortableContext` (vertical strategy)
- [ ] 2.2 Per-block `useSortable` with a dedicated grip handle, `arrayMove` on drop
- [ ] 2.3 Keep the up/down buttons as the keyboard/precision path
- [ ] 2.4 Show the 1-based ordinal on each block, derived from the array index

## 3. Layout for a narrow panel

- [ ] 3.1 Two-row card header: grip, ordinal, enable, name, delete / then position + arrows
- [ ] 3.2 Confirm it renders in the 320 px sidebar without horizontal overflow

## 4. Verify

- [ ] 4.1 `npx tsc -b` and `npm run build` pass
- [ ] 4.2 Browser: Prompts tab lists blocks, add creates one, reorder changes stored order
- [ ] 4.3 Order persists across a reload
- [ ] 4.4 IPA built in CI and installed-artifact checks repeated
