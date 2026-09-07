// youtube.ts
import browser, { Runtime } from "webextension-polyfill";
import { Message } from "../types";
import { LocalStorage } from "../utils/storage";

let threshold = 60;

class ClassifierPortConnection {
    private static port: Runtime.Port | null = null;
    private constructor() {}

    private static getPort(): Runtime.Port {
        if (!this.port) {
            this.port = browser.runtime.connect({ name: "classifier" });
            this.port.onDisconnect.addListener(() => {
                this.port = null;
            });
        }
        return this.port;
    }

    static onMessage(callback: (msg: Message) => void | Promise<void>): void {
        this.getPort().onMessage.addListener((message) => {
            void callback(message as Message);
        });
    }

    static send(text: string, id: string): void {
        const message: Message = {
            category: "CLASSIFICATION",
            from: "front",
            data: { text, id },
        };
        this.getPort().postMessage(message);
    }
}

async function waitForElement(
    parent: Node,
    selector: string,
): Promise<Element> {
    const existing = document.querySelector(selector);
    if (existing) return existing;

    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        observer.observe(parent, { childList: true, subtree: true });
    });
}

function extractText(input: string | Element): string {
    const el =
        typeof input === "string"
            ? Object.assign(document.createElement("div"), { innerHTML: input })
            : input;

    const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    );
    let out = "";
    while (walker.nextNode()) {
        const n = walker.currentNode;
        out +=
            n.nodeName === "IMG"
                ? (n as HTMLImageElement).alt
                : n.nodeType === Node.TEXT_NODE
                  ? (n.textContent ?? "")
                  : "";
    }
    return out.trim();
}

function checkValidity(): boolean {
    const re =
        /^https:\/\/(www\.)?youtube\.com\/(watch\?v=[\w-]+|live\/[\w-]+)([?&].*)?$/;
    return re.test(document.URL);
}

function cleanGhostRenderers(node: Element): void {
    const ghosts = node.querySelectorAll(
        "ytd-continuation-item-renderer.ytd-item-section-renderer",
    );
    ghosts.forEach((ghost, i) => {
        if (i < ghosts.length - 1) ghost.remove();
    });
}

function getRenderedComments(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (
                !(node instanceof Element) ||
                !node.matches("ytd-comment-thread-renderer")
            )
                continue;

            const span = node.querySelector(
                "#comment-container #comment #body #main #expander #content #content-text span",
            );
            const text = span && extractText(span);
            if (!text) continue;

            if (node instanceof HTMLElement) node.style.visibility = "hidden";
            const uuid = "sizzle" + crypto.randomUUID();
            node.id = uuid;
            ClassifierPortConnection.send(text, uuid);
        }
    }
}

function interceptComments(msg: Message): void {
    if (msg.category !== "CLASSIFICATION" || msg.from !== "back") return;

    const node = document.getElementById(msg.result.id);
    if (msg.result.result < threshold / 100) {
        node?.remove();
    } else if (node instanceof HTMLElement) {
        node.style.visibility = "visible";
    }
}

async function addCommentListener(): Promise<MutationObserver | undefined> {
    const commentsElement = await waitForElement(
        document,
        "#below ytd-comments ytd-item-section-renderer #contents",
    );
    if (!commentsElement) return;

    const observer = new MutationObserver((mutations) => {
        getRenderedComments(mutations);
        cleanGhostRenderers(commentsElement);
    });
    observer.observe(commentsElement, { childList: true });
    return observer;
}

async function addPageListener(): Promise<void> {
    console.log(`Extension loaded with threshold ${threshold / 100}!`);

    let previousObserver: MutationObserver | null = null;

    async function handleUrlChange(): Promise<void> {
        previousObserver?.disconnect();
        const wakeUp: Message = { category: "WAKE_UP_CALL", from: "front" };
        await browser.runtime.sendMessage(wakeUp);

        if (checkValidity()) {
            previousObserver = (await addCommentListener()) ?? null;
        }
    }

    (["pushState", "replaceState"] as const).forEach((method) => {
        const original = history[method].bind(history);
        history[method] = function (
            ...args: Parameters<History[typeof method]>
        ) {
            original(...args);
            void handleUrlChange();
        };
    });
    window.addEventListener("yt-navigate-finish", handleUrlChange);

    await handleUrlChange();

    ClassifierPortConnection.onMessage(interceptComments);
}

window.addEventListener("load", async () => {
    const data = await LocalStorage.get({
        sizzle_enabled: true,
        sizzle_threshold: 60,
    });
    threshold = data.sizzle_threshold ?? 60;
    if (data.sizzle_enabled ?? true) {
        await addPageListener();
    }
});
