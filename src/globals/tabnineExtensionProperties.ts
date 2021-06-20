import * as vscode from "vscode";

const EXTENSION_SUBSTRING = "tabnine-vscode";
const TELEMETRY_CONFIG_ID = "telemetry";
const TELEMETRY_CONFIG_ENABLED_ID = "enableTelemetry";

type ColorCustomizations = {
  "statusBar.background": string;
};

interface TabNineExtensionProperties {
  extensionPath: string | undefined;
  version: string | undefined;
  name: string;
  vscodeVersion: string;
  isTabNineAutoImportEnabled: number | boolean;
  isTypeScriptAutoImports: boolean | undefined;
  isJavaScriptAutoImports: boolean | undefined;
  id: string | undefined;
  logFilePath: string;
  isRemote: boolean;
  remoteName: string;
  extensionKind: number;
  themeKind: string;
  themeName: string | undefined;
  statusBarColorCustomizations: string | undefined;
  isInstalled: boolean;
  isVscodeTelemetryEnabled: boolean;
  isExtentionBetaChannelEnabled: boolean;
}

function getContext(): TabNineExtensionProperties {
  const extension:
    | vscode.Extension<unknown>
    | undefined = vscode.extensions.all.find((x) =>
    x.id.includes(EXTENSION_SUBSTRING)
  );
  const configuration = vscode.workspace.getConfiguration();
  const isJavaScriptAutoImports = configuration.get<boolean>(
    "javascript.suggest.autoImports"
  );
  const isTypeScriptAutoImports = configuration.get<boolean>(
    "typescript.suggest.autoImports"
  );
  const autoImportConfig = "tabnine.experimentalAutoImports";
  const logFilePath = configuration.get<string>("tabnine.logFilePath");
  let isTabNineAutoImportEnabled = configuration.get<boolean | null | number>(
    autoImportConfig
  );
  const { remoteName } = vscode.env as { remoteName: string };
  const { extensionKind } = extension as { extensionKind: number };
  const isRemote = !!remoteName && extensionKind === 2;
  const isInstalled = isTabNineAutoImportEnabled === null;

  if (isTabNineAutoImportEnabled !== false) {
    isTabNineAutoImportEnabled = true;
    void configuration.update(
      autoImportConfig,
      isTabNineAutoImportEnabled,
      true
    );
  }
  const isExtentionBetaChannelEnabled =
    configuration.get<boolean>("tabnine.receiveBetaChannelUpdates") || false;

  return {
    get extensionPath(): string | undefined {
      return extension?.extensionPath;
    },

    get version(): string | undefined {
      return (extension?.packageJSON as { version: string }).version;
    },
    get id() {
      return extension?.id;
    },

    get name(): string {
      return `${EXTENSION_SUBSTRING}-${this.version ?? "unknown"}`;
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
    get isRemote(): boolean {
      return isRemote;
    },
    get remoteName(): string {
      return remoteName;
    },
    get extensionKind(): number {
      return extensionKind;
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
    get isExtentionBetaChannelEnabled(): boolean {
      return isExtentionBetaChannelEnabled;
    },
  };
}

function getWorkbenchSettings() {
  return vscode.workspace.getConfiguration("workbench");
}

const tabnineExtensionProperties: TabNineExtensionProperties = getContext();

export default tabnineExtensionProperties;
