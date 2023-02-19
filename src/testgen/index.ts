import {
  CodeLens,
  CodeLensProvider,
  commands,
  env,
  ExtensionContext,
  languages,
  Position,
  Range,
  TextDocument,
} from "vscode";
import { TEST_GENERATION_HEADER } from "../globals/consts";
import generateTests from "./generateTests";
import isTestGenEnabled from "./isTestGenEnabled";

import TabnineCodeLens from "./TabnineCodeLens";

export function registerTestGenCodeLens(context: ExtensionContext) {
  if (!isTestGenEnabled()) {
    return;
  }
  const codeLensProvider = languages.registerCodeLensProvider(
    { pattern: "**", scheme: "file" },
    new TestGenCodeLensProvider(/^ *(def |function |fn )/gm)
  );
  const copyCodeLensProvider = languages.registerCodeLensProvider(
    { pattern: "**", scheme: "untitled" },
    new TestGenCodeLensProvider(/^ *(def |function |fn |it|test)/gm)
  );
  const testGenCommand = commands.registerCommand(
    "tabnine.generate-test",
    generateTests
  );

  const testCopyCommand = commands.registerCommand(
    "tabnine.generate-copy",
    (codeLens: TabnineCodeLens) => {
      void env.clipboard.writeText(codeLens.block);
    }
  );

  context.subscriptions.push(
    codeLensProvider,
    copyCodeLensProvider,
    testGenCommand,
    testCopyCommand
  );
}

export class TestGenCodeLensProvider implements CodeLensProvider {
  private codeLenses: CodeLens[] = [];

  private regex: RegExp;

  constructor(private regexToSearch: RegExp) {
    this.regex = new RegExp(this.regexToSearch);
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

  // eslint-disable-next-line class-methods-use-this
  private getFunctionTokenInfo(
    document: TextDocument,
    matches: RegExpExecArray
  ) {
    const line = document.lineAt(document.positionAt(matches.index).line);
    const indexOf = line.text.indexOf(matches[0]);
    const position = new Position(line.lineNumber, indexOf);
    const range = document.getWordRangeAtPosition(
      position,
      new RegExp(matches[0])
    );
    return { range, position };
  }

  // eslint-disable-next-line class-methods-use-this
  public resolveCodeLens(codeLens: TabnineCodeLens) {
    if (isTestGenEnabled()) {
      const isInGeneratedCode = codeLens.text.startsWith(
        TEST_GENERATION_HEADER
      );
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

function getBlockInfo(
  text: string,
  matches: RegExpExecArray,
  document: TextDocument,
  position: Position
): { block: string; blockRange: Range } {
  const endBlockRegex = /(\s*}\);\s*$|\s*}\n{2}|\n{2} *def)/gm;
  endBlockRegex.lastIndex = matches.index;
  let endBlockIndex = text.length;
  let endMatch;

  // eslint-disable-next-line no-cond-assign
  while ((endMatch = endBlockRegex.exec(text)) !== null) {
    endBlockIndex = endMatch.index;
    break;
  }
  // const endOfBlock = text.indexOf("\n\n", matches.index);
  const block = text.substring(matches.index, endBlockIndex);
  const endPosition = document.positionAt(
    document.offsetAt(position) + block.length
  );
  const blockRange = new Range(position, endPosition);
  return { block, blockRange };
}
