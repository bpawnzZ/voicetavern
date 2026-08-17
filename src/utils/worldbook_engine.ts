export interface WorldbookEntry {
  uid: number | string;
  key: string[];
  keysecondary?: string[];
  content: string;
  constant?: boolean;
  enabled?: boolean;
  insertion_order?: number;
}

export interface Worldbook {
  name: string;
  entries: Record<string, WorldbookEntry> | WorldbookEntry[];
}

export class WorldbookEngine {
  private entries: WorldbookEntry[] = [];

  constructor(worldbookData?: Worldbook) {
    if (worldbookData) {
      this.load(worldbookData);
    }
  }

  load(worldbookData: Worldbook) {
    if (Array.isArray(worldbookData.entries)) {
      this.entries = worldbookData.entries;
    } else {
      this.entries = Object.values(worldbookData.entries);
    }
    // Filter enabled only
    this.entries = this.entries.filter(e => e.enabled !== false);
  }

  getConstantEntries(): string[] {
    return this.entries
      .filter(e => e.constant)
      .sort((a, b) => (a.insertion_order || 0) - (b.insertion_order || 0))
      .map(e => e.content);
  }

  query(text: string): string[] {
    const lowerText = text.toLowerCase();
    const matched = this.entries.filter(e => {
      if (e.constant) return false; // Already handled by getConstantEntries
      
      if (!e.key || e.key.length === 0) return false;

      const primaryMatch = e.key.some(k => lowerText.includes(k.toLowerCase()));
      if (!primaryMatch) return false;

      if (e.keysecondary && e.keysecondary.length > 0) {
        const secondaryMatch = e.keysecondary.some(k => lowerText.includes(k.toLowerCase()));
        return secondaryMatch;
      }
      return true;
    });

    return matched
      .sort((a, b) => (a.insertion_order || 0) - (b.insertion_order || 0))
      .map(e => e.content);
  }
}
