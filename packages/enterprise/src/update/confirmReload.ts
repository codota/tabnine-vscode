import { commands } from "vscode";
import confirm from "./confirm";
import { RELOAD_BUTTON_LABEL, RELOAD_COMMAND } from "../consts";

export default async function confirmReload(message: string): Promise<void> {
  if (await confirm(message, RELOAD_BUTTON_LABEL)) {
    await commands.executeCommand(RELOAD_COMMAND);
  }
}
