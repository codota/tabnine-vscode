import * as vscode from "vscode";
import { TabNineExtensionContext } from "./TabNineExtensionContext";

const EXTENSION_SUBSTRING = "tabnine-vscode";

export const tabnineContext: TabNineExtensionContext = getContext();

export function getContext(): TabNineExtensionContext {
  const extension = vscode.extensions.all.find((x) =>
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
  let remoteName = (vscode.env as any).remoteName;
  let extensionKind = (extension as any).extensionKind;
  let isRemote = !!remoteName && extensionKind == 2;

  if (isTabNineAutoImportEnabled !== false) {
    isTabNineAutoImportEnabled = true;
    configuration.update(autoImportConfig, isTabNineAutoImportEnabled, true);
  }
  return {
    get extensionPath(): string | undefined {
      return extension?.extensionPath;
    },

    get version(): string {
      return extension?.packageJSON.version;
    },
    get id() {
      return extension?.id;
    },

    get name(): string {
      return `${EXTENSION_SUBSTRING}-${this.version}`;
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
      return !!logFilePath ? `${logFilePath}-${process.pid}` : "";
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
  };
}
