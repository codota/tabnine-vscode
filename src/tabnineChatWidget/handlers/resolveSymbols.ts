import * as vscode from "vscode";
import * as path from "path";

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
        ? path.relative(workspacePath, symbolPath)
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

function isProbablyNotSource(symbolPath: string): boolean {
  return ["node_modules", "dist", "build", "target", "out"].some((dir) =>
    symbolPath.startsWith(dir)
  );
}
