import * as vscode from "vscode";
import { commands, ExtensionContext } from "vscode";
import { StateType, TABNINE_HOME_FOCUS_COMMAND } from "./globals/consts";
import openHub from "./hub/openHub";

export const CONFIG_COMMAND = "TabNine::config";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";

export function registerCommands(
  context: ExtensionContext
): void {
  context.subscriptions.push(
    commands.registerCommand(CONFIG_COMMAND, openHub(StateType.PALLETTE))
  );

  context.subscriptions.push(
    commands.registerCommand(STATUS_BAR_COMMAND, handleStatusBar())
  );
}

function handleStatusBar() {
  return (): void => {
    void vscode.commands.executeCommand(TABNINE_HOME_FOCUS_COMMAND);
  };
}
