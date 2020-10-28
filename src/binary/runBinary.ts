import * as child_process from "child_process";
import fetchBinaryPath from "./fetchBinaryPath";
import { tabnineContext } from "../extensionContext";

export default function runBinary(
  additionalArgs: string[] = [],
  inheritStdio = false
): child_process.ChildProcess {
  const command = fetchBinaryPath();

  const args: string[] = [
    "--client=vscode",
    "--no-lsp=true",
    tabnineContext.logFilePath
      ? `--log-file-path=${tabnineContext.logFilePath}`
      : null,
    "--client-metadata",
    `clientVersion=${tabnineContext.vscodeVersion}`,
    `pluginVersion=${tabnineContext.version ?? "unknown"}`,
    `t9-vscode-AutoImportEnabled=${tabnineContext.isTabNineAutoImportEnabled}`,
    `t9-vscode-TSAutoImportEnabled=${
      tabnineContext.isTypeScriptAutoImports ?? "unknown"
    }`,
    `t9-vscode-JSAutoImportEnabled=${
      tabnineContext.isJavaScriptAutoImports ?? "unknown"
    }`,
    `vscode-remote=${tabnineContext.isRemote}`,
    `vscode-remote-name=${tabnineContext.remoteName}`,
    `vscode-extension-kind=${tabnineContext.extensionKind}`,
    ...additionalArgs,
  ].filter((i): i is string => i !== null);

  return child_process.spawn(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
  });
}
