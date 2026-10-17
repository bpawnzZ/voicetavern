import { 
  getCharacters, saveCharacter, 
  getWorldbooks, saveWorldbook, 
  getPresets, savePreset, 
  getSessions, saveSession, 
  getOrder, saveOrder 
} from './storage';
import { useAppStore } from '../store';

export interface VoiceTavernBackup {
  version: number;
  timestamp: number;
  userName: string;
  useVoicePrompt: boolean;
  voiceProvider: string;
  providerConfigs: any;
  characters: Record<string, any>;
  worldbooks: Record<string, any>;
  presets: Record<string, any>;
  sessions: Record<string, any>;
  charOrder?: string[] | null;
  wbOrder?: string[] | null;
}

export async function exportFullBackup(): Promise<string> {
  const store = useAppStore.getState();
  const [characters, worldbooks, presets, sessions, charOrder, wbOrder] = await Promise.all([
    getCharacters(),
    getWorldbooks(),
    getPresets(),
    getSessions(),
    getOrder('characters'),
    getOrder('worldbooks')
  ]);

  const backupData: VoiceTavernBackup = {
    version: 1,
    timestamp: Date.now(),
    userName: store.userName,
    useVoicePrompt: store.useVoicePrompt,
    voiceProvider: store.voiceProvider,
    providerConfigs: store.providerConfigs,
    characters,
    worldbooks,
    presets,
    sessions,
    charOrder,
    wbOrder
  };

  return JSON.stringify(backupData, null, 2);
}

export async function downloadBackupFile() {
  const json = await exportFullBackup();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VoiceTavern_Backup_${dateStr}.vtbackup`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFullBackup(jsonContent: string): Promise<boolean> {
  try {
    const data: VoiceTavernBackup = JSON.parse(jsonContent);
    if (!data.characters && !data.providerConfigs) {
      throw new Error('Invalid backup file format');
    }

    const store = useAppStore.getState();

    // Restore configuration
    if (data.userName) store.setUserName(data.userName);
    if (typeof data.useVoicePrompt === 'boolean') store.setUseVoicePrompt(data.useVoicePrompt);
    if (data.voiceProvider) store.setVoiceProvider(data.voiceProvider as any);
    if (data.providerConfigs) {
      Object.keys(data.providerConfigs).forEach((p) => {
        store.updateProviderConfig(p as any, data.providerConfigs[p]);
      });
    }

    // Restore character cards
    if (data.characters) {
      for (const id of Object.keys(data.characters)) {
        const item = data.characters[id];
        if (item.card) {
          await saveCharacter(id, item.card, item.avatarUrl);
        }
      }
    }

    // Restore world books
    if (data.worldbooks) {
      for (const id of Object.keys(data.worldbooks)) {
        await saveWorldbook(id, data.worldbooks[id]);
      }
    }

    // Restore presets
    if (data.presets) {
      for (const id of Object.keys(data.presets)) {
        await savePreset(id, data.presets[id]);
      }
    }

    // Restore sessions
    if (data.sessions) {
      for (const id of Object.keys(data.sessions)) {
        await saveSession(id, data.sessions[id]);
      }
    }

    // Restore ordering
    if (data.charOrder) await saveOrder('characters', data.charOrder);
    if (data.wbOrder) await saveOrder('worldbooks', data.wbOrder);

    // Reload the library
    await store.loadLibrary();
    return true;
  } catch (e: any) {
    console.error('Import backup failed:', e);
    throw new Error('Import failed: ' + e.message);
  }
}
