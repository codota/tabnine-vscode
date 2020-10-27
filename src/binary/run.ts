import * as child_process from "child_process";
import { fetchBinary } from "./versionFetcher";
import { tabnineContext } from "../extensionContext";

export function runTabNine(
  additionalArgs: string[] = [],
  inheritStdio = false
): child_process.ChildProcess {
  const command = fetchBinary();

  const args: string[] = [
    "--client=vscode",
    "--no-lsp=true",
    tabnineContext.logFilePath
      ? `--log-file-path=${tabnineContext.logFilePath}`
      : null,
    "--client-metadata",
    `clientVersion=${tabnineContext.vscodeVersion}`,
    `pluginVersion=${tabnineContext.version}`,
    `t9-vscode-AutoImportEnabled=${tabnineContext.isTabNineAutoImportEnabled}`,
    `t9-vscode-TSAutoImportEnabled=${tabnineContext.isTypeScriptAutoImports}`,
    `t9-vscode-JSAutoImportEnabled=${tabnineContext.isJavaScriptAutoImports}`,
    `vscode-remote=${tabnineContext.isRemote}`,
    `vscode-remote-name=${tabnineContext.remoteName}`,
    `vscode-extension-kind=${tabnineContext.extensionKind}`,
    ...additionalArgs,
  ].filter((i): i is string => i !== null);

  return child_process.spawn(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
  });
}
