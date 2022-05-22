import { commands, extensions } from "vscode";
import { ResultEntry } from "../binary/requests/requests";

const VIM_FOR_VSCODE_EXTENSION = "vscodevim.vim";
export function vimActive(): boolean {
  return !!extensions.getExtension(VIM_FOR_VSCODE_EXTENSION)?.isActive;
}

export async function vimReturnToInsertMode({
  new_prefix,
  new_suffix,
}: ResultEntry): Promise<void> {
  await commands.executeCommand("extension.vim_escape");
  await commands.executeCommand("extension.vim_insert");
  const suggestionString = new_prefix + new_suffix;
  vimMoveCursorRight(suggestionString.length);
}

function vimMoveCursorRight(steps: number): void {
  for (let i = 0; i < steps; i += 1) {
    void commands.executeCommand("extension.vim_right");
  }
}
