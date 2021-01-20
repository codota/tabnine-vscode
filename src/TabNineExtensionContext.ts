export interface TabNineExtensionContext {
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
}
