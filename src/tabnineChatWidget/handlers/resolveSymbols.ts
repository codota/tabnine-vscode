import * as vscode from "vscode";
import * as path from "path";
import { Logger } from "../../utils/logger";
import { getSpanningRange } from "../../binary/requests/spanningRange";

export type SymbolInformationResult = vscode.SymbolInformation & {
  relativePath: string;
  textAccordingToFoldingRange: string;
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

  return (await Promise.all(
    symbols
      .map(
        async (
          workspaceSymbol
        ): Promise<SymbolInformationResult | undefined> => {
          const symbolPath = workspaceSymbol.location.uri.fsPath;
          const relativePath = symbolPath.startsWith(workspacePath)
            ? path.relative(workspacePath, symbolPath)
            : undefined;
          if (!relativePath || isProbablyNotSource(relativePath)) {
            return undefined;
          }
          const symbolText = await findSymbolText(workspaceSymbol);
          if (!symbolText) {
            Logger.warn("Failed to find symbol text");
            return undefined;
          }
          return {
            ...workspaceSymbol,
            relativePath,
            textAccordingToFoldingRange: symbolText,
          };
        }
      )
      .filter((workspaceSymbol) => !!workspaceSymbol)
  )) as SymbolInformationResult[];
}

async function findSymbolText(workspaceSymbol: vscode.SymbolInformation): Promise<string | undefined> {
  const symbolDocument = await vscode.workspace.openTextDocument(
    workspaceSymbol.location.uri
  );

  const range = await getSpanningRange({
    file: workspaceSymbol.location.uri.fsPath,
    position: {
      line: workspaceSymbol.location.range.start.line,
      column: workspaceSymbol.location.range.start.character,
    }
  });

  const symbolText = range && symbolDocument.getText(range);
  return symbolText;
}

function isProbablyNotSource(symbolPath: string): boolean {
  return ["node_modules", "dist", "build", "target", "out"].some((dir) =>
    symbolPath.startsWith(dir)
  );
}
