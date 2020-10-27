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
import { closeValidator } from "./validator/ValidatorClient";

export async function activate(context: vscode.ExtensionContext) {
  // const pasteDisposable = vscode.commands.registerTextEditorCommand(
  //   PASTE_COMMAND,
  //   (
  //     textEditor: vscode.TextEditor,
  //     edit: vscode.TextEditorEdit,
  //     args: any[]
  //   ) => {
  //     vscode.commands.executeCommand("editor.action.clipboardPasteAction");
  //   }
  // );
  handleSelection(context);
  handleUninstall();
  registerStatusBar(context);

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  backgroundInit(context);
}

async function backgroundInit(context: vscode.ExtensionContext) {
  // Goes to the binary to fetch what capabilities enabled:
  await fetchCapabilitiesOnFocus();

  setDefaultStatus();
  registerCommands(context);
  pollDownloadProgress();
  vscode.languages.registerCompletionItemProvider(
    { pattern: "**" },
    {
      provideCompletionItems,
    },
    ...COMPLETION_TRIGGERS
  );

  // if (isCapabilityEnabled(Capability.VALIDATOR_CAPABILITY)) {
  //   setImmediate(() => {
  //     initValidator(context, pasteDisposable);
  //   });
  // }

  if (isCapabilityEnabled(Capability.ON_BOARDING_CAPABILITY)) {
    handleErrorState();
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
