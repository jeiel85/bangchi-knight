import type { SaveData } from './types';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAVE_KEY = 'bangchi_knight_expedition_v2';

const defaultAdapter: StorageAdapter = {
  getItem: (key) => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore storage errors
    }
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },
};

export function loadSaveData(adapter: StorageAdapter = defaultAdapter): SaveData | null {
  const raw = adapter.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed || parsed.version !== 2 || !parsed.equipment) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSaveData(data: SaveData, adapter: StorageAdapter = defaultAdapter): void {
  adapter.setItem(SAVE_KEY, JSON.stringify(data));
}

export function clearSaveData(adapter: StorageAdapter = defaultAdapter): void {
  adapter.removeItem(SAVE_KEY);
}
