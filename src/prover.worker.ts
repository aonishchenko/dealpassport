import { groth16 } from "snarkjs";
self.onmessage = async (event: MessageEvent<Record<string, unknown>>) => {
  const start = performance.now();
  try {
    const result = await groth16.fullProve(
      event.data,
      "/proof/eligibility.wasm",
      "/proof/eligibility.zkey",
      undefined,
      undefined,
      { singleThread: true },
    );
    self.postMessage({
      ok: true,
      ...result,
      milliseconds: Math.round(performance.now() - start),
    });
  } catch {
    self.postMessage({
      ok: false,
      milliseconds: Math.round(performance.now() - start),
    });
  }
};
