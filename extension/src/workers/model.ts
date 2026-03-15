import {
  env,
  FeatureExtractionPipeline,
  pipeline,
  ProgressInfo,
} from "@huggingface/transformers";
import { LocalStorage } from "../utils/storage";
import { ConnectionStates } from "../types";
import modelURL from "./model/weights.json?url";
import { MODEL_FILE_NAME, WASM_CACHE } from "../utils/constants";
import CacheManager from "../utils/cache";

class Model {
  private static _instance: Model;
  static model: FeatureExtractionPipeline | undefined;
  static isDownloaded: boolean;
  static modelData: {coef: number[], intercept: number}

  private constructor() {}

  // Create a single instance
  static async instance(): Promise<Model> {
    if (!Model._instance) {
      await this.init();
      Model._instance = new Model();
    }
    return Model._instance;
  }

  // Some initializations which is need to be done only the first time the model instance is asked
  private static async init() {
    env.useBrowserCache = true;

    const cacheManager = new CacheManager(WASM_CACHE.cache_source, WASM_CACHE.cache_name, {});
    const buffer = await cacheManager.retrieve();
    if (buffer && env.backends.onnx.wasm) {
      env.backends.onnx.wasm.wasmBinary = buffer;
    } else {
      throw Error("WASM could not be retrieved.")
    }

    if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;

    const res = await fetch(modelURL);
    this.modelData = await res.json();

    await this.checkDownloaded();
  }

  // Check if model is downloaded
  private static async checkDownloaded() {
    const res = await LocalStorage.get([
      "connection_progress",
      "connection_state",
    ]);
    if (
      res.connection_progress === 100 &&
      res.connection_state === ConnectionStates.COMPLETED
    ) {
      Model.isDownloaded = true;
      return true;
    } else {
      Model.isDownloaded = false;
      return false;
    }
  }

  // Initialize model and download files
  static async initiate(
    progress_callback?: (p: number) => Promise<any> | any,
  ): Promise<void> {

    if (this.model) return;

    this.model = (await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      {
        dtype: "q8",
        progress_callback: async (p: ProgressInfo) => {
          if ("progress" in p && ("file" in p && p.file == MODEL_FILE_NAME)) {
            progress_callback && (await progress_callback(p.progress));
          }
        },
      },
    )) as unknown as FeatureExtractionPipeline;
  }

  // Checks if model should be initialized by checking if model is downloaded and already initialized
  static async shouldInitiate(): Promise<boolean> {
    const downloaded = await this.checkDownloaded(); // We check the db again if model is downloaded (because state is not updated live)
    return downloaded ? !this.model : true;
  }

  // Predict quality of comment using model
  static async predict(text: string): Promise<number> {
    if (!this.model || !this.isDownloaded) {
      throw Error("Model not downloaded or initiated! Run the initiate command first.");
    }

    const { coef, intercept } = this.modelData;
    const output = await this.model(text, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = Array.from(output);
    const score = embedding.reduce(
      (sum, val, i) => sum + val * coef[i],
      intercept,
    );
    return Math.max(0, Math.min(1, score));
  }
}

export default Model;
