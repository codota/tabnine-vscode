import * as vscode from "vscode";
import { registerCommands } from "./commandsHandler";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";
import {
  COMPLETION_IMPORTS,
  handleImports,
  HANDLE_IMPORTS,
  getSelectionHandler,
} from "./selectionHandler";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import { setTabnineExtensionContext } from "./globals/tabnineExtensionContext";
import installAutocomplete from "./autocompleteInstaller";
import handlePluginInstalled from "./handlePluginInstalled";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  void initStartup(context);
  handleSelection(context);

  registerStatusBar(context);

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);

  if (context.extensionMode !== vscode.ExtensionMode.Test) {
    handlePluginInstalled(context);
  }

  return Promise.resolve();
}

function initStartup(context: vscode.ExtensionContext): void {
  setTabnineExtensionContext(context);
}

async function backgroundInit(context: vscode.ExtensionContext) {
  setDefaultStatus();
  void registerCommands(context);

  await installAutocomplete(context);
}

export async function deactivate(){
}

function handleSelection(context: vscode.ExtensionContext) {
  if (tabnineExtensionProperties.isTabNineAutoImportEnabled) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(
        COMPLETION_IMPORTS,
        getSelectionHandler(context)
      ),
      vscode.commands.registerTextEditorCommand(HANDLE_IMPORTS, handleImports)
    );
  }
}
