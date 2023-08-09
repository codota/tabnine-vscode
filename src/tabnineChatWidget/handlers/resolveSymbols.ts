import * as vscode from "vscode";
import * as path from "path";
import { Logger } from "../../utils/logger";

export type SymbolInformationResult = vscode.SymbolInformation & {
  relativePath: string;
  textAccordingToFoldingRange: string;
};

export async function resolveSymbols({
  symbol,
  document,
}: {
  symbol: string;
  document: vscode.TextDocument;
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
          const symbolText = await findSymbolText(workspaceSymbol, document);
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

async function findSymbolText(
  workspaceSymbol: vscode.SymbolInformation,
  document: vscode.TextDocument
) {
  const symbolDocument = await vscode.workspace.openTextDocument(
    workspaceSymbol.location.uri
  );
  const docFoldingRanges = await vscode.commands.executeCommand<
    vscode.FoldingRange[]
  >("vscode.executeFoldingRangeProvider", workspaceSymbol.location.uri);
  const symbolFoldingRange = docFoldingRanges?.find(
    (range) => range.start === workspaceSymbol.location.range.start.line
  );
  const symbolText = symbolFoldingRange
    ? symbolDocument.getText(rangeFor(symbolFoldingRange))
    : undefined;

  return symbolText;
}

function rangeFor(foldingRange: vscode.FoldingRange): vscode.Range {
  return new vscode.Range(
    new vscode.Position(foldingRange.start, 0),
    new vscode.Position(foldingRange.end, 0)
  );
}

function isProbablyNotSource(symbolPath: string): boolean {
  return ["node_modules", "dist", "build", "target", "out"].some((dir) =>
    symbolPath.startsWith(dir)
  );
}
