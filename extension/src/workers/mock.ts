export async function mockPipeline(
  task: string,
  model: string,
  { progress_callback }: { progress_callback?: (p: number) => void } = {}
) {
  let p = 0;
  const interval = setInterval(() => {
    p += 1/100;
    progress_callback?.(Math.min(p, 1));

    if (p >= 1) clearInterval(interval);
  }, 200);
  return () => {};
}