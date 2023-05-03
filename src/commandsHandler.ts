import { window, commands, ExtensionContext } from "vscode";
import { TABNINE_HOME_FOCUS_COMMAND } from "./globals/consts";
import { getTabnineExtensionContext } from "./globals/tabnineExtensionContext";

export const SET_API_TOKEN_COMMAND = "HuggingFaceCode::setApiToken";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";

export function registerCommands(
  context: ExtensionContext
): void {
  context.subscriptions.push(
    commands.registerCommand(SET_API_TOKEN_COMMAND, setApiToken)
  );
  context.subscriptions.push(
    commands.registerCommand(STATUS_BAR_COMMAND, handleStatusBar())
  );
}

function handleStatusBar() {
  return (): void => {
    void commands.executeCommand(TABNINE_HOME_FOCUS_COMMAND);
  };
}

async function setApiToken () {
  const context = getTabnineExtensionContext();
  const input = await window.showInputBox({
      prompt: 'Please enter your API token (find yours at hf.co/settings/token):',
      placeHolder: 'Your token goes here ...'
  });
  if (input !== undefined) {
    await context?.secrets.store('apiToken', input);
    window.showInformationMessage(`Hugging Face Code: API Token was successfully saved`);
  }
};