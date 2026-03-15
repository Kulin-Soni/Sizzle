import { useState, useEffect } from 'react'
import ToggleSwitch from './components/ToggleSwitch'
import MetricSlider from './components/MetricSlider'
import cn from './utils/utils'
import Onboarding from './components/Onboarding'
import Footer from './components/Footer'
import { RenderData } from './types'
import { LocalStorage } from './utils/storage'
import { MdDivider } from "react-material-web";

function App({...props}: RenderData) {
  
  const [isEnabled, setIsEnabled] = useState<boolean>(props.isEnabled);
  const [qualityThreshold, setQualityThreshold] = useState<number>(props.qualityThreshold);
  const [boarding, setBoarding] = useState<boolean>(props.boarding);

  useEffect(() => {
    LocalStorage.set({ skia_enabled: isEnabled });
  }, [isEnabled]);

  useEffect(() => {
    LocalStorage.set({ skia_threshold: qualityThreshold });
  }, [qualityThreshold]);

  useEffect(() => {
    LocalStorage.set({ onboarding: boarding });
  }, [boarding]);

  return (
    <div className="w-full h-full bg-[#1f2327] text-white flex flex-col overflow-hidden relative font-sans selection:bg-red-500/30">
      {boarding ? (<Onboarding setBoarding={setBoarding} />) :
        (<>
        <div className="z-10 w-full h-full flex flex-col justify-evenly items-center relative">
          <header className="w-full flex items-center justify-between px-5">
            <div className='flex flex-col'>
              <span className='text-2xl text-white font-google_bold'>Skia</span>
              <span className='text-[12px] font-google_semi text-zinc-400 font-semibold -mt-1 uppercase'>YT Comment Classifier</span>
            </div>
            <div className="flex items-center">
              <ToggleSwitch
                isOn={isEnabled}
                onToggle={() => setIsEnabled(!isEnabled)}
              />
            </div>
          </header>

          <MdDivider className='w-full opacity-50 px-5' />

          {/* Controls: Slider */}
          <div className="w-full flex flex-col items-center gap-2 min-h-0 relative">
            <div className="w-10/12 flex justify-between items-center">
              <label className={cn("text-sm font-google_semi font-bold transition-colors uppercase tracking-widest flex items-center gap-1.5", (!isEnabled) ? "text-zinc-800" : "text-zinc-400 ")}>
                Strictness
              </label>
              <span className={cn(`text-sm font-google_semi font-bold tabular-nums tracking-wide transition-colors`,
                (!isEnabled) ? "text-zinc-800" :
                  (qualityThreshold >= 30 && qualityThreshold <= 80)
                    ? 'text-emerald-500'
                    : 'text-(--theme)')}
              >
                {qualityThreshold}%
              </span>
            </div>
            <div className='w-full flex px-2'>
              <MetricSlider
                value={qualityThreshold}
                onChange={setQualityThreshold}
                disabled={!isEnabled}
              />
            </div>
          </div>
        </div>
        <Footer />
        </>)
      }
    </div>
  )
}

export default App