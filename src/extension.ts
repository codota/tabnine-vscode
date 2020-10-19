import * as vscode from "vscode";
import {
  getCapabilitiesOnFocus,
  ON_BOARDING_CAPABILITY,
  VALIDATOR_CAPABILITY,
} from "./capabilities";
import {
  registerCommands,
  registerConfigurationCommand,
} from "./commandsHandler";
import { COMPLETION_TRIGGERS, PROGRESS_KEY } from "./consts";
import { tabnineContext } from "./extensionContext";
import handleUninstall from "./handleUninstall";
import { handleStartUpNotification } from "./notificationsHandler";
import { setProgressBar } from "./progressBar";
import provideCompletionItems from "./provideCompletionItems";
import { COMPLETION_IMPORTS, selectionHandler } from "./selectionHandler";
import { registerStatusBar } from "./statusBar";
import { tabNineProcess } from "./TabNine";
import { once } from "./utils";
import { initValidator, closeValidator } from "./validator/ValidatorClient";
import { PASTE_COMMAND } from "./validator/commands";

// Re-export deactive from requestes
import { deactivate as requestDeactivate } from "./requests";

export function activate(context: vscode.ExtensionContext) {
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

  getCapabilitiesOnFocus().then(({ isCapability }) => {
    if (isCapability(VALIDATOR_CAPABILITY)) {
      initValidator(context, pasteDisposable, isCapability);
    }
    handleSelection(context);
    handleUninstall();

    if (isCapability(ON_BOARDING_CAPABILITY)) {
      registerCommands(context);
      handleStartUpNotification(tabNineProcess, context);
      registerStatusBar(context);
      once(PROGRESS_KEY, context).then(() => {
        setProgressBar(tabNineProcess, context);
      });
    } else {
      registerConfigurationCommand(context);
    }

    vscode.languages.registerCompletionItemProvider(
      { pattern: "**" },
      {
        provideCompletionItems,
      },
      ...COMPLETION_TRIGGERS
    );
  });
}

export function deactivate() {
  closeValidator();
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
