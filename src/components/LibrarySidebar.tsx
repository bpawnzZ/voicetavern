import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { parseCharacterCardPNG } from '../utils/tavern_parser';
import { processCharacterCard, extractRawTextFromCard } from '../api/qwen_text';
import type { Worldbook } from '../utils/worldbook_engine';
import { Upload, Book, Library, Trash2, ChevronLeft, ChevronRight, CheckCircle2, ListChecks, Edit2, MessageSquare, Clock } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

function SortableCharacterCard({ 
  id, c, isActive, isBatchMode, isChecked, 
  onToggleCheck, onContextMenu, onTouchStart, onTouchEnd, onClick 
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={isBatchMode ? onToggleCheck : onClick}
      onContextMenu={(e) => { e.preventDefault(); if (!isBatchMode) onContextMenu(e); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`relative group cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center transition-all duration-200 ${isActive && !isBatchMode ? 'bg-white border-teal-400 shadow-md shadow-teal-400/20' : 'bg-white/60 border-gray-200 hover:bg-white hover:border-teal-200 hover:shadow-sm'} ${isChecked ? 'ring-2 ring-teal-500 bg-teal-50' : ''}`}
    >
      {isBatchMode && (
        <div className="absolute top-2 left-2 z-10">
          <input type="checkbox" checked={isChecked} onChange={() => {}} className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 pointer-events-none" />
        </div>
      )}
      {!isBatchMode && isActive && <div className="absolute top-1.5 left-1.5 text-teal-500"><CheckCircle2 size={16} /></div>}
      
      {c.avatarUrl ? (
        <img src={c.avatarUrl} alt="Avatar" className={`w-12 h-12 rounded-full object-cover mb-2 shadow-sm pointer-events-none ${isActive && !isBatchMode ? 'ring-2 ring-teal-400 ring-offset-2' : ''}`} />
      ) : (
        <div className={`w-12 h-12 rounded-full bg-gradient-to-tr from-teal-100 to-emerald-100 flex items-center justify-center text-xl font-bold text-teal-700 shadow-inner mb-2 pointer-events-none ${isActive && !isBatchMode ? 'ring-2 ring-teal-400 ring-offset-2' : ''}`}>
          {c.card.data.name[0]}
        </div>
      )}
      <span className="text-xs font-semibold text-slate-800 truncate w-full text-center pointer-events-none">{c.card.data.name}</span>
    </div>
  );
}

function SortableRowCard({
  id, title, icon: Icon, isActive, isBatchMode, isChecked,
  onToggleCheck, onContextMenu, onTouchStart, onTouchEnd, onClick
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={isBatchMode ? onToggleCheck : onClick}
      onContextMenu={(e) => { e.preventDefault(); if (!isBatchMode) onContextMenu(e); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`relative group cursor-pointer rounded-lg border p-3 flex items-center space-x-3 transition-all ${isActive && !isBatchMode ? 'bg-white border-teal-400 shadow-md shadow-teal-400/20' : 'bg-white/60 border-gray-200 hover:bg-white hover:border-teal-200'} ${isChecked ? 'ring-2 ring-teal-500 bg-teal-50' : ''}`}
    >
      {isBatchMode && (
        <input type="checkbox" checked={isChecked} onChange={() => {}} className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 pointer-events-none" />
      )}
      {!isBatchMode && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
          <Icon size={16} />
        </div>
      )}
      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate pointer-events-none">{title}</p></div>
    </div>
  );
}

export default function LibrarySidebar({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
  const { 
    characters, activeCharacter, setActiveCharacter, addCharacter, removeCharacter, updateCharacter, reorderCharacters, batchDeleteCharacters,
    worldbooks, activeWorldbook, setActiveWorldbook, addWorldbook, updateWorldbook, removeWorldbook, reorderWorldbooks, batchDeleteWorldbooks,
    sessions, activeSessionId, loadSession, removeSession, renameSession
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'library' | 'sessions'>('library');

  const unifiedInputRef = useRef<HTMLInputElement>(null);
  const fileEditRef = useRef<HTMLInputElement>(null);

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [selectedWbIds, setSelectedWbIds] = useState<string[]>([]);

  const totalSelected = selectedCharIds.length + selectedWbIds.length;

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string; type: 'character' | 'worldbook' | 'session' } | null>(null);
  
  // Editor State
  const [editingChar, setEditingChar] = useState<{ id: string; name: string; avatarUrl: string; card: any } | null>(null);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [editingWb, setEditingWb] = useState<{ id: string; name: string; book: Worldbook } | null>(null);
  const [editingSession, setEditingSession] = useState<{ id: string; title: string } | null>(null);

  const [initialRawText, setInitialRawText] = useState('');

  useEffect(() => {
    if (editingChar && !initialRawText) {
      setInitialRawText(extractRawTextFromCard(editingChar.card));
    } else if (!editingChar) {
      setInitialRawText('');
    }
  }, [editingChar, initialRawText]);

  // Mobile Long Press
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }) // require 5px drag to start, allows clicking
  );

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCharDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) reorderCharacters(active.id as string, over.id as string);
  };
  const handleWbDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) reorderWorldbooks(active.id as string, over.id as string);
  };

  const handleUnifiedImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith('.png')) {
        const data = await parseCharacterCardPNG(file);
        await addCharacter(file.name, data.card, data.avatarUrl);
        setActiveCharacter({ id: file.name, card: data.card, avatarUrl: data.avatarUrl });
      } else if (file.name.endsWith('.webp')) {
        alert('WebP character cards are not supported — convert to PNG or use the JSON file.');
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        
        if (json.data && json.data.name) {
          await addCharacter(file.name, json, undefined);
          setActiveCharacter({ id: file.name, card: json });
        } else if (json.entries) {
          await addWorldbook(file.name, json as Worldbook);
          setActiveWorldbook({ id: file.name, book: json as Worldbook });
        } else {
          alert('Unrecognized JSON file type.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Import failed: ' + err);
    }
    e.target.value = '';
  };

  const handleAvatarEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingChar) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditingChar({ ...editingChar, avatarUrl: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const saveCharacterEdit = async () => {
    if (!editingChar) return;
    const newCard = { ...editingChar.card, data: { ...editingChar.card.data, name: editingChar.name } };
    await updateCharacter(editingChar.id, newCard, editingChar.avatarUrl);
    setEditingChar(null);
  };

  const handleOptimize = async () => {
    if (!editingChar) return;
    const { apiKey } = useAppStore.getState();
    if (!apiKey) return alert("Set your API key in Settings first");
    
    try {
      setOptimizeLoading(true);
      const optimizedText = await processCharacterCard(apiKey, editingChar.card);
      
      const newCard = { ...editingChar.card };
      if (!newCard.data) newCard.data = {};
      
      // Merge all context into system_prompt and clear others
      newCard.data.description = '';
      newCard.data.personality = '';
      newCard.data.scenario = '';
      newCard.data.first_mes = '';
      if (newCard.data.extensions?.chub) newCard.data.extensions.chub.system_prompt = '';
      if (newCard.data.character_book) newCard.data.character_book = undefined;
      
      newCard.data.system_prompt = optimizedText;
      
      setEditingChar({ ...editingChar, card: newCard });
      alert('Optimized — the card was cleaned and merged into plain text. Click "Save changes".');
    } catch (e: any) {
      alert('Optimization failed: ' + e.message);
    } finally {
      setOptimizeLoading(false);
    }
  };

  const cancelBatchMode = () => {
    setIsBatchMode(false);
    setSelectedCharIds([]);
    setSelectedWbIds([]);
  };

  const executeBatchDelete = async () => {
    if (confirm(`Delete these ${totalSelected} items?`)) {
      if (selectedCharIds.length > 0) await batchDeleteCharacters(selectedCharIds);
      if (selectedWbIds.length > 0) await batchDeleteWorldbooks(selectedWbIds);
      cancelBatchMode();
    }
  };

  const onLongPress = (id: string, type: 'character' | 'worldbook' | 'session', e: React.TouchEvent) => {
    if (isBatchMode) return;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY, id, type });
    }, 600);
  };

  if (isCollapsed) {
    return (
      <div className="hidden md:flex w-16 bg-slate-50 border-r border-gray-200 flex-col items-center py-6 z-10 shrink-0 shadow-sm transition-all duration-300">
        <button onClick={onToggleCollapse} className="p-2 mb-8 rounded-full bg-white border border-gray-200 text-teal-600 hover:text-teal-900 shadow-sm hover:shadow-md transition-all">
          <ChevronRight size={20} />
        </button>
        <Library size={24} className="text-teal-400 mb-6" />
      </div>
    );
  }

  return (
    <div className="flex w-full md:w-80 bg-slate-50 border-r border-gray-200 flex-col p-6 overflow-y-auto z-10 shrink-0 transition-all duration-300 relative h-full">
      {/* Header Area */}
      <div className="flex flex-col mb-6 space-y-4">
        <div className="flex justify-between items-center">
          {/* Tab Switcher (acts as the main header) */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl flex-1 mr-3">
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg flex justify-center items-center transition-all duration-300 ${activeTab === 'library' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Library size={16} className="mr-1.5" /> Library
            </button>
            <button 
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg flex justify-center items-center transition-all duration-300 ${activeTab === 'sessions' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare size={16} className="mr-1.5" /> Sessions
            </button>
          </div>
          <button onClick={onToggleCollapse} className="hidden md:flex p-1.5 rounded-full bg-white border border-gray-200 text-slate-400 hover:text-teal-700 shadow-sm transition-colors shrink-0">
            <ChevronLeft size={18} />
          </button>
        </div>
        
        {/* Unified Top Actions (only relevant for Library) */}
        {activeTab === 'library' && (
          <div className="flex space-x-3 animate-in fade-in slide-in-from-top-2">
             <button 
                onClick={() => {
                  if (isBatchMode) cancelBatchMode();
                  else setIsBatchMode(true);
                }} 
                className={`flex-1 flex justify-center items-center py-2.5 rounded-xl border text-sm font-bold transition-all ${isBatchMode ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-inner' : 'bg-white border-gray-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 shadow-sm hover:shadow'}`}
              >
                <ListChecks size={16} className="mr-1.5" /> {isBatchMode ? 'Cancel batch' : 'Batch select'}
              </button>
              <button onClick={() => unifiedInputRef.current?.click()} className="flex-1 flex justify-center items-center py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold shadow-md shadow-teal-500/20 transition-all">
                <Upload size={16} className="mr-1.5" /> Import
              </button>
              <input type="file" accept=".png,.webp,.jpeg,.jpg,.json" ref={unifiedInputRef} onChange={handleUnifiedImport} className="hidden" />
          </div>
        )}
      </div>
      
      {activeTab === 'library' ? (
        <>
          {/* Character cards */}
          <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>Characters</span>
          </h3>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCharDragEnd}>
          <SortableContext items={characters.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3">
              {characters.map(c => (
                <SortableCharacterCard
                  key={c.id}
                  id={c.id}
                  c={c}
                  isActive={activeCharacter?.id === c.id}
                  isBatchMode={isBatchMode}
                  isChecked={selectedCharIds.includes(c.id)}
                  onToggleCheck={() => setSelectedCharIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                  onClick={() => setActiveCharacter(c)}
                  onContextMenu={(e: React.MouseEvent) => {
                    setContextMenu({ x: e.clientX, y: e.clientY, id: c.id, type: 'character' });
                  }}
                  onTouchStart={(e: React.TouchEvent) => onLongPress(c.id, 'character', e)}
                  onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                />
              ))}
              {characters.length === 0 && <div className="col-span-2 text-center text-xs text-slate-400 py-4 italic">Nothing here yet — use Import above</div>}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* World books */}
      <div className="mb-10">
         <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>World books</span>
          </h3>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWbDragEnd}>
          <SortableContext items={worldbooks.map(w => w.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {worldbooks.map(w => (
                <SortableRowCard
                  key={w.id}
                  id={w.id}
                  title={w.book.name || w.id}
                  icon={Book}
                  isActive={activeWorldbook?.id === w.id}
                  isBatchMode={isBatchMode}
                  isChecked={selectedWbIds.includes(w.id)}
                  onToggleCheck={() => setSelectedWbIds(prev => prev.includes(w.id) ? prev.filter(id => id !== w.id) : [...prev, w.id])}
                  onClick={() => setActiveWorldbook(w)}
                  onContextMenu={(e: React.MouseEvent) => {
                    setContextMenu({ x: e.clientX, y: e.clientY, id: w.id, type: 'worldbook' });
                  }}
                  onTouchStart={(e: React.TouchEvent) => onLongPress(w.id, 'worldbook', e)}
                  onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      </>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pb-24">
          {sessions.length === 0 && (
            <div className="text-center text-slate-400 text-sm mt-10 italic flex flex-col items-center">
              <MessageSquare size={32} className="mb-3 text-slate-300" />
              No sessions yet
            </div>
          )}
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => loadSession(session.id)}
              onContextMenu={(e: React.MouseEvent) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, id: session.id, type: 'session' });
              }}
              onTouchStart={(e: React.TouchEvent) => onLongPress(session.id, 'session', e)}
              onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
              className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                activeSessionId === session.id 
                  ? 'bg-teal-50 border-teal-300 shadow-sm shadow-teal-500/10' 
                  : 'bg-white border-gray-200 hover:border-teal-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-slate-800 truncate flex-1">{session.title}</h4>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center">
                  <Clock size={12} className="mr-1" /> 
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
                <span>{session.messages.length} messages</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Batch Operations Bar */}
      {isBatchMode && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-gray-200 text-slate-800 rounded-xl shadow-2xl p-4 flex justify-between items-center z-50 animate-in slide-in-from-bottom-5">
          <span className="text-sm font-bold">{totalSelected} selected</span>
          <div className="flex space-x-3">
            <button onClick={cancelBatchMode} className="text-slate-500 hover:text-slate-800 text-sm px-2 font-medium">Cancel</button>
            <button 
              onClick={executeBatchDelete}
              disabled={totalSelected === 0}
              className="bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 text-red-600 font-semibold text-sm px-4 py-1.5 rounded-lg flex items-center transition-colors"
            >
              <Trash2 size={14} className="mr-1" /> Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg w-32 py-1 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'character' && (
            <button 
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center"
              onClick={() => {
                 const char = characters.find(c => c.id === contextMenu.id);
                 if (char) {
                   setEditingChar({ id: char.id, name: char.card.data.name, avatarUrl: char.avatarUrl || '', card: char.card });
                 }
                 setContextMenu(null);
              }}
            >
              <Edit2 size={14} className="mr-2" /> Edit
            </button>
          )}
          {contextMenu.type === 'worldbook' && (
            <button 
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center"
              onClick={() => {
                 const wb = worldbooks.find(w => w.id === contextMenu.id);
                 if (wb) {
                   setEditingWb({ id: wb.id, name: wb.book.name || wb.id, book: wb.book });
                 }
                 setContextMenu(null);
              }}
            >
              <Edit2 size={14} className="mr-2" /> Rename
            </button>
          )}
          {contextMenu.type === 'session' && (
            <button 
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center"
              onClick={() => {
                 const sess = sessions.find(s => s.id === contextMenu.id);
                 if (sess) {
                   setEditingSession({ id: sess.id, title: sess.title });
                 }
                 setContextMenu(null);
              }}
            >
              <Edit2 size={14} className="mr-2" /> Rename
            </button>
          )}
          <button 
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            onClick={() => {
              if (contextMenu.type === 'character') removeCharacter(contextMenu.id);
              if (contextMenu.type === 'worldbook') removeWorldbook(contextMenu.id);
              if (contextMenu.type === 'session') removeSession(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Trash2 size={14} className="mr-2" /> Delete
          </button>
        </div>
      )}

      {/* Character Edit Modal */}
      {editingChar && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Edit character card</h3>
              <button onClick={() => setEditingChar(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto flex flex-col space-y-6">
              {/* Header Info */}
              <div className="flex items-center space-x-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input type="file" accept="image/png, image/jpeg, image/webp" ref={fileEditRef} onChange={handleAvatarEdit} className="hidden" />
                <div 
                  className="w-20 h-20 shrink-0 rounded-full border-2 border-slate-200 shadow-sm overflow-hidden relative group cursor-pointer"
                  onClick={() => fileEditRef.current?.click()}
                >
                  {editingChar.avatarUrl ? (
                    <img src={editingChar.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-400">{editingChar.name[0]}</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Character name</label>
                  <input 
                    type="text" 
                    value={editingChar.name} 
                    onChange={e => setEditingChar({ ...editingChar, name: e.target.value })}
                    className="w-full max-w-md border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Dual Pane Textareas */}
              <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[400px]">
                {/* Left Pane: Raw Text */}
                <div className="flex-1 flex flex-col space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                    <span>Before (extracted from card)</span>
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">read-only</span>
                  </label>
                  <textarea 
                    readOnly
                    value={initialRawText}
                    className="flex-1 w-full p-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                    placeholder="Fields extracted from the original card..."
                  />
                </div>

                {/* Right Pane: Optimized Text */}
                <div className="flex-1 flex flex-col space-y-2">
                  <label className="text-sm font-bold text-teal-700 flex items-center justify-between">
                    <span>After (final system prompt)</span>
                    <span className="text-xs font-normal text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">editable</span>
                  </label>
                  <textarea 
                    value={editingChar.card.data?.system_prompt || ''}
                    onChange={e => {
                      const newCard = { ...editingChar.card };
                      if (!newCard.data) newCard.data = {};
                      newCard.data.system_prompt = e.target.value;
                      setEditingChar({ ...editingChar, card: newCard });
                    }}
                    className="flex-1 w-full p-3 text-sm text-slate-800 bg-white border border-teal-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 resize-none shadow-sm"
                    placeholder="The cleaned prompt will appear here..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-slate-50 shrink-0">
              <button 
                onClick={handleOptimize} 
                disabled={optimizeLoading}
                className="px-5 py-2.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm rounded-lg font-bold transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {optimizeLoading ? 'Rewriting…' : '🤖 Clean & rewrite with AI'}
              </button>
              <button onClick={saveCharacterEdit} className="px-8 py-2.5 text-sm text-white bg-teal-500 hover:bg-teal-600 shadow-sm rounded-lg font-bold transition-colors">
                Save changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Worldbook Edit Modal */}
      {editingWb && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Edit world book</h3>
              <button onClick={() => setEditingWb(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-sm flex items-center justify-center bg-teal-50 text-teal-400 mb-6">
                <Book size={40} />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">World book name</label>
                <input 
                  type="text" 
                  value={editingWb.name} 
                  onChange={e => setEditingWb({ ...editingWb, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-slate-50">
              <button onClick={async () => {
                await updateWorldbook(editingWb.id, { ...editingWb.book, name: editingWb.name });
                setEditingWb(null);
              }} className="px-6 py-2 text-sm text-white bg-teal-500 hover:bg-teal-600 shadow-sm rounded-lg font-medium transition-colors">Save changes</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Session Rename Modal */}
      {editingSession && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Rename session</h3>
              <button onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">Session title</label>
                <input 
                  type="text" 
                  value={editingSession.title} 
                  onChange={e => setEditingSession({ ...editingSession, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-slate-50">
              <button onClick={async () => {
                if (editingSession.title.trim()) {
                  await renameSession(editingSession.id, editingSession.title.trim());
                }
                setEditingSession(null);
              }} className="px-6 py-2 text-sm text-white bg-teal-500 hover:bg-teal-600 shadow-sm rounded-lg font-medium transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
