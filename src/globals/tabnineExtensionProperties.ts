import * as vscode from "vscode";
import { getTabnineExtensionContext } from "./tabnineExtensionContext";
import {
  CA_CERTS_CONFIGURATION,
  IGNORE_CERTIFICATE_ERRORS_CONFIGURATION,
  USE_PROXY_CONFIGURATION,
} from "../enterprise/consts";

const TELEMETRY_CONFIG_ID = "telemetry";
const TELEMETRY_CONFIG_ENABLED_ID = "enableTelemetry";

type ColorCustomizations = {
  "statusBar.background": string;
};

interface TabNineExtensionProperties {
  extensionPath: string | undefined;
  version: string;
  name: string;
  vscodeVersion: string;
  isTabNineAutoImportEnabled: number | boolean;
  isTypeScriptAutoImports: boolean | undefined;
  isJavaScriptAutoImports: boolean | undefined;
  id: string;
  logFilePath: string;
  logLevel: string | undefined;
  isRemote: boolean;
  remoteName: string | undefined;
  extensionKind: number;
  themeKind: string;
  themeName: string | undefined;
  statusBarColorCustomizations: string | undefined;
  isInstalled: boolean;
  isVscodeTelemetryEnabled: boolean;
  isExtensionBetaChannelEnabled: boolean;
  isVscodeInsiders: boolean;
  codeReviewBaseUrl: string;
  isVscodeInlineAPIEnabled: boolean | undefined;
  useProxySupport: boolean;
  packageName: string;
  logEngine: boolean | undefined;
  caCerts: string | undefined;
  ignoreCertificateErrors: boolean;
  codeLensEnabled: boolean | undefined;
}

function getContext(): TabNineExtensionProperties {
  const configuration = vscode.workspace.getConfiguration();
  const isJavaScriptAutoImports = configuration.get<boolean>(
    "javascript.suggest.autoImports"
  );
  const isTypeScriptAutoImports = configuration.get<boolean>(
    "typescript.suggest.autoImports"
  );
  const autoImportConfig = "tabnine.experimentalAutoImports";
  const logFilePath = configuration.get<string>("tabnine.logFilePath");
  const logLevel = configuration.get<string>("tabnine.logLevel");
  let isTabNineAutoImportEnabled = configuration.get<boolean | null | number>(
    autoImportConfig
  );
  const isInstalled = isTabNineAutoImportEnabled === null;

  if (isTabNineAutoImportEnabled !== false) {
    isTabNineAutoImportEnabled = true;
    void configuration.update(
      autoImportConfig,
      isTabNineAutoImportEnabled,
      true
    );
  }
  const isExtensionBetaChannelEnabled =
    configuration.get<boolean>("tabnine.receiveBetaChannelUpdates") || false;

  const useProxySupport = Boolean(
    configuration.get<boolean>(USE_PROXY_CONFIGURATION)
  );

  const isVscodeInsiders = vscode.env.appName
    .toLocaleLowerCase()
    .includes("insider");

  return {
    get extensionPath(): string | undefined {
      return getTabnineExtensionContext().extension.extensionPath;
    },
    get packageName(): string {
      return packageName();
    },

    get version(): string {
      return version();
    },
    get id() {
      return getTabnineExtensionContext().extension.id;
    },

    get name(): string {
      return `${packageName()}-${version() ?? "unknown"}`;
    },
    get vscodeVersion(): string {
      return vscode.version;
    },
    get isTabNineAutoImportEnabled(): boolean | number {
      return !!isTabNineAutoImportEnabled;
    },
    get isJavaScriptAutoImports(): boolean | undefined {
      return isJavaScriptAutoImports;
    },
    get isTypeScriptAutoImports(): boolean | undefined {
      return isTypeScriptAutoImports;
    },
    get logFilePath(): string {
      return logFilePath ? `${logFilePath}-${process.pid}` : "";
    },
    get useProxySupport(): boolean {
      return useProxySupport;
    },
    get caCerts(): string | undefined {
      return configuration.get<string>(CA_CERTS_CONFIGURATION);
    },
    get ignoreCertificateErrors(): boolean {
      return !!configuration.get<boolean>(
        IGNORE_CERTIFICATE_ERRORS_CONFIGURATION
      );
    },
    get logLevel(): string | undefined {
      return logLevel;
    },
    get isRemote(): boolean {
      const isRemote = !!remoteName() && extensionKind() === 2;
      return isRemote;
    },
    get remoteName(): string | undefined {
      return remoteName();
    },
    get extensionKind(): number {
      return extensionKind();
    },
    get themeKind(): string {
      return vscode.ColorThemeKind[vscode.window.activeColorTheme.kind];
    },
    get themeName(): string | undefined {
      const workbenchConfig = getWorkbenchSettings();
      return workbenchConfig.get<string>("colorTheme");
    },
    get statusBarColorCustomizations(): string | undefined {
      const workbenchConfig = getWorkbenchSettings();
      const colorCustomizations = workbenchConfig.get<ColorCustomizations>(
        "colorCustomizations"
      );
      return colorCustomizations?.["statusBar.background"];
    },
    get isInstalled(): boolean {
      return isInstalled;
    },
    get isVscodeTelemetryEnabled(): boolean {
      // This peace of code is taken from https://github.com/microsoft/vscode-extension-telemetry/blob/260c7c3a5a47322a43e8fcfce66cd96e85b886ae/src/telemetryReporter.ts#L46
      const telemetrySectionConfig = vscode.workspace.getConfiguration(
        TELEMETRY_CONFIG_ID
      );
      const isTelemetryEnabled = telemetrySectionConfig.get<boolean>(
        TELEMETRY_CONFIG_ENABLED_ID,
        true
      );

      return isTelemetryEnabled;
    },
    get isExtensionBetaChannelEnabled(): boolean {
      return isExtensionBetaChannelEnabled;
    },
    get isVscodeInsiders(): boolean {
      return isVscodeInsiders;
    },
    get codeReviewBaseUrl(): string {
      return (
        configuration.get<string>("tabnine.codeReviewBaseUrl") ??
        "https://api.tabnine.com/code-review/"
      );
    },
    get isVscodeInlineAPIEnabled(): boolean | undefined {
      const INLINE_API_KEY = "editor.inlineSuggest.enabled";
      if (configuration.has(INLINE_API_KEY)) {
        return configuration.get<boolean>(INLINE_API_KEY, false);
      }
      return undefined;
    },
    get logEngine(): boolean | undefined {
      return configuration.get<boolean>("tabnine.logEngine");
    },
    get codeLensEnabled(): boolean | undefined {
      return configuration.get<boolean>("tabnine.codeLensEnabled");
    },
  };
}

function getWorkbenchSettings() {
  return vscode.workspace.getConfiguration("workbench");
}

const tabnineExtensionProperties: TabNineExtensionProperties = getContext();

export default tabnineExtensionProperties;

function packageName(): string {
  return (
    (getTabnineExtensionContext().extension.packageJSON as { name: string })
      ?.name || ""
  );
}

function version(): string {
  return (getTabnineExtensionContext().extension.packageJSON as {
    version: string;
  }).version;
}

function remoteName(): string | undefined {
  return vscode.env.remoteName;
}

function extensionKind(): number {
  return getTabnineExtensionContext().extension.extensionKind as number;
}
