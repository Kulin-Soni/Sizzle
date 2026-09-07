// background.ts
import browser, { Runtime } from "webextension-polyfill";
import { Message } from "../types";
import Model from "./model";
import Setup from "./setup";

browser.runtime.onMessage.addListener(async (message: unknown) => {
    const msg = message as Message;
    if (msg.category === "SETUP" && msg.from === "front") {
        return Setup.download().then(() => ({ success: true }));
    }
    return Promise.resolve({ success: true });
});

browser.runtime.onConnect.addListener((port: Runtime.Port) => {
    if (port.name !== "classifier") return;

    void (async () => {
        await Model.instance();
        await Model.initiate();

        port.onMessage.addListener(async (message) => {
            const msg = message as Message;
            if (msg.category !== "CLASSIFICATION" || msg.from !== "front")
                return;

            const prediction = await Model.predict(msg.data.text);
            const response: Message = {
                category: "CLASSIFICATION",
                from: "back",
                result: { result: prediction, id: msg.data.id },
            };
            port.postMessage(response);
        });
    })();
});
