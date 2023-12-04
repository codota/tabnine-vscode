import { Disposable, ExtensionContext, WebviewView, window } from "vscode";
import { html } from "./notPartOfATeam.html";
import { getIcon } from "./getIcon";

export function emptyStateNotPartOfATeamView(
  context: ExtensionContext
): Disposable {
  return window.registerWebviewViewProvider("tabnine.chat.not_part_of_a_team", {
    resolveWebviewView(webviewView: WebviewView) {
      const view = webviewView.webview;
      view.options = {
        enableScripts: true,
        enableCommandUris: true,
      };
      const logoSrc = getIcon(context, view);
      view.html = html(logoSrc);
    },
  });
}
