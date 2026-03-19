import { Message } from "../types";
import Model from "./model";
import Setup from "./setup";

const connectionManager = async (msg: Message) => {
  if (msg.category === "SETUP" && msg.from === "front") {
    await Setup.download();
  }
};

chrome.runtime.onMessage.addListener((msg: Message) => {
  connectionManager(msg);
  return { success: true };
});

chrome.runtime.onConnect.addListener(async (port)=>{
  if (port.name==="classifier") {
    await Model.instance();
    await Model.initiate();
    port.onMessage.addListener(async (msg: Message)=>{
      if (msg.category==="CLASSIFICATION" && msg.from==="front") {
        const prediction = await Model.predict(msg.data.text);
        const finalData: Message = {
          category: "CLASSIFICATION",
          from: "back",
          result: { result: prediction, id: msg.data.id }
        }
        console.log(msg.data.text, finalData);
        port.postMessage(finalData);
      }
    });
  }
});