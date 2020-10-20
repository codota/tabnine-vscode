import * as vscode from "vscode";
import { handleErrorState } from "./binary/errorState";
import { pollDownloadProgress } from "./binary/modelDownloadProgress";
import { deactivate as requestDeactivate } from "./binary/requests";
import {
  Capability,
  fetchCapabilitiesOnFocus,
  isCapabilityEnabled,
} from "./capabilities";
import { registerCommands } from "./commandsHandler";
import { COMPLETION_TRIGGERS } from "./consts";
import { tabnineContext } from "./extensionContext";
import handleUninstall from "./handleUninstall";
import provideCompletionItems from "./provideCompletionItems";
import { COMPLETION_IMPORTS, selectionHandler } from "./selectionHandler";
import { registerStatusBar, setDefaultStatus } from "./statusBar";
import { PASTE_COMMAND } from "./validator/commands";
import { closeValidator, initValidator } from "./validator/ValidatorClient";

export async function activate(context: vscode.ExtensionContext) {
  const pasteDisposable = vscode.commands.registerTextEditorCommand(
    PASTE_COMMAND,
    (
      textEditor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      args: any[]
    ) => {
      vscode.commands.executeCommand("editor.action.clipboardPasteAction");
    }
  );
  handleSelection(context);
  handleUninstall();
  registerStatusBar(context);

  // Goes to the binary to fetch what capabilities enabled:
  await fetchCapabilitiesOnFocus();

  setDefaultStatus();
  registerCommands(context);
  vscode.languages.registerCompletionItemProvider(
    { pattern: "**" },
    {
      provideCompletionItems,
    },
    ...COMPLETION_TRIGGERS
  );

  if (isCapabilityEnabled(Capability.VALIDATOR_CAPABILITY)) {
    setImmediate(() => {
      initValidator(context, pasteDisposable);
    });
  }

  if (isCapabilityEnabled(Capability.ON_BOARDING_CAPABILITY)) {
    handleErrorState();
    pollDownloadProgress();
  }
}

export async function deactivate() {
  await closeValidator();
  return requestDeactivate();
}

function handleSelection(context: vscode.ExtensionContext) {
  if (tabnineContext.isTabNineAutoImportEnabled) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(
        COMPLETION_IMPORTS,
        selectionHandler
      )
    );
  }
}
