import * as semver from "semver";
import * as vscode from "vscode";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import fetchBinaryPath from "./binaryFetcher";
import { BinaryProcessRun, runProcess } from "./runProcess";
import { getCurrentVersion } from "../preRelease/versions";
import { getTabnineExtensionContext } from "../globals/tabnineExtensionContext";
import { getProxySettings } from "../proxyProvider";
import { versionOfPath } from "./paths";
import { TLS_CONFIG_MIN_SUPPORTED_VERSION } from "../globals/consts";

export default async function runBinary(
  additionalArgs: string[] = [],
  inheritStdio = false
): Promise<BinaryProcessRun> {
  const [runArgs, metadata] = splitArgs(additionalArgs);
  const command = await fetchBinaryPath();
  const version = versionOfPath(command);
  const context = getTabnineExtensionContext();
  const tlsConfig =
    version && semver.gte(version, TLS_CONFIG_MIN_SUPPORTED_VERSION)
      ? [
          "--tls_config",
          `insecure=${tabnineExtensionProperties.ignoreCertificateErrors}`,
        ]
      : [];
  const proxySettings = tabnineExtensionProperties.useProxySupport
    ? getProxySettings()
    : undefined;
  const args: string[] = [
    ...tlsConfig,
    "--no-lsp=true",
    tabnineExtensionProperties.logEngine ? `--log_to_stderr` : null,
    tabnineExtensionProperties.logFilePath
      ? `--log-file-path=${tabnineExtensionProperties.logFilePath}`
      : null,
    tabnineExtensionProperties.logLevel
      ? `--log-level=${tabnineExtensionProperties.logLevel}`
      : null,
    ...runArgs,
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
    tabnineExtensionProperties.remoteName
      ? `vscode-remote-name=${tabnineExtensionProperties.remoteName}`
      : null,
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
    `vscode-code-lens-enabled=${
      tabnineExtensionProperties.codeLensEnabled ?? "unknown"
    }`,
    ...metadata,
  ].filter((i): i is string => i !== null);

  // we want to fix the binary version when running evaluation,
  // without the bootstrapper swapping versions underneath our feet.
  if (process.env.IS_EVAL_MODE) {
    args.push("--no_bootstrap");
  }

  return runProcess(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
    env: {
      ...process.env,
      https_proxy: proxySettings,
      HTTPS_PROXY: proxySettings,
      http_proxy: proxySettings,
      HTTP_PROXY: proxySettings,
    },
  });
}
function splitArgs(args: string[]): [string[], string[]] {
  return args.reduce<[string[], string[]]>(
    (items, item: string) => {
      if (item.startsWith("--")) {
        items[0].push(item);
      } else {
        items[1].push(item);
      }
      return items;
    },
    [[], []]
  );
}
