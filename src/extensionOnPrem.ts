import * as vscode from "vscode";
import {
  deactivate as requestDeactivate,
  initBinary,
} from "./binary/requests/requests";
import { registerCommands } from "./commandsHandler";
import { provideHover } from "./hovers/hoverHandler";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import { setBinaryRootPath } from "./binary/paths";
import { setTabnineExtensionContext } from "./globals/tabnineExtensionContext";

import installAutocomplete from "./autocompleteInstaller";
import { handleSelection, notifyBinaryAboutWorkspaceChange } from "./extension";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  console.log("*****THIS IS AN ONPREM BUILD****");
  void initStartup(context);
  handleSelection(context);
  registerStatusBar(context);
  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);
  return Promise.resolve();
}

function initStartup(context: vscode.ExtensionContext): void {
  setTabnineExtensionContext(context);
}

async function backgroundInit(context: vscode.ExtensionContext) {
  await setBinaryRootPath(context);
  await initBinary();
  notifyBinaryAboutWorkspaceChange();
  vscode.workspace.onDidChangeWorkspaceFolders(
    notifyBinaryAboutWorkspaceChange
  );
  setDefaultStatus();
  void registerCommands(context);
  await installAutocomplete(context);
  vscode.languages.registerHoverProvider(
    { pattern: "**" },
    {
      provideHover,
    }
  );
}

export async function deactivate(): Promise<unknown> {
  return requestDeactivate();
}
