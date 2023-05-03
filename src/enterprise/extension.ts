import * as vscode from "vscode";
import {
  deactivate as requestDeactivate,
  initBinary,
} from "../binary/requests/requests";
import { setBinaryRootPath } from "../binary/paths";
import { setTabnineExtensionContext } from "../globals/tabnineExtensionContext";

import { initReporter } from "../reports/reporter";
import LogReporter from "../reports/LogReporter";
import {
  COMPLETION_IMPORTS,
  HANDLE_IMPORTS,
  handleImports,
  selectionHandler,
} from "../selectionHandler";
import { registerInlineProvider } from "../inlineSuggestions/registerInlineProvider";
import confirmServerUrl from "./update/confirmServerUrl";
import { registerStatusBar } from "./registerStatusBar";
import { tryToUpdate } from "./tryToUpdate";
import { TABNINE_HOST_CONFIGURATION } from "../globals/consts";
import serverUrl from "./update/serverUrl";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import { host } from "../utils/utils";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  setTabnineExtensionContext(context);
  initReporter(new LogReporter());

  if (!tryToUpdate()) {
    void confirmServerUrl();
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(TABNINE_HOST_CONFIGURATION)) {
          tryToUpdate();
        }
      })
    );
  }

  await setBinaryRootPath(context);
  initSelectionHandling(context);

  const server = serverUrl() as string;

  if (!tabnineExtensionProperties.useProxySupport) {
    process.env.no_proxy = host(server);
    process.env.NO_PROXY = host(server);
  }

  await initBinary([
    "--no_bootstrap",
    `--cloud2_url=${serverUrl() || ""}`,
    `--client=vscode-enterprise`,
  ]);
  registerStatusBar(context);
  await registerInlineProvider(context.subscriptions);
}

function initSelectionHandling(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      COMPLETION_IMPORTS,
      selectionHandler
    ),
    vscode.commands.registerTextEditorCommand(HANDLE_IMPORTS, handleImports)
  );
}

export async function deactivate(): Promise<unknown> {
  return requestDeactivate();
}
