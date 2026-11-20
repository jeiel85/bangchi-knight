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
    if (!parsed || (parsed.version !== 2 && parsed.version !== 3 && parsed.version !== 4) || !parsed.equipment) {
      return null;
    }
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

export function encodeSaveCode(data: SaveData): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function decodeSaveCode(code: string): SaveData | null {
  try {
    const bin = atob(code.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as SaveData;
    if (!parsed || !parsed.equipment || typeof parsed.stage !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}
