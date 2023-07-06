import * as vscode from "vscode";

export type SymbolInformationResult = vscode.SymbolInformation & {
  relativePath: string;
};

export async function resolveSymbols({
  symbol,
}: {
  symbol: string;
}): Promise<SymbolInformationResult[] | undefined> {
  const symbols = await vscode.commands.executeCommand<
    vscode.SymbolInformation[]
  >("vscode.executeWorkspaceSymbolProvider", symbol);

  if (!symbols) return undefined;

  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path;

  if (!workspacePath) return [];

  return symbols
    .map((workspaceSymbol) => {
      const symbolPath = workspaceSymbol.location.uri.fsPath;
      const relativePath = symbolPath.startsWith(workspacePath)
        ? symbolPath.replace(workspacePath, "").replace(/^\//, "")
        : undefined;
      if (!relativePath || isProbablyNotSource(relativePath)) {
        return undefined;
      }
      return {
        ...workspaceSymbol,
        relativePath,
      };
    })
    .filter(
      (workspaceSymbol) => !!workspaceSymbol
    ) as SymbolInformationResult[];
}

function isProbablyNotSource(path: string): boolean {
  return ["node_modules", "dist", "build", "target", "out"].some(
    (dir) => path.startsWith(dir) || path.startsWith(`/${dir}`)
  );
}
