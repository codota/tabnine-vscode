import * as vscode from "vscode";
import setState from "../binary/requests/setState";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { StatePayload } from "../globals/consts";
import registerAssistant from "./diagnostics";
import { downloadAssistantBinary, StateType } from "./utils";
import {
  assistantClearCacheHandler,
  assistantIgnoreHandler,
  assistantSelectionHandler,
} from "./AssistantHandlers";
import { setAssistantMode, AssistantMode } from "./AssistantMode";
import {
  ACTIVE_STATE_KEY,
  ASSISTANT_CLEAR_CACHE_COMMAND,
  ASSISTANT_IGNORE_COMMAND,
  ASSISTANT_SELECTION_COMMAND,
  ASSISTANT_TOGGLE_COMMAND,
  BACKGROUND_KEY,
  CAPABILITY_KEY,
  ENABLED_KEY,
} from "./globals";
import { IgnoreAssistantSelection } from "./IgnoreAssistantSelection";
import { AcceptAssistantSelection } from "./AcceptAssistantSelection";

export default async function initAssistant(
  context: vscode.ExtensionContext,
  pasteDisposable: vscode.Disposable
): Promise<void> {
  await vscode.commands.executeCommand("setContext", CAPABILITY_KEY, true);

  setAssistantMode(AssistantMode.Background);
  let backgroundMode = true;

  if (isCapabilityEnabled(Capability.ASSISTANT_BACKGROUND_CAPABILITY)) {
    // use default values
  } else if (isCapabilityEnabled(Capability.ASSISTANT_PASTE_CAPABILITY)) {
    backgroundMode = false;
    setAssistantMode(AssistantMode.Paste);
  }
  await vscode.commands.executeCommand(
    "setContext",
    BACKGROUND_KEY,
    backgroundMode
  );

  let isActive = context.globalState.get(ACTIVE_STATE_KEY, backgroundMode);
  if (isActive === null || typeof isActive === "undefined") {
    isActive = true;
  }
  registerReloadForToggleCommand(context, isActive);

  if (isActive) {
    const isDownloaded = await downloadAssistantBinary();
    if (isDownloaded) {
      pasteDisposable.dispose();
      await registerAssistant(context, pasteDisposable);

      context.subscriptions.push(
        vscode.commands.registerTextEditorCommand(
          ASSISTANT_SELECTION_COMMAND,
          (
            editor: vscode.TextEditor,
            edit: vscode.TextEditorEdit,
            data: AcceptAssistantSelection
          ) => void assistantSelectionHandler(editor, edit, data)
        )
      );
      context.subscriptions.push(
        vscode.commands.registerTextEditorCommand(
          ASSISTANT_IGNORE_COMMAND,
          (
            editor: vscode.TextEditor,
            edit: vscode.TextEditorEdit,
            data: IgnoreAssistantSelection
          ) => void assistantIgnoreHandler(editor, edit, data)
        )
      );
      if (backgroundMode) {
        context.subscriptions.push(
          vscode.commands.registerCommand(
            ASSISTANT_CLEAR_CACHE_COMMAND,
            assistantClearCacheHandler
          )
        );
      }
      await vscode.commands.executeCommand("setContext", ENABLED_KEY, true);
    }
  }
}

function registerReloadForToggleCommand(
  context: vscode.ExtensionContext,
  isActive: boolean
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(ASSISTANT_TOGGLE_COMMAND, async () => {
      const value = !isActive ? "On" : "Off";
      const message = `Please reload Visual Studio Code to turn Assistant ${value}.`;
      const reload = await vscode.window.showInformationMessage(
        message,
        "Reload Now"
      );
      if (reload) {
        void setState({
          [StatePayload.STATE]: { state_type: StateType.toggle, state: value },
        });
        await context.globalState.update(ACTIVE_STATE_KEY, !isActive);
        void vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    })
  );
}
