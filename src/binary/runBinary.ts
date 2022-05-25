import * as vscode from "vscode";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import fetchBinaryPath from "./binaryFetcher";
import { BinaryProcessRun, runProcess } from "./runProcess";
import { getCurrentVersion } from "../preRelease/versions";
import { getTabnineExtensionContext } from "../globals/tabnineExtensionContext";

export default async function runBinary(
  additionalArgs: string[] = [],
  inheritStdio = false
): Promise<BinaryProcessRun> {
  const command = await fetchBinaryPath();

  const context = getTabnineExtensionContext();
  const args: string[] = [
    "--client=vscode",
    "--no-lsp=true",
    tabnineExtensionProperties.logFilePath
      ? `--log-file-path=${tabnineExtensionProperties.logFilePath}`
      : null,
    tabnineExtensionProperties.logLevel
      ? `--log-level=${tabnineExtensionProperties.logLevel}`
      : null,
    "--client-metadata",
    `clientVersion=${tabnineExtensionProperties.vscodeVersion}`,
    `pluginVersion=${(context && getCurrentVersion(context)) || "unknown"}`,
    `t9-vscode-AutoImportEnabled=${tabnineExtensionProperties.isTabNineAutoImportEnabled}`,
    `t9-vscode-TSAutoImportEnabled=${
      tabnineExtensionProperties.isTypeScriptAutoImports ?? "unknown"
    }`,
    `t9-vscode-JSAutoImportEnabled=${
      tabnineExtensionProperties.isJavaScriptAutoImports ?? "unknown"
    }`,
    `vscode-telemetry-enabled=${tabnineExtensionProperties.isVscodeTelemetryEnabled}`,
    `vscode-remote=${tabnineExtensionProperties.isRemote}`,
    `vscode-remote-name=${tabnineExtensionProperties.remoteName}`,
    `vscode-extension-kind=${tabnineExtensionProperties.extensionKind}`,
    `vscode-theme-name=${tabnineExtensionProperties.themeName ?? "unknown"}`,
    `vscode-theme-kind=${tabnineExtensionProperties.themeKind}`,
    `vscode-machine-id=${vscode.env.machineId}`,
    `vscode-is-new-app-install=${vscode.env.isNewAppInstall}`,
    `vscode-session-id=${vscode.env.sessionId}`,
    `vscode-language=${vscode.env.language}`,
    `vscode-app-name=${vscode.env.appName}`,
    `vscode-beta-channel-enabled=${tabnineExtensionProperties.isExtentionBetaChannelEnabled}`,
    `vscode-status-customization=${
      tabnineExtensionProperties.statusBarColorCustomizations ?? "unknown"
    }`,
    ...additionalArgs,
  ].filter((i): i is string => i !== null);

  return runProcess(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
  });
}
