import * as path from "path";
import { ColorThemeKind, ExtensionContext, Uri, window } from "vscode";

export const LOGO_BY_THEME = {
  [ColorThemeKind.Light]: "logo-dark.svg",
  [ColorThemeKind.Dark]: "logo-light.svg",
  [ColorThemeKind.HighContrast]: "logo.svg",
};

export function getLogoPath(context: ExtensionContext): string {
  return Uri.file(
    path.join(
      context.extensionPath,
      LOGO_BY_THEME[window.activeColorTheme.kind]
    )
  ).toString();
}
