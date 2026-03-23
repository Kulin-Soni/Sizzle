import { Message } from "../types";
import { LocalStorage } from "../utils/storage";

let enabled: boolean;
let threshold: number = 60;

class ClassifierPortConnection {
  static port: chrome.runtime.Port | null = null;
  private constructor() {}

  private static async init() {
    if (!this.port) {
      this.port = chrome.runtime.connect({name: "classifier"});
      this.port.onDisconnect.addListener(async ()=>{
        this.port = null;
      })
    }
  }

  static async receiver(callback: (msg: Message)=>Promise<any> | any) {
    await this.init();

    this.port?.onMessage.addListener(async (msg: Message)=>{
      await callback(msg);
    })
  }

  static async send(text: string, id: string) {
    await this.init();

    this.port?.postMessage({
      category: "CLASSIFICATION",
      from: "front",
      data: { text: text, id: id }
    } as Message);
  }
}


async function waitForElement(parent: Node, selector: string): Promise<Element | void> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
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
    out += n.nodeName === "IMG" ? (n as HTMLImageElement).alt : n.nodeType === Node.TEXT_NODE ? n.textContent : "";
  }
  return out.trim();
}

function checkValidity() {
  const re = /^https:\/\/(www\.)?youtube\.com\/(watch\?v=[\w-]+|live\/[\w-]+)([?&].*)?$/;
  return re.test(document.URL);
}

function cleanGhostRenderers(node: Element) {
  const ghosts = node.querySelectorAll("ytd-continuation-item-renderer.ytd-item-section-renderer");
  for (let i = 0; i < ghosts.length - 1; i++) {
    ghosts[i].remove();
  }
}

async function getRenderedComments(mutations: MutationRecord[]) {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) {
        const span = node.querySelector("#comment-container #comment #body #main #expander #content #content-text span");
        const text = span && extractText(span);
        if (text && node.matches("ytd-comment-thread-renderer")) {
          if (node instanceof HTMLElement) node.style.visibility = 'hidden';
          const uuid = "skia" + crypto.randomUUID();
          node.id = uuid;
          ClassifierPortConnection.send(text, uuid);
        }
      }
    }
  }
}

async function interceptComments(msg: Message) {
  if (msg.category==="CLASSIFICATION" && msg.from==="back") {
    const node = document.getElementById(msg.result.id);
    if (msg.result.result<(threshold/100)) {
      node?.remove();
    } else if (node instanceof HTMLElement) {
      node.style.visibility = 'visible';
    }
  }
}

async function addCommentListener() {
  const commentsElement = await waitForElement(
    document,
    "#below ytd-comments ytd-item-section-renderer #contents"
  );
  if (commentsElement) {
    const observer = new MutationObserver(
      async (mutations: MutationRecord[]) => {
        await getRenderedComments(mutations);
        cleanGhostRenderers(commentsElement);
      });
    observer.observe(commentsElement, { childList: true });
    return observer;
  }
}

async function addPageListener() {
  console.log(`Extension loaded with threshold ${threshold/100}!`);

  let previousObserver: MutationObserver | null = null;
  async function handleUrlChange() {
    previousObserver?.disconnect();
    await chrome.runtime.sendMessage({category: "WAKE_UP_CALL", from: "front"} as Message);
    if (checkValidity()) {
      const currentObserver = await addCommentListener();
      if (currentObserver) previousObserver = currentObserver;
    }
  }

  const _push = history.pushState.bind(history);
  const _replace = history.replaceState.bind(history);
  history.pushState = function (...args) {
    _push(...args);
    handleUrlChange();
  };
  history.replaceState = function (...args) {
    _replace(...args);
    handleUrlChange();
  };
  window.addEventListener("yt-navigate-finish", handleUrlChange);

  await handleUrlChange();

  ClassifierPortConnection.receiver(async (msg)=>{
    await interceptComments(msg);
  })
}

window.addEventListener("load", async () => {
  const data = await LocalStorage.get({
    skia_enabled: true,
    skia_threshold: 60,
  }); // already handles when value is not available
  enabled = data.skia_enabled as boolean;
  threshold = data.skia_threshold as number;
  enabled && await addPageListener();
});
