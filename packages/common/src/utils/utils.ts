import * as vscode from "vscode";
import * as url from "url";
import { promises as fs } from "fs";
import * as path from "path";

export function withPolling(
  callback: (clear: () => void) => void | Promise<void>,
  interval: number,
  timeout: number,
  shouldImmediatelyInvoke = false,
  onTimeout = () => {}
): void {
  const pollingInterval = setInterval(
    () => void callback(clearPolling),
    interval
  );

  const pollingTimeout = setTimeout(() => {
    clearInterval(pollingInterval);
    onTimeout();
  }, timeout);

  function clearPolling() {
    clearInterval(pollingInterval);
    clearTimeout(pollingTimeout);
  }

  if (shouldImmediatelyInvoke) {
    void callback(clearPolling);
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

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function trimEnd(str: string, suffix: string): string {
  return str.replace(new RegExp(`${escapeRegExp(suffix)}$`), "");
}

export function escapeTabStopSign(value: string): string {
  return value.replace(new RegExp("\\$", "g"), "\\$");
}

export function isMultiline(text?: string): boolean {
  return text?.includes("\n") || false;
}

export async function timed<T>(
  fn: () => Promise<T>
): Promise<{ time: number; value: T }> {
  const time = process.hrtime();
  const value = await fn();
  const after = hrtimeToMs(process.hrtime(time));
  return { time: after, value };
}

export function hrtimeToMs(hrtime: [number, number]): number {
  const seconds = hrtime[0];
  const nanoseconds = hrtime[1];
  return seconds * 1000 + nanoseconds / 1000000;
}

export function host(targetUrl: string): string | undefined {
  const { host: targetHost } = url.parse(targetUrl);

  return targetHost ?? undefined;
}

const EXECUTABLE_FLAG = 0o755;
// eslint-disable-next-line import/prefer-default-export
export async function setDirectoryFilesAsExecutable(
  bundleDirectory: string
): Promise<void[]> {
  if (isWindows()) {
    return Promise.resolve([]);
  }
  const files = await fs.readdir(bundleDirectory);
  return Promise.all(
    files.map((file) =>
      fs.chmod(path.join(bundleDirectory, file), EXECUTABLE_FLAG)
    )
  );
}

function isWindows(): boolean {
  return process.platform === "win32";
}

export default function getTabSize(): number {
  const tabSize = vscode.window.activeTextEditor?.options.tabSize;
  if (typeof tabSize !== "number") {
    return 4;
  }
  return tabSize;
}
