import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { RenderData } from "./types.ts";
import { LocalStorage } from "./utils/storage.ts";

const root = createRoot(document.getElementById("root")!);

const boot = async () => {
    const result = await LocalStorage.get({
        sizzle_enabled: true,
        sizzle_threshold: 60,
        onboarding: true,
    });
    const initialState: RenderData = {
        isEnabled: result.sizzle_enabled ?? true,
        qualityThreshold: result.sizzle_threshold ?? 60,
        boarding: result.onboarding ?? true,
    };

    root.render(<App {...initialState} />);
};
boot();
