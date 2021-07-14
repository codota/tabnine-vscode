import * as vscode from "vscode";

export function withPolling(
  callback: (clear: () => void) => void,
  interval: number,
  timeout: number
): void {
  const pollingInterval = setInterval(() => callback(clearPolling), interval);

  const pollingTimeout = setTimeout(() => {
    clearInterval(pollingInterval);
  }, timeout);

  function clearPolling() {
    clearInterval(pollingInterval);
    clearTimeout(pollingTimeout);
  }
}

export async function assertFirstTimeReceived(
  key: string,
  context: vscode.ExtensionContext
): Promise<string | void> {
  return new Promise((resolve, reject) => {
    if (!context.globalState.get(key)) {
      void context.globalState.update(key, true).then(resolve, reject);
    } else {
      reject(new Error("Already happened"));
    }
  });
}

export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// eslint-disable-next-line
export function isFunction(functionToCheck: any): boolean {
  // eslint-disable-next-line
  return (
    functionToCheck && {}.toString.call(functionToCheck) === "[object Function]"
  );
}

export async function asyncFind<T>(
  arr: T[],
  predicate: (element: T) => Promise<boolean>
): Promise<T | null> {
  // eslint-disable-next-line no-restricted-syntax
  for await (const element of arr) {
    if (await predicate(element)) {
      return element;
    }
  }
  return null;
}
export function formatError(error: Error): string {
  return `OS: ${process.platform} - ${process.arch}\n Error: ${
    error.name
  }\nMessage: ${error.message}\nStack: ${error.stack || ""}`;
}

export function fromBase64(str: string): string {
  return Buffer.from(str, "base64").toString("utf8");
}

export function toBase64(str: string): string {
  return Buffer.from(str, "utf8").toString("base64");
}
