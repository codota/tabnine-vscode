import {
  TextDocument,
  commands,
  SymbolInformation,
  DocumentSymbol,
  SymbolKind,
} from "vscode";

export async function getFuctionsSymbols(document: TextDocument) {
  const documnetSymbols = await commands.executeCommand<
    (SymbolInformation & DocumentSymbol)[]
  >("vscode.executeDocumentSymbolProvider", document.uri);

  const relevantSymbols: SymbolInformation[] = [];

  documnetSymbols?.forEach((symbol) => {
    if (
      symbol.kind === SymbolKind.Function ||
      symbol.kind === SymbolKind.Method
    ) {
      relevantSymbols.push(symbol);
    }

    if (symbol.children) {
      symbol.children.forEach((child) => {
        if (
          child.kind === SymbolKind.Function ||
          child.kind === SymbolKind.Method
        ) {
          relevantSymbols.push((child as unknown) as SymbolInformation);
        }
      });
    }
  });
  return relevantSymbols;
}
