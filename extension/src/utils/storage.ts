// storage.ts
import browser, { Storage } from "webextension-polyfill";
import { z } from "zod";
import { ConnectionStates } from "../types";

const LocalStorageSchema = z.object({
  sizzle_enabled: z.boolean(),
  sizzle_threshold: z.number(),
  onboarding: z.boolean(),
  connection_state: z.enum(ConnectionStates),
  connection_progress: z.number(),
});

export type LocalStorageProps = Partial<z.infer<typeof LocalStorageSchema>>;
export type LocalStorageKeys = keyof LocalStorageProps;

const SessionStorageSchema = z.object({});

export type SessionStorageProps = Partial<z.infer<typeof SessionStorageSchema>>;
export type SessionStorageKeys = keyof SessionStorageProps;

class StorageArea<Props extends Record<string, unknown>> {
  constructor(private readonly area: Storage.StorageArea) {}

  async get(items: Partial<Props> | (keyof Props)[]): Promise<Partial<Props>> {
    return (await this.area.get(items as string[] | Record<string, unknown>)) as Partial<Props>;
  }

  async set(items: Partial<Props>): Promise<void> {
    await this.area.set(items);
  }

  async remove(items: (keyof Props)[]): Promise<void> {
    await this.area.remove(items as string[]);
  }

  async clear(): Promise<void> {
    await this.area.clear();
  }
}

export const LocalStorage = new StorageArea<z.infer<typeof LocalStorageSchema>>(browser.storage.local);
export const SessionStorage = new StorageArea<z.infer<typeof SessionStorageSchema>>(browser.storage.session);