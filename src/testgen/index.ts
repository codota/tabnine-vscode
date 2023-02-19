import {
  CodeLens,
  CodeLensProvider,
  commands,
  ExtensionContext,
  languages,
  Position,
  Range,
  TextDocument,
} from "vscode";
import generateTests from "./generateTests";
import isTestGenEnabled from "./isTestGenEnabled";

import TabnineCodeLens from "./TabnineCodeLens";

export function registerTestGenCodeLens(context: ExtensionContext) {
  if (!isTestGenEnabled()) {
    return;
  }
  const codeLensProvider = languages.registerCodeLensProvider(
    { pattern: "**", scheme: "file" },
    new TestGenCodeLensProvider()
  );
  const testGenCommand = commands.registerCommand(
    "tabnine.generate-test",
    generateTests
  );

  context.subscriptions.push(codeLensProvider, testGenCommand);
}

export class TestGenCodeLensProvider implements CodeLensProvider {
  private codeLenses: CodeLens[] = [];

  private regex: RegExp;

  constructor() {
    this.regex = new RegExp("(def |function |fn )", "mg");
  }

  public provideCodeLenses(
    document: TextDocument
  ): CodeLens[] | Thenable<CodeLens[]> {
    if (isTestGenEnabled()) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      let matches;
      // eslint-disable-next-line no-cond-assign
      while ((matches = regex.exec(text)) !== null) {
        const { range, position } = this.getFunctionTokenInfo(
          document,
          matches
        );
        if (range) {
          const { block, blockRange } = getBlockInfo(
            text,
            matches,
            document,
            position
          );
          this.codeLenses.push(
            new TabnineCodeLens(
              range,
              block,
              document.fileName,
              blockRange,
              document.getText(),
              document.languageId,
              position
            )
          );
        }
      }
      return this.codeLenses;
    }
    return [];
  }

  private getFunctionTokenInfo(
    document: TextDocument,
    matches: RegExpExecArray
  ) {
    const line = document.lineAt(document.positionAt(matches.index).line);
    const indexOf = line.text.indexOf(matches[0]);
    const position = new Position(line.lineNumber, indexOf);
    const range = document.getWordRangeAtPosition(
      position,
      new RegExp(this.regex)
    );
    return { range, position };
  }

  // eslint-disable-next-line class-methods-use-this
  public resolveCodeLens(codeLens: CodeLens) {
    if (isTestGenEnabled()) {
      return {
        ...codeLens,
        command: {
          title: "Tabnine - generate test",
          tooltip: "Tabnine - generate test",
          command: "tabnine.generate-test",
          arguments: [codeLens],
        },
      };
    }
    return null;
  }
}

function getBlockInfo(
  text: string,
  matches: RegExpExecArray,
  document: TextDocument,
  position: Position
): { block: string; blockRange: Range } {
  const endOfBlock = text.indexOf("\n\n", matches.index);
  const block = text.substring(
    matches.index,
    Math.max(endOfBlock, 0) || text.length
  );
  const endPosition = document.positionAt(
    document.offsetAt(position) + block.length
  );
  const blockRange = new Range(position, endPosition);
  return { block, blockRange };
}
