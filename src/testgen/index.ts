import {
  authentication,
  AuthenticationSession,
  CodeLens,
  CodeLensProvider,
  commands,
  Event,
  EventEmitter,
  ExtensionContext,
  languages,
  Position,
  Range,
  TextDocument,
  ViewColumn,
  window,
  workspace,
} from "vscode";

import axios from "axios";
import { BRAND_NAME } from "../globals/consts";
import TabnineCodeLens from "./TabnineCodeLens";

const instance = axios.create({
  baseURL: "https://labs.p.tabnine.com",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

const TEST_GEN_ACTION = "testgen";

type Test = {
  text: string;
  index: number;
  logprobs: number;
  finish_reason: string;
};

type GenerateResponse = {
  tests: Test[];
};

type TestRequest = {
  block: string;
  code: string;
  fileName: string;
  blockRange: Range;
  startPosition: Position;
  text: string;
  languageId: string;
};

const isTestGenEnabled = true;
export function registerTestGenCodeLens(context: ExtensionContext) {
  const codeLensProvider = languages.registerCodeLensProvider(
    { pattern: "**", scheme: "file" },
    new TestGenCodeLensProvider()
  );
  const testGenCommand = commands.registerCommand(
    "tabnine.generate-test",
    async (codeLens: TabnineCodeLens) => {
      if (isTestGenEnabled) {
        const token = await getToken();
        const request: TestRequest = toRequest(codeLens);

        const data = await sendRequest(request, token);

        await showResults(request, data);
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
    this.regex = new RegExp("^(def |function |fn)", "mg");

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
          const endOfBlock = text.indexOf("\n\n\n", matches.index);
          const block = text.substring(
            matches.index,
            Math.max(endOfBlock, 0) || text.length
          );
          const endPosition = document.positionAt(
            document.offsetAt(position) + block.length
          );
          this.codeLenses.push(
            new TabnineCodeLens(
              range,
              block,
              document.fileName,
              new Range(position, endPosition),
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
  public resolveCodeLens(codeLens: CodeLens) {
    if (isTestGenEnabled) {
      return {
        ...codeLens,
        command: {
          title: "Generate test for this function",
          tooltip: "Generate test for this function",
          command: "tabnine.generate-test",
          arguments: [codeLens],
        },
      };
    }
    return null;
  }
}
async function showResults(request: TestRequest, data: GenerateResponse) {
  const doc = await workspace.openTextDocument({
    language: request.languageId,
    content: data.tests.map((d) => d.text).join("\n"),
  });
  void window.showTextDocument(doc, ViewColumn.Beside, true);
}

async function sendRequest(request: TestRequest, token: AuthenticationSession) {
  return (
    await instance.post<GenerateResponse>(
      TEST_GEN_ACTION,
      { ...request, action: TEST_GEN_ACTION },
      {
        headers: {
          Authorization: `Bearer ${token?.accessToken || ""}`,
        },
      }
    )
  )?.data;
}

function toRequest(codeLens: TabnineCodeLens): TestRequest {
  return {
    block: codeLens.code,
    code: codeLens.code,
    fileName: codeLens.fileName,
    blockRange: codeLens.blockRange,
    startPosition: codeLens.startPosition,
    text: codeLens.text,
    languageId: codeLens.languageId,
  };
}

async function getToken(): Promise<AuthenticationSession> {
  return authentication.getSession(BRAND_NAME, [], {
    createIfNone: true,
  });
}
