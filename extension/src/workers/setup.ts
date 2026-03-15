import Model from "./model";
import { Actions, ConnectionStates, Message } from "../types";
import { FILES_CACHE, TOTAL_FILES_FOR_CACHE } from "../utils/constants";
import { LocalStorage } from "../utils/storage";
import CacheManager from "../utils/cache";

class Setup {
  private static netProgress: number = 0; // total progress for all files
  private static initialProgress: number = 0;

  private constructor() {}

  private static deltaNetProgress(final: number, initial: number): number {
    return (final - initial) / TOTAL_FILES_FOR_CACHE;
  }

  private static progressObj(progress: number): Message {
    const obj: Message = {
      category: "SETUP",
      action: Actions.PROGRESS,
      from: "back",
      data: { progress: progress },
    };
    return obj;
  }

  private static async progressCallback(final: number): Promise<void> {
    this.netProgress += this.deltaNetProgress(final, this.initialProgress);;
    this.initialProgress = final;

    await chrome.runtime.sendMessage(this.progressObj(Math.round(this.netProgress)));
    await LocalStorage.set({ connection_progress: Math.round(this.netProgress) });
  }

  private static async modelDownload(): Promise<void> {
    this.initialProgress = 0;
    await Model.instance();
    if (await Model.shouldInitiate()) {
      await Model.initiate(async (p) => this.progressCallback(p));
    }
  }

  private static async cacheFilesDownload(): Promise<void> {
    for (const file of FILES_CACHE) {
      this.initialProgress = 0;
      const cacheManager = new CacheManager(file.cache_source, file.cache_name, file.cache_params ?? {});
      await cacheManager.save(async (p) => this.progressCallback(p));
    }
  }

  private static async isIncompleteDownload(): Promise<boolean> {
    const data = await LocalStorage.get([
      "connection_progress",
      "connection_state",
    ]);
    return (
      (typeof data.connection_progress == "number" &&
        data.connection_progress >= 100) ||
      data.connection_state !== ConnectionStates.COMPLETED
    );
  }

  private static async remove(): Promise<void> {
    const keys = await caches.keys();
    keys.forEach(async (key) => {
      await caches.delete(key);
    });
  }

  // This is the main function
  static async download(): Promise<void> {
    await LocalStorage.set({ connection_state: ConnectionStates.STARTED });

    if (await this.isIncompleteDownload()) {
      await this.remove();
    }

    await this.cacheFilesDownload();
    await this.modelDownload();

    await LocalStorage.set({ connection_state: ConnectionStates.COMPLETED });
    await chrome.runtime.sendMessage({category: "SETUP", action: Actions.STOP, from: "back"} as Message)
  }
}

export default Setup;
