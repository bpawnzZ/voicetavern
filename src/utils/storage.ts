import localforage from 'localforage';
import type { TavernCardV2 } from './tavern_parser';
import type { Worldbook } from './worldbook_engine';
import type { SillyTavernPreset } from './preset_engine';

export interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ id?: string; role: string; text: string }>;
  characterId?: string;
  worldbookId?: string;
  updatedAt: number;
}

export const characterStorage = localforage.createInstance({
  name: 'VoiceTavern',
  storeName: 'characters'
});

export const worldbookStorage = localforage.createInstance({
  name: 'VoiceTavern',
  storeName: 'worldbooks'
});

export const presetStorage = localforage.createInstance({
  name: 'VoiceTavern',
  storeName: 'presets'
});

export const chatHistoryStorage = localforage.createInstance({
  name: 'VoiceTavern',
  storeName: 'chats'
});

export const orderStorage = localforage.createInstance({
  name: 'VoiceTavern',
  storeName: 'orders'
});

// Orders
export async function saveOrder(type: string, ids: string[]) {
  await orderStorage.setItem(type, ids);
}
export async function getOrder(type: string): Promise<string[] | null> {
  return await orderStorage.getItem<string[]>(type);
}

// Characters
export async function saveCharacter(id: string, card: TavernCardV2, avatarUrl?: string) {
  await characterStorage.setItem(id, { card, avatarUrl });
}
export async function deleteCharacter(id: string) {
  await characterStorage.removeItem(id);
}
export async function getCharacters(): Promise<Record<string, { card: TavernCardV2, avatarUrl?: string }>> {
  const chars: Record<string, any> = {};
  await characterStorage.iterate((value, key) => {
    chars[key] = value;
  });
  return chars;
}

// Worldbooks
export async function saveWorldbook(id: string, worldbook: Worldbook) {
  await worldbookStorage.setItem(id, worldbook);
}
export async function deleteWorldbook(id: string) {
  await worldbookStorage.removeItem(id);
}
export async function getWorldbooks(): Promise<Record<string, Worldbook>> {
  const books: Record<string, any> = {};
  await worldbookStorage.iterate((value, key) => {
    books[key] = value;
  });
  return books;
}

// Presets
export async function savePreset(id: string, preset: SillyTavernPreset) {
  await presetStorage.setItem(id, preset);
}
export async function deletePreset(id: string) {
  await presetStorage.removeItem(id);
}
export async function getPresets(): Promise<Record<string, SillyTavernPreset>> {
  const presets: Record<string, any> = {};
  await presetStorage.iterate((value, key) => {
    presets[key] = value;
  });
  return presets;
}

// Chat Sessions
export async function saveSession(id: string, session: ChatSession) {
  await chatHistoryStorage.setItem(id, session);
}
export async function deleteSession(id: string) {
  await chatHistoryStorage.removeItem(id);
}
export async function getSessions(): Promise<Record<string, ChatSession>> {
  const sessions: Record<string, any> = {};
  await chatHistoryStorage.iterate((value, key) => {
    sessions[key] = value;
  });
  return sessions;
}
