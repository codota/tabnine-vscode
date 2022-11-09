import * as vscode from "vscode";

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

export function constructSnippetString(
  currentLine: vscode.TextLine,
  new_prefix: string,
  new_suffix?: string
): vscode.SnippetString {
  const regexToReplaceWhitespaceAtNewLine = new RegExp(
    `\\n{1}||^${currentLine.isEmptyOrWhitespace ? currentLine.text : ""}`,
    "g"
  );

  let text = new_prefix;
  if (currentLine.isEmptyOrWhitespace) {
    text = new_prefix.replace(regexToReplaceWhitespaceAtNewLine, "");
  }

  let snippet = new vscode.SnippetString(escapeTabStopSign(text));
  if (new_suffix) {
    snippet = new vscode.SnippetString(
      escapeTabStopSign(new_prefix.trimRight())
    );
    snippet.appendTabstop(0).appendText(escapeTabStopSign(new_suffix));
  }
  return snippet;
}
