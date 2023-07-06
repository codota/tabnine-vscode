import * as vscode from "vscode";

export function peekDefinition({
  symbols,
}: {
  symbols: vscode.SymbolInformation[];
}): void {
  if (symbols?.length === 1) {
    void vscode.commands.executeCommand(
      "editor.action.peekLocations",
      vscode.window.activeTextEditor?.document.uri,
      vscode.window.activeTextEditor?.selection.active,
      [symbols[0].location],
      "peek"
    );
  }
}
