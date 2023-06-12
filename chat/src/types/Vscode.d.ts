interface VsCodeApi {
  postMessage(msg: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
}
declare function acquireVsCodeApi(): VsCodeApi;
