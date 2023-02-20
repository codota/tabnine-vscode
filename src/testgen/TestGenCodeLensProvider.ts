import {
  CodeLens,
  CodeLensProvider,
  commands,
  DocumentSymbol,
  SymbolKind,
  TextDocument,
} from "vscode";
import { TEST_GENERATION_HEADER } from "../globals/consts";
import isTestGenEnabled from "./isTestGenEnabled";
import TabnineCodeLens from "./TabnineCodeLens";

export default class TestGenCodeLensProvider implements CodeLensProvider {
  // eslint-disable-next-line class-methods-use-this
  public provideCodeLenses(
    document: TextDocument
  ): CodeLens[] | Thenable<CodeLens[] | undefined> {
    if (isTestGenEnabled()) {
      return commands
        .executeCommand<DocumentSymbol[]>(
          "vscode.executeDocumentSymbolProvider",
          document.uri
        )
        .then((docSymbols) => {
          const symbolsToFind = [SymbolKind.Function, SymbolKind.Method];
          const functionsBlocks = docSymbols?.filter((symbol) =>
            symbolsToFind.includes(symbol.kind)
          );
          const classes = docSymbols?.filter(
            (symbol) => symbol.kind === SymbolKind.Class
          );
          classes?.forEach((classSymbol) => {
            classSymbol.children
              .filter((child) => symbolsToFind.includes(child.kind))
              .forEach((method) => {
                functionsBlocks?.push(method);
              });
          });
          return functionsBlocks?.map(
            (block) =>
              new TabnineCodeLens(
                block.selectionRange,
                document.getText(block.range),
                document.fileName,
                block.selectionRange,
                document.getText(),
                document.languageId,
                block.selectionRange.start,
                document.isUntitled
              )
          );
        });
    }
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  public resolveCodeLens(codeLens: TabnineCodeLens) {
    if (isTestGenEnabled()) {
      const isInGeneratedCode =
        codeLens.isUntitled && codeLens.text.includes(TEST_GENERATION_HEADER);
      return {
        ...codeLens,
        command: {
          title: `Tabnine - ${isInGeneratedCode ? "copy" : "generate"} test`,
          tooltip: `Tabnine - ${isInGeneratedCode ? "copy" : "generate"} test`,
          command: isInGeneratedCode
            ? "tabnine.generate-copy"
            : "tabnine.generate-test",
          arguments: [codeLens],
        },
      };
    }
    return null;
  }
}
