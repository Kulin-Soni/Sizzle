import { ConnectionStates } from "../types";
import { z } from "zod";

const LocalStorageData = z.object({
  skia_enabled: z.boolean(),
  skia_threshold: z.number(),
  onboarding: z.boolean(),
  connection_state: z.enum(ConnectionStates),
  connection_progress: z.number()
});

export type LocalStorageProps = Partial<z.infer<typeof LocalStorageData>>;
export type LocalStorageKeys = keyof LocalStorageProps;


const SessionStorageData = z.object({});

export type SessionStorageProps = Partial<z.infer<typeof SessionStorageData>>;
export type SessionStorageKeys = keyof SessionStorageProps;


class LocalStorage {
  private constructor() {}

  static async get(items: LocalStorageProps | LocalStorageKeys[]) {
    const data: LocalStorageProps = await chrome.storage.local.get(items);
    return data;
  }

  static async set(items: LocalStorageProps) {
    await chrome.storage.local.set(items);
  }

  static async clear() {
    await chrome.storage.local.clear();
  }

  static async remove(items: LocalStorageKeys[]) {
    await chrome.storage.local.remove(items);
  }
}

class SessionStorage {
  private constructor() {}

  static async get(items: SessionStorageProps | SessionStorageKeys[]) {
    const data: SessionStorageProps = await chrome.storage.session.get(items);
    return data;
  }

  static async set(items: SessionStorageProps) {
    await chrome.storage.session.set(items);
  }

  static async clear() {
    await chrome.storage.session.clear();
  }

  static async remove(items: LocalStorageKeys[]) {
    await chrome.storage.session.remove(items);
  }
}
export { LocalStorage, SessionStorage };