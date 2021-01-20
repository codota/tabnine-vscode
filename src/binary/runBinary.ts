import fetchBinaryPath from "./fetchBinaryPath";
import { tabnineContext } from "../extensionContext";
import { BinaryProcessRun, runProcess } from "./runProcess";

export default function runBinary(
  additionalArgs: string[] = [],
  inheritStdio = false
): BinaryProcessRun {
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
    `vscode-theme-name=${tabnineContext.themeName ?? "unknown"}`,
    `vscode-theme-kind=${tabnineContext.themeKind}`,
    `vscode-status-customization=${
      tabnineContext.statusBarColorCustomizations ?? "unknown"
    }`,
    ...additionalArgs,
  ].filter((i): i is string => i !== null);

  return runProcess(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
  });
}
