// setup.ts
import browser from "webextension-polyfill";
import Model from "./model";
import { Actions, ConnectionStates, Message } from "../types";
import { FILES_CACHE, TOTAL_FILES_FOR_CACHE } from "../utils/config";
import { LocalStorage } from "../utils/storage";
import CacheManager from "../utils/cache";

class Setup {
    private static netProgress = 0;
    private static initialProgress = 0;

    private constructor() {}

    private static deltaProgress(final: number, initial: number): number {
        return (final - initial) / TOTAL_FILES_FOR_CACHE;
    }

    private static async reportProgress(final: number): Promise<void> {
        this.netProgress += this.deltaProgress(final, this.initialProgress);
        this.initialProgress = final;

        const rounded = Math.round(this.netProgress);
        const message: Message = {
            category: "SETUP",
            action: Actions.PROGRESS,
            from: "back",
            data: { progress: rounded },
        };

        await browser.runtime.sendMessage(message);
        await LocalStorage.set({ connection_progress: rounded });
    }

    private static async downloadModel(): Promise<void> {
        this.initialProgress = 0;
        await Model.instance();
        if (await Model.shouldInitiate()) {
            await Model.initiate((p) => this.reportProgress(p));
        }
    }

    private static async downloadCacheFiles(): Promise<void> {
        for (const file of FILES_CACHE) {
            this.initialProgress = 0;
            const cacheManager = new CacheManager(
                file.cache_source,
                file.cache_name,
                file.cache_params ?? {},
            );
            await cacheManager.save((p) => this.reportProgress(p));
        }
    }

    private static async isIncompleteDownload(): Promise<boolean> {
        const { connection_progress, connection_state } =
            await LocalStorage.get(["connection_progress", "connection_state"]);
        return (
            (typeof connection_progress === "number" &&
                connection_progress >= 100) ||
            connection_state !== ConnectionStates.COMPLETED
        );
    }

    private static async clearCaches(): Promise<void> {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
    }

    static async download(): Promise<void> {
        await LocalStorage.set({ connection_state: ConnectionStates.STARTED });

        if (await this.isIncompleteDownload()) {
            await this.clearCaches();
        }

        await this.downloadCacheFiles();
        await this.downloadModel();

        await LocalStorage.set({
            connection_state: ConnectionStates.COMPLETED,
        });

        const doneMessage: Message = {
            category: "SETUP",
            action: Actions.STOP,
            from: "back",
        };
        await browser.runtime.sendMessage(doneMessage);
    }
}

export default Setup;
