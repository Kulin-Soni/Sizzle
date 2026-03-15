import { Message } from "../types";
import Setup from "./setup";

const connectionManager = async (msg: Message) => {
  if (msg.category === "SETUP" && msg.from === "front") {
    await Setup.download();
  }
};

chrome.runtime.onMessage.addListener(async (msg: Message) => {
  await connectionManager(msg);
  return { success: true };
});
