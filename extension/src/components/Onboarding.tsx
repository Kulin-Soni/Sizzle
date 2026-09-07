import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Actions, ConnectionStates, Message } from '../types';
import { LocalStorage } from '../utils/storage';
import browser, { Runtime } from "webextension-polyfill"

interface OnboardingProps {
  setBoarding: Dispatch<SetStateAction<boolean>>
}

type MessageResponse = { success: boolean };

const Onboarding: React.FC<OnboardingProps> = ({ setBoarding }) => {
  const [buttonLabel, setButtonLabel] = useState<string>("0%");
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);

  const setup = async (): Promise<void> => {
    setButtonDisabled(true);
    const outgoing: Message = { category: "SETUP", from: "front", action: Actions.START };
    await browser.runtime.sendMessage(outgoing);
  };

  useEffect(() => {
    const listener: Runtime.OnMessageListener = (message: unknown, ..._: unknown[]) => {
      const msg = message as Message;

      return (async (): Promise<MessageResponse> => {
        if (msg.category === "SETUP" && msg.from === "back") {
          if (msg.action === Actions.STOP) {
            await LocalStorage.set({ connection_state: ConnectionStates.COMPLETED });
            setBoarding(false);

          } else if (msg.action === Actions.PROGRESS) {
            setButtonLabel(`${Math.round(msg.data.progress)}%`);
            if (!buttonDisabled) setButtonDisabled(true);
          }
        }
        return { success: true };
      })();
    };

    browser.runtime.onMessage.addListener(listener);

    LocalStorage.get({
      connection_state: ConnectionStates.UNSTARTED,
      connection_progress: 0
    }).then(async (res) => {
      const connectionState = res.connection_state ?? ConnectionStates.UNSTARTED;
      const connectionProgress = res.connection_progress ?? 0;

      setButtonDisabled(connectionState === ConnectionStates.STARTED);
      if (connectionProgress) {
        setButtonLabel(`${Math.round(connectionProgress)}%`);
      }
      if (connectionProgress === 100) {
        setBoarding(false);
      }
      if (connectionState !== ConnectionStates.COMPLETED || connectionProgress !== 100) {
        await setup();
      }
    });

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    }
  }, [])

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <span className='font-google_semi text-lg text-center w-3/4 mb-1.5'>One-time setup required</span>
      <span className='font-google_semi text-[12px] text-white/70 text-center w-10/12 mb-2.5'>We will download some necessary files, don't worry they're safe.</span>
      <div className='flex justify-center items-center'>
        <span className='w-full font-google_bold text-sm tabular-nums'>Progress: {buttonLabel}</span>
      </div>
      <div className='w-10/12 flex items-center justify-center mt-2.5'>
        <span className='font-google_semi text-center text-[12px] text-white/70'>Please do not close the browser or progress will be lost.</span>
      </div>
    </div>
  )
}

export default Onboarding