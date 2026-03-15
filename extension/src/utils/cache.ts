class CacheManager {
  private url: string;
  private cacheName: string;
  private params: RequestInit;
  private data: ArrayBuffer | undefined;

  constructor(url: string, cacheName: string, params: RequestInit) {
    this.url = url;
    this.cacheName = cacheName;
    this.params = params;
  }

  private async download(url: string, onProgress?: (progress: number) => Promise<any> | any) {
  const res = await fetch(url, this.params);
  if (!res.ok) throw new Error("Failed to load file!");

  const total = Number(res.headers.get('content-length') || 0);
  const reader = res.body!.getReader();
  let loaded = 0;
  const chunks: Uint8Array<ArrayBuffer>[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (total && onProgress) {
      await onProgress(Math.round((loaded / total) * 100));
    }
  }
  return new Response(new Blob(chunks));
}

  async save(onProgress?: (progress: number)=> Promise<any> | any) {
    const cache = await caches.open(this.cacheName);
    const data = await this.download(this.url, (p)=>{onProgress && onProgress(p)});
    if (data) {
     await cache.put(this.url, data);
    } else {
     throw Error("Could not fetch resource wasm file for onnx model.")
    }
  }

  async retrieve(): Promise<ArrayBuffer | null> {
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(this.url);
    if (!response) return null;
    if (this.data) return this.data;

    this.data = await response.arrayBuffer();
    return this.data;
  }
}


export default CacheManager;