import * as vscode from "vscode";

export async function resolveSymbols({
  symbol,
}: {
  symbol: string;
}): Promise<vscode.SymbolInformation[] | undefined> {
  const symbols = await vscode.commands.executeCommand<
    vscode.SymbolInformation[]
  >("vscode.executeWorkspaceSymbolProvider", symbol);
  return symbols?.filter((workspaceSymbol) => {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path;
    return (
      workspacePath &&
      workspaceSymbol.location.uri.fsPath.startsWith(workspacePath)
    );
  });
}
