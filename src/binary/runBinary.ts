import * as vscode from "vscode";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import fetchBinaryPath from "./binaryFetcher";
import { BinaryProcessRun, runProcess } from "./runProcess";
import { getCurrentVersion } from "../preRelease/versions";
import { getTabnineExtensionContext } from "../globals/tabnineExtensionContext";
import { ONPREM } from "../onPrem";
import { getProxySettings } from "../proxyProvider";
import { host } from "../utils/utils";
import MisconfigurationError from "../misconfigurationError";

export default async function runBinary(
  additionalArgs: string[] = [],
  inheritStdio = false
): Promise<BinaryProcessRun> {
  const command = await fetchBinaryPath();
  const context = getTabnineExtensionContext();
  const proxySettings = tabnineExtensionProperties.useProxySupport
    ? getProxySettings()
    : undefined;
  const noProxy =
    !tabnineExtensionProperties.useProxySupport &&
    tabnineExtensionProperties.cloudHost
      ? host(tabnineExtensionProperties.cloudHost)
      : undefined;
  const { businessDivision, cloudHost } = tabnineExtensionProperties;
  if (!businessDivision || !cloudHost) {
    throw new MisconfigurationError(
      "You need to specify a business division and a cloud host to run on prem binary"
    );
  }

  const args: string[] = [
    "--client=vscode",
    "--no-lsp=true",
    tabnineExtensionProperties.logFilePath
      ? `--log-file-path=${tabnineExtensionProperties.logFilePath}`
      : null,
    ONPREM ? "--no_bootstrap" : null,
    tabnineExtensionProperties.logLevel
      ? `--log-level=${tabnineExtensionProperties.logLevel}`
      : null,
    `--cloud2_url=${tabnineExtensionProperties.cloudHost as string}`, // we do check it before, TS bug?
    "--client-metadata",
    `clientVersion=${tabnineExtensionProperties.vscodeVersion}`,
    `pluginVersion=${(context && getCurrentVersion(context)) || "unknown"}`,
    `businessDivision="${
      tabnineExtensionProperties.businessDivision as string // we do check it before, TS bug?
    }"`,
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
    `vscode-beta-channel-enabled=${tabnineExtensionProperties.isExtensionBetaChannelEnabled}`,
    `vscode-status-customization=${
      tabnineExtensionProperties.statusBarColorCustomizations ?? "unknown"
    }`,
    `vscode-inline-api-enabled=${
      tabnineExtensionProperties.isVscodeInlineAPIEnabled ?? "unknown"
    }`,
    ...additionalArgs,
  ].filter((i): i is string => i !== null);

  return runProcess(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
    env: {
      ...process.env,
      no_proxy: noProxy,
      NO_PROXY: noProxy,
      https_proxy: proxySettings,
      HTTPS_PROXY: proxySettings,
      http_proxy: proxySettings,
      HTTP_PROXY: proxySettings,
    },
  });
}
