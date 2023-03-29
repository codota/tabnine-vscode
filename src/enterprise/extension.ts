import * as vscode from "vscode";
import {
  deactivate as requestDeactivate,
  initBinary,
} from "../binary/requests/requests";
import { setBinaryRootPath } from "../binary/paths";
import { setTabnineExtensionContext } from "../globals/tabnineExtensionContext";
import { initReporter } from "../reports/reporter";
import LogReporter from "../reports/LogReporter";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import {
  COMPLETION_IMPORTS,
  HANDLE_IMPORTS,
  handleImports,
  selectionHandler,
} from "../selectionHandler";
import { registerInlineProvider } from "../inlineSuggestions/registerInlineProvider";
import { SELF_HOSTED_SERVER_CONFIGURATION } from "./consts";
import confirmServerUrl from "./update/confirmServerUrl";
import serverUrl from "./update/serverUrl";
import updateAndReload from "./update/updateAndReload";
import { registerStatusBar } from "./registerStatusBar";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  setTabnineExtensionContext(context);
  initReporter(new LogReporter());

  if (!tryToUpdate()) {
    void confirmServerUrl();
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(SELF_HOSTED_SERVER_CONFIGURATION)) {
        tryToUpdate();
      }
    });
  }

  await setBinaryRootPath(context);
  initSelectionHandling(context);
  await initBinary();
  registerStatusBar(context);
  await registerInlineProvider(context.subscriptions);
}

function tryToUpdate(): boolean {
  const url = serverUrl();
  if (url) {
    void updateAndReload(url);
  }
  return !!url;
}

function initSelectionHandling(context: vscode.ExtensionContext) {
  if (tabnineExtensionProperties.isTabNineAutoImportEnabled) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(
        COMPLETION_IMPORTS,
        selectionHandler
      ),
      vscode.commands.registerTextEditorCommand(HANDLE_IMPORTS, handleImports)
    );
  }
}

export async function deactivate(): Promise<unknown> {
  return requestDeactivate();
}
