import * as vscode from "vscode";
import { commands, ExtensionContext } from "vscode";
import { StateType, TABNINE_HOME_FOCUS_COMMAND } from "./globals/consts";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import handleSaveSnippet, {
  enableSaveSnippetContext,
} from "./saveSnippetHandler";
import openHub from "./hub/openHub";

export const CONFIG_COMMAND = "TabNine::config";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";
export const SAVE_SNIPPET_COMMAND = "Tabnine.saveSnippet";

export async function registerCommands(
  context: ExtensionContext
): Promise<void> {
  context.subscriptions.push(
    commands.registerCommand(CONFIG_COMMAND, openHub(StateType.PALLETTE))
  );

  context.subscriptions.push(
    commands.registerCommand(STATUS_BAR_COMMAND, handleStatusBar())
  );

  if (isCapabilityEnabled(Capability.SAVE_SNIPPETS)) {
    await enableSaveSnippetContext();
    context.subscriptions.push(
      commands.registerCommand(SAVE_SNIPPET_COMMAND, handleSaveSnippet)
    );
  }
}

function handleStatusBar() {
  return (): void => {
    void vscode.commands.executeCommand(TABNINE_HOME_FOCUS_COMMAND);
  };
}
