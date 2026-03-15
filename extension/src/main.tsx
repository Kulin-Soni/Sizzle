import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RenderData } from './types.ts';
import { LocalStorage } from './utils/storage.ts';

const root = createRoot(document.getElementById('root')!);

const boot = async () => {
 const result = await LocalStorage.get({
  skia_enabled: true,
  skia_threshold: 60,
  onboarding: true
 });
 const initialState: RenderData = {
  isEnabled: result.skia_enabled ?? true,
  qualityThreshold: result.skia_threshold ?? 60,
  boarding: result.onboarding ?? true
 };

 root.render(
  <App {...initialState} />
 )
}
boot()
