import { create } from 'zustand';
import type { TavernCardV2 } from '../utils/tavern_parser';
import type { Worldbook } from '../utils/worldbook_engine';
import { getCharacters, getWorldbooks, saveCharacter, deleteCharacter, saveWorldbook, deleteWorldbook, getOrder, saveOrder, getSessions, saveSession, deleteSession } from '../utils/storage';
import type { ChatSession } from '../utils/storage';

interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;

  useVoicePrompt: boolean;
  setUseVoicePrompt: (v: boolean) => void;

  userName: string;
  setUserName: (name: string) => void;

  characters: { id: string; card: TavernCardV2; avatarUrl?: string }[];
  worldbooks: { id: string; book: Worldbook }[];
  sessions: ChatSession[];
  
  loadLibrary: () => Promise<void>;

  activeCharacter: { id: string; card: TavernCardV2; avatarUrl?: string } | null;
  setActiveCharacter: (char: { id: string; card: TavernCardV2; avatarUrl?: string } | null) => void;
  addCharacter: (id: string, card: TavernCardV2, avatarUrl?: string) => Promise<void>;
  updateCharacter: (id: string, card: TavernCardV2, avatarUrl?: string) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;
  reorderCharacters: (activeId: string, overId: string) => Promise<void>;
  batchDeleteCharacters: (ids: string[]) => Promise<void>;

  activeWorldbook: { id: string; book: Worldbook } | null;
  setActiveWorldbook: (wb: { id: string; book: Worldbook } | null) => void;
  addWorldbook: (id: string, book: Worldbook) => Promise<void>;
  updateWorldbook: (id: string, book: Worldbook) => Promise<void>;
  removeWorldbook: (id: string) => Promise<void>;
  reorderWorldbooks: (activeId: string, overId: string) => Promise<void>;
  batchDeleteWorldbooks: (ids: string[]) => Promise<void>;

  isConnected: boolean;
  setIsConnected: (status: boolean) => void;
  
  isRecording: boolean;
  setIsRecording: (status: boolean) => void;
  
  messages: Array<{ id?: string; role: string; text: string }>;
  addMessage: (msg: { id?: string; role: string; text: string }) => void;
  appendMessageDelta: (id: string, role: string, delta: string) => void;
  clearMessages: () => void;

  activeSessionId: string | null;
  createNewSession: () => void;
  loadSession: (id: string) => void;
  removeSession: (id: string) => Promise<void>;
  renameSession: (id: string, newTitle: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  apiKey: localStorage.getItem('dashscope_api_key') || '',
  setApiKey: (key) => {
    localStorage.setItem('dashscope_api_key', key);
    set({ apiKey: key });
  },

  useVoicePrompt: localStorage.getItem('vt_use_voice_prompt') !== 'false', // Default to true
  setUseVoicePrompt: (v) => {
    localStorage.setItem('vt_use_voice_prompt', v ? 'true' : 'false');
    set({ useVoicePrompt: v });
  },

  userName: localStorage.getItem('vt_user_name') || '我',
  setUserName: (name) => {
    localStorage.setItem('vt_user_name', name);
    set({ userName: name });
  },

  characters: [],
  worldbooks: [],
  sessions: [],
  activeSessionId: null,

  loadLibrary: async () => {
    const charsObj = await getCharacters();
    const wbsObj = await getWorldbooks();
    const sessObj = await getSessions();

    let charsArray = Object.keys(charsObj).map(id => ({ id, ...charsObj[id] }));
    const charOrder = await getOrder('characters');
    if (charOrder) charsArray.sort((a, b) => { const iA = charOrder.indexOf(a.id); const iB = charOrder.indexOf(b.id); return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB); });

    let wbsArray = Object.keys(wbsObj).map(id => ({ id, book: wbsObj[id] }));
    const wbOrder = await getOrder('worldbooks');
    if (wbOrder) wbsArray.sort((a, b) => { const iA = wbOrder.indexOf(a.id); const iB = wbOrder.indexOf(b.id); return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB); });

    let sessArray = Object.keys(sessObj).map(id => sessObj[id]);
    sessArray.sort((a, b) => b.updatedAt - a.updatedAt); // Newest first

    set({ characters: charsArray, worldbooks: wbsArray, sessions: sessArray });
  },

  activeCharacter: null,
  setActiveCharacter: (char) => set({ activeCharacter: char }),
  addCharacter: async (id, card, avatarUrl) => {
    await saveCharacter(id, card, avatarUrl);
    set(state => {
      const newChars = [...state.characters.filter(c => c.id !== id), { id, card, avatarUrl }];
      saveOrder('characters', newChars.map(c => c.id));
      return { characters: newChars };
    });
  },
  updateCharacter: async (id, card, avatarUrl) => {
    await saveCharacter(id, card, avatarUrl);
    set(state => ({
      characters: state.characters.map(c => c.id === id ? { id, card, avatarUrl } : c),
      activeCharacter: state.activeCharacter?.id === id ? { id, card, avatarUrl } : state.activeCharacter
    }));
  },
  removeCharacter: async (id) => {
    await deleteCharacter(id);
    set(state => {
      const newChars = state.characters.filter(c => c.id !== id);
      saveOrder('characters', newChars.map(c => c.id));
      return {
        characters: newChars,
        activeCharacter: state.activeCharacter?.id === id ? null : state.activeCharacter
      };
    });
  },
  reorderCharacters: async (activeId, overId) => {
    set(state => {
      const oldIndex = state.characters.findIndex(c => c.id === activeId);
      const newIndex = state.characters.findIndex(c => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      
      const newChars = [...state.characters];
      const [moved] = newChars.splice(oldIndex, 1);
      newChars.splice(newIndex, 0, moved);
      
      saveOrder('characters', newChars.map(c => c.id));
      return { characters: newChars };
    });
  },
  batchDeleteCharacters: async (ids) => {
    for (const id of ids) {
      await deleteCharacter(id);
    }
    set(state => {
      const newChars = state.characters.filter(c => !ids.includes(c.id));
      saveOrder('characters', newChars.map(c => c.id));
      return {
        characters: newChars,
        activeCharacter: state.activeCharacter && ids.includes(state.activeCharacter.id) ? null : state.activeCharacter
      };
    });
  },

  activeWorldbook: null,
  setActiveWorldbook: (wb) => set({ activeWorldbook: wb }),
  addWorldbook: async (id, book) => {
    await saveWorldbook(id, book);
    set(state => {
      const newWbs = [...state.worldbooks.filter(w => w.id !== id), { id, book }];
      saveOrder('worldbooks', newWbs.map(w => w.id));
      return { worldbooks: newWbs };
    });
  },
  updateWorldbook: async (id, book) => {
    await saveWorldbook(id, book);
    set(state => {
      const updatedWbs = state.worldbooks.map(w => w.id === id ? { id, book } : w);
      const updatedActive = state.activeWorldbook?.id === id ? { id, book } : state.activeWorldbook;
      return { worldbooks: updatedWbs, activeWorldbook: updatedActive };
    });
  },
  removeWorldbook: async (id) => {
    await deleteWorldbook(id);
    set(state => {
      const newWbs = state.worldbooks.filter(w => w.id !== id);
      saveOrder('worldbooks', newWbs.map(w => w.id));
      return { worldbooks: newWbs, activeWorldbook: state.activeWorldbook?.id === id ? null : state.activeWorldbook };
    });
  },
  reorderWorldbooks: async (activeId, overId) => {
    set(state => {
      const oldIndex = state.worldbooks.findIndex(w => w.id === activeId);
      const newIndex = state.worldbooks.findIndex(w => w.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      const newWbs = [...state.worldbooks];
      const [moved] = newWbs.splice(oldIndex, 1);
      newWbs.splice(newIndex, 0, moved);
      saveOrder('worldbooks', newWbs.map(w => w.id));
      return { worldbooks: newWbs };
    });
  },
  batchDeleteWorldbooks: async (ids) => {
    for (const id of ids) {
      await deleteWorldbook(id);
    }
    set(state => {
      const newWbs = state.worldbooks.filter(w => !ids.includes(w.id));
      saveOrder('worldbooks', newWbs.map(w => w.id));
      return { worldbooks: newWbs, activeWorldbook: state.activeWorldbook && ids.includes(state.activeWorldbook.id) ? null : state.activeWorldbook };
    });
  },

  isConnected: false,
  setIsConnected: (status) => set({ isConnected: status }),
  
  isRecording: false,
  setIsRecording: (status) => set({ isRecording: status }),
  
  messages: [],
  addMessage: (msg) => set((state) => {
    let activeSessionId = state.activeSessionId;
    let newMessages = [...state.messages, msg];
    
    // Auto create session if not exists
    if (!activeSessionId && msg.role === 'user') {
      activeSessionId = Date.now().toString();
      const title = msg.text.slice(0, 15) + (msg.text.length > 15 ? '...' : '');
      const newSession: ChatSession = {
        id: activeSessionId,
        title: title || '新会话',
        messages: newMessages,
        characterId: state.activeCharacter?.id,
        worldbookId: state.activeWorldbook?.id,
        updatedAt: Date.now()
      };
      saveSession(activeSessionId, newSession);
      const sessArray = [newSession, ...state.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
      return { messages: newMessages, activeSessionId, sessions: sessArray };
    }

    // Save existing session
    if (activeSessionId) {
      const session = state.sessions.find(s => s.id === activeSessionId);
      if (session) {
        const updatedSession = { ...session, messages: newMessages, updatedAt: Date.now() };
        saveSession(activeSessionId, updatedSession);
        const sessArray = state.sessions.map(s => s.id === activeSessionId ? updatedSession : s).sort((a, b) => b.updatedAt - a.updatedAt);
        return { messages: newMessages, sessions: sessArray };
      }
    }
    
    return { messages: newMessages };
  }),
  appendMessageDelta: (id, role, delta) => set((state) => {
    const existingIndex = state.messages.findIndex(m => m.id === id);
    let newMessages = [...state.messages];
    if (existingIndex >= 0) {
      newMessages[existingIndex] = {
        ...newMessages[existingIndex],
        text: newMessages[existingIndex].text + delta
      };
    } else {
      newMessages.push({ id, role, text: delta });
    }

    if (state.activeSessionId) {
      const session = state.sessions.find(s => s.id === state.activeSessionId);
      if (session) {
        const updatedSession = { ...session, messages: newMessages, updatedAt: Date.now() };
        // We only save to localforage periodically for deltas or just don't await.
        // It's safe to fire and forget here, it won't block the UI thread significantly.
        saveSession(state.activeSessionId, updatedSession);
        const sessArray = state.sessions.map(s => s.id === state.activeSessionId ? updatedSession : s).sort((a, b) => b.updatedAt - a.updatedAt);
        return { messages: newMessages, sessions: sessArray };
      }
    }
    return { messages: newMessages };
  }),
  clearMessages: () => set({ messages: [] }),

  createNewSession: () => set({ messages: [], activeSessionId: null }),
  loadSession: (id) => set((state) => {
    const session = state.sessions.find(s => s.id === id);
    if (!session) return state;

    const char = state.characters.find(c => c.id === session.characterId) || state.activeCharacter;
    const wb = state.worldbooks.find(w => w.id === session.worldbookId) || state.activeWorldbook;

    return {
      activeSessionId: id,
      messages: session.messages,
      activeCharacter: char,
      activeWorldbook: wb,
    };
  }),
  removeSession: async (id) => {
    await deleteSession(id);
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
      messages: state.activeSessionId === id ? [] : state.messages
    }));
  },
  renameSession: async (id, newTitle) => {
    set(state => {
      const session = state.sessions.find(s => s.id === id);
      if (session) {
        const updatedSession = { ...session, title: newTitle };
        saveSession(id, updatedSession);
        return {
          sessions: state.sessions.map(s => s.id === id ? updatedSession : s)
        };
      }
      return state;
    });
  }
}));
