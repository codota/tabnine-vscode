import { ColorThemeKind, ExtensionContext, Uri, Webview, window } from "vscode";

const LOGO_BY_THEME = {
  [ColorThemeKind.Dark]: "tabnine-logo-dark.svg",
  [ColorThemeKind.Light]: "tabnine-logo-light.svg",
  [ColorThemeKind.HighContrast]: "logo.svg",
};

export function getIcon(context: ExtensionContext, view: Webview) {
  const onDiskPath = Uri.joinPath(
    context.extensionUri,
    LOGO_BY_THEME[window.activeColorTheme.kind]
  );
  return view.asWebviewUri(onDiskPath).toString();
}
