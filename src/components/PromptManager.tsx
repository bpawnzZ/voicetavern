import { useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../store';
import { DEFAULT_MAIN_PROMPT, parseAuxPromptImport } from '../utils/preset_engine';
import type { AuxPrompt } from '../utils/preset_engine';
import { Plus, Upload, Trash2, ArrowUp, ArrowDown, RotateCcw, GripVertical } from 'lucide-react';

const FIELD =
  'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50';

// FIELD carries w-full, which fights a fixed width in Tailwind's output order.
const FIELD_SIZED = FIELD.replace('w-full ', '');

interface CardProps {
  prompt: AuxPrompt;
  index: number;
  count: number;
  onUpdate: (id: string, patch: Partial<AuxPrompt>) => void;
  onMove: (index: number, delta: number) => void;
  onDelete: (id: string) => void;
}

function SortablePrompt({ prompt, index, count, onUpdate, onMove, onDelete }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prompt.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 ${
        isDragging ? 'opacity-60 shadow-lg z-20 relative' : ''
      } ${prompt.enabled ? '' : 'opacity-70'}`}
    >
      <div className="flex items-center space-x-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
          aria-label={`Reorder ${prompt.name}`}
        >
          <GripVertical size={14} />
        </button>
        <span
          className="text-[11px] font-mono text-slate-400 w-4 text-center shrink-0"
          title={`Position ${index + 1} of ${count} in the stack`}
        >
          {index + 1}
        </span>
        <input
          type="checkbox"
          checked={prompt.enabled}
          onChange={(e) => onUpdate(prompt.id, { enabled: e.target.checked })}
          title="Enabled"
          className="accent-teal-500 shrink-0"
        />
        <input
          type="text"
          value={prompt.name}
          onChange={(e) => onUpdate(prompt.id, { name: e.target.value })}
          className={FIELD + ' flex-1 min-w-0 py-1 text-xs font-semibold'}
        />
        <button
          type="button"
          onClick={() => onDelete(prompt.id)}
          className="p-1 text-slate-400 hover:text-red-500 shrink-0"
          title="Delete prompt"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center space-x-2 pl-6 min-w-0">
        <select
          value={prompt.position}
          onChange={(e) => onUpdate(prompt.id, { position: e.target.value as AuxPrompt['position'] })}
          className={FIELD_SIZED + ' w-24 shrink-0 py-1 text-xs'}
          title="Insertion position"
        >
          <option value="before">before</option>
          <option value="after">after</option>
        </select>
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="p-1 shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
          title="Move up"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={index === count - 1}
          className="p-1 shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
          title="Move down"
        >
          <ArrowDown size={14} />
        </button>
      </div>

      <textarea
        value={prompt.content}
        onChange={(e) => onUpdate(prompt.id, { content: e.target.value })}
        placeholder="Prompt text — {{char}} and {{user}} are substituted."
        rows={3}
        className={FIELD + ' font-mono text-xs leading-relaxed resize-y'}
      />
    </div>
  );
}

export default function PromptManager() {
  const { mainPrompt, setMainPrompt, auxPrompts, setAuxPrompts } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const update = (id: string, patch: Partial<AuxPrompt>) => {
    setAuxPrompts(auxPrompts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= auxPrompts.length) return;
    setAuxPrompts(arrayMove(auxPrompts, index, target));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = auxPrompts.findIndex((p) => p.id === active.id);
    const to = auxPrompts.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    setAuxPrompts(arrayMove(auxPrompts, from, to));
  };

  const addPrompt = () => {
    setAuxPrompts([
      ...auxPrompts,
      { id: `aux-${Date.now()}`, name: 'New prompt', content: '', position: 'before', enabled: true },
    ]);
  };

  const importFile = async (file: File) => {
    try {
      const imported = parseAuxPromptImport(await file.text());
      if (imported.length === 0) throw new Error('No prompts found in that file');
      setAuxPrompts([...auxPrompts, ...imported]);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Prompts &amp; stacking
        </label>
        <span className="text-[11px] text-slate-400">saved immediately</span>
      </div>
      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
        Stack order: main prompt → prompts marked <em>before</em> → character card → world book
        (always-on + keyword matches) → prompts marked <em>after</em> → post-history → voice rules.
        Drag a block, or use the arrows, to change the order.
      </p>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Main prompt
          </label>
          <button
            type="button"
            onClick={() => setMainPrompt('')}
            className="text-[11px] text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center"
          >
            <RotateCcw size={12} className="mr-1" /> reset to default
          </button>
        </div>
        <textarea
          value={mainPrompt}
          onChange={(e) => setMainPrompt(e.target.value)}
          placeholder={DEFAULT_MAIN_PROMPT}
          rows={5}
          className={FIELD + ' font-mono text-xs leading-relaxed resize-y'}
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Supports {'{{char}}'}, {'{{user}}'}, {'{{description}}'}, {'{{personality}}'}, {'{{scenario}}'},{' '}
          {'{{system_prompt}}'}. Blank = built-in directive.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={auxPrompts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-4 space-y-3">
            {auxPrompts.map((prompt, index) => (
              <SortablePrompt
                key={prompt.id}
                prompt={prompt}
                index={index}
                count={auxPrompts.length}
                onUpdate={update}
                onMove={move}
                onDelete={(id) => setAuxPrompts(auxPrompts.filter((p) => p.id !== id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {auxPrompts.length === 0 && (
        <p className="text-[11px] text-slate-400 mt-3">
          No extra prompts yet. Add one, or import a SillyTavern preset JSON.
        </p>
      )}

      <div className="flex space-x-3 mt-3">
        <button
          type="button"
          onClick={addPrompt}
          className="flex-1 py-2 px-3 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
        >
          <Plus size={14} className="mr-1" /> Add prompt
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
        >
          <Upload size={14} className="mr-1" /> Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await importFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
