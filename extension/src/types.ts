export interface RenderData {
  isEnabled: boolean;
  qualityThreshold: number;
  boarding: boolean;
}

export enum ConnectionStates {
  UNSTARTED = 0,
  STARTED = 1,
  COMPLETED = 2,
}

export type ProgressData = {
  progress: number;
};

export type ClassificationData = {
  text: string,
  id: string
}

export type ClassificationResult = {
  result: number,
  id: string
}

export enum Actions {
  PROGRESS = "PROGRESS",
  START = "START",
  STOP = "STOP",
  RESUME = "RESUME",
}

export type MsgSource = "back" | "front";

export type SetupMessages = {
      category: "SETUP";
      from: MsgSource;
      action: Actions.PROGRESS;
      data: ProgressData;
    }
  | {
      category: "SETUP";
      from: MsgSource;
      action: Exclude<Actions, Actions.PROGRESS>;
    }

export type ClassificationMessages = {
      category: "CLASSIFICATION",
      from: "back",
      result: ClassificationResult
    }
  | {
      category: "CLASSIFICATION",
      from: "front",
      data: ClassificationData
  }

export type WakeMessage = {
  category: "WAKE_UP_CALL",
  from: "front"
}

export type Message = SetupMessages | ClassificationMessages | WakeMessage;

export interface Cache {
  cache_source: string;
  cache_name: string;
  cache_params?: RequestInit
}
