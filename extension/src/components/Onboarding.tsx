import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Actions, ConnectionStates, Message } from '../types';
import { LocalStorage } from '../utils/storage';

interface OnboardingProps {
  setBoarding: Dispatch<SetStateAction<boolean>>
}
const Onboarding: React.FC<OnboardingProps> = ({ setBoarding }) => {
  const [buttonLabel, setButtonLabel] = useState<string>("0%");
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);

  const setup = async () => {
    setButtonDisabled(true);
    await chrome.runtime.sendMessage({ category: "SETUP", from: "front", action: Actions.START } as Message);
  };

  useEffect(() => {
    // Add message listener
    const listener = async (msg: Message) => {
      if (msg.category === "SETUP" && msg.from === "back") {
        if (msg.action === Actions.STOP) {
          await LocalStorage.set({ connection_state: ConnectionStates.COMPLETED });
          setBoarding(false);

        } else if (msg.action === Actions.PROGRESS) {
          setButtonLabel(`${Math.round(msg.data.progress)}%`);
          if (!buttonDisabled) setButtonDisabled(true);
        }
      }
    }
    chrome.runtime.onMessage.addListener(async (msg) => { await listener(msg); return { success: true }; });

    // Check for already existing states
    LocalStorage.get({ connection_state: ConnectionStates.UNSTARTED, connection_progress: 0 }).then(async (res) => {
      setButtonDisabled(res.connection_state === ConnectionStates.STARTED);
      (res.connection_progress) && setButtonLabel(`${Math.round(res.connection_progress)}%`);
      (res.connection_progress==100) && setBoarding(false);
      if (res.connection_state !== ConnectionStates.COMPLETED || res.connection_progress !== 100) {
        await setup();
      }
    });

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
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
