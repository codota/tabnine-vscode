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
import { fireEvent } from "../binary/requests/requests";

export default class TestGenCodeLensProvider implements CodeLensProvider {
  // eslint-disable-next-line class-methods-use-this
  public async provideCodeLenses(
    document: TextDocument
  ): Promise<CodeLens[] | undefined> {
    if (!isTestGenEnabled()) {
      return [];
    }
    const docSymbols = await commands.executeCommand<DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      document.uri
    );

    const symbolsToFind = [SymbolKind.Function, SymbolKind.Method];
    const functionLenses =
      docSymbols
        ?.filter((fn) => symbolsToFind.includes(fn.kind))
        .map(
          (fn) =>
            new TabnineCodeLens(
              fn.selectionRange,
              document.getText(fn.range),
              document.fileName,
              fn.selectionRange,
              "",
              document.languageId,
              fn.selectionRange.start,
              document.isUntitled,
              document.getText()
            )
        ) || [];

    const classesLenses: TabnineCodeLens[] = [];

    docSymbols
      ?.filter((symbol) => symbol.kind === SymbolKind.Class)
      .forEach((classSymbol) => {
        const methods = classSymbol.children
          .filter((child) => symbolsToFind.includes(child.kind))
          .map(
            (method) =>
              new TabnineCodeLens(
                method.selectionRange,
                document.getText(method.range),
                document.fileName,
                method.selectionRange,
                document.getText(classSymbol.range),
                document.languageId,
                method.selectionRange.start,
                document.isUntitled,
                document.getText()
              )
          );
        classesLenses.push(...methods);
      });

    const lenses = [...functionLenses, ...classesLenses];
    void fireEvent({
      name: "test-generation-label-rendered",
      language: document.languageId,
      labelsCount: lenses.length,
    });

    return lenses;
  }

  // eslint-disable-next-line class-methods-use-this
  public resolveCodeLens(codeLens: TabnineCodeLens) {
    if (isTestGenEnabled()) {
      const isInGeneratedCode =
        codeLens.isUntitled &&
        codeLens.documentText.includes(TEST_GENERATION_HEADER);
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
