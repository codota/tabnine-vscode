import * as vscode from "vscode";
import { TabNineExtensionContext } from "./TabNineExtensionContext";

const EXTENSION_SUBSTRING = "tabnine-vscode";

type ColorCustomizations = {
  "statusBar.background": string;
};

export const tabnineContext: TabNineExtensionContext = getContext();

export function getContext(): TabNineExtensionContext {
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
  };
}

function getWorkbenchSettings() {
  return vscode.workspace.getConfiguration("workbench");
}
