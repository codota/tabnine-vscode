export interface TabNineExtensionContext {
  extensionPath: string;
  version: string;
  name: string;
  vscodeVersion: string;
  isTabNineAutoImportEnabled: number | boolean;
  isTypeScriptAutoImports;
  isJavaScriptAutoImports;
  id: string;
  logFilePath: string;
  isRemote: boolean;
  remoteName: string;
  extensionKind: number;
}
