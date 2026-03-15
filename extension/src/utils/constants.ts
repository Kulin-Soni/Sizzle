import { Cache } from "../types";

const MODEL_FILE_NAME = "onnx/model_quantized.onnx";
const TRANSFORMER_CACHE = "transformers-cache";
const WASM_CACHE: Cache = {
  cache_name: "wasm-cache",
  cache_source: "https://huggingface.co/buckets/kulinsoni/skia/resolve/ort-wasm-simd-threaded.jsep.wasm?download=true",
  cache_params: {
    headers: {
      'Accept-Encoding': 'identity'
    }
  }
}
const FILES_CACHE: Cache[] = [
  WASM_CACHE
];
const TOTAL_FILES_FOR_CACHE = FILES_CACHE.length + 1; // +1 for the model file managed by Transformer.js

export {
  MODEL_FILE_NAME,
  TRANSFORMER_CACHE,
  WASM_CACHE,
  FILES_CACHE,
  TOTAL_FILES_FOR_CACHE,
};
