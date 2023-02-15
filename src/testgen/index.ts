import {
  authentication,
  CodeLens,
  CodeLensProvider,
  commands,
  Event,
  EventEmitter,
  ExtensionContext,
  languages,
  Position,
  TextDocument,
  workspace,
} from "vscode";

import axios from "axios";
import { BRAND_NAME } from "../globals/consts";
// import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";

const instance = axios.create({
  baseURL: "https://labs.p.tabnine.com",
  timeout: 30000,
});

type Test = {
  text: string;
  index: number;
  logprobs: number;
  finish_reason: string;
};

type GenerateResponse = {
  tests: Test[];
};

const isTestGenEnabled = true;
export function registerTestGenCodeLens(context: ExtensionContext) {
  const codeLensProvider = languages.registerCodeLensProvider(
    { pattern: "**", scheme: "file" },
    new TestGenCodeLensProvider()
  );
  const testGenCommand = commands.registerCommand(
    "tabnine.generate-test",
    async (code: string) => {
      if (isTestGenEnabled) {
        const token = await authentication.getSession(BRAND_NAME, [], {
          createIfNone: true,
        });

        const data = (
          await instance.post<GenerateResponse>(
            "testgen",
            { action: "testgen", filename: "a.js", code },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token?.accessToken || ""}`,
              },
            }
          )
        )?.data;
        console.log(data);
      }
    }
  );

  context.subscriptions.push(codeLensProvider, testGenCommand);
}

export class TestGenCodeLensProvider implements CodeLensProvider {
  private codeLenses: CodeLens[] = [];

  private regex: RegExp;

  private onDidChangeCodeLensesInner: EventEmitter<void> = new EventEmitter<void>();

  // eslint-disable-next-line no-underscore-dangle
  public readonly onDidChangeCodeLenses: Event<void> = this
    .onDidChangeCodeLensesInner.event;

  constructor() {
    this.regex = new RegExp("^(def |class |function |fn)", "mg"); // /(.+)/g;

    workspace.onDidChangeConfiguration((_) => {
      this.onDidChangeCodeLensesInner.fire();
    });
  }

  public provideCodeLenses(
    document: TextDocument
  ): CodeLens[] | Thenable<CodeLens[]> {
    if (isTestGenEnabled) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      let matches;
      // eslint-disable-next-line no-cond-assign
      while ((matches = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(matches.index).line);
        const indexOf = line.text.indexOf(matches[0]);
        const position = new Position(line.lineNumber, indexOf);
        const range = document.getWordRangeAtPosition(
          position,
          new RegExp(this.regex)
        );
        if (range) {
          this.codeLenses.push(new CodeLens(range));
        }
      }
      return this.codeLenses;
    }
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  public resolveCodeLens(codeLens: CodeLens) {
    if (isTestGenEnabled) {
      return {
        ...codeLens,
        command: {
          title: "Generate test for this function",
          tooltip: "Generate test for this function",
          command: "tabnine.generate-test",
          arguments: [codeLens.range],
        },
      };
    }
    return null;
  }
}
