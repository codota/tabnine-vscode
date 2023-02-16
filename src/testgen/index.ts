import {
  authentication,
  AuthenticationSession,
  CodeLens,
  CodeLensProvider,
  commands,
  ExtensionContext,
  languages,
  Position,
  ProgressLocation,
  Range,
  TextDocument,
  ViewColumn,
  window,
  workspace,
} from "vscode";

import axios from "axios";
import { BRAND_NAME } from "../globals/consts";
import TabnineCodeLens from "./TabnineCodeLens";
import {
  Capability,
  getCachedCapabilities,
  isAnyCapabilityEnabled,
  isCapabilityEnabled,
} from "../capabilities/capabilities";

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
  fileName: string;
  blockRange: Range;
  startPosition: Position;
  text: string;
  languageId: string;
};

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
    async (codeLens: TabnineCodeLens) => {
      if (isCapabilityEnabled(Capability.TEST_GEN)) {
        const token = await getToken();
        const request: TestRequest = toRequest(codeLens);

        void window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: `Tabnine - generating tests, please wait...`,
          },
          async () => {
            const data = await sendRequest(request, token);
            await showResults(request, data);
          }
        );
      }
    }
  );

  context.subscriptions.push(codeLensProvider, testGenCommand);
}

export class TestGenCodeLensProvider implements CodeLensProvider {
  private codeLenses: CodeLens[] = [];

  private regex: RegExp;

  constructor() {
    this.regex = new RegExp("^(def |function |fn)", "mg");
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

function isTestGenEnabled() {
  return isAnyCapabilityEnabled(
    Capability.TEST_GEN,
    Capability.ALPHA_CAPABILITY
  );
}

function initAxiosInstance() {
  const capabilities = getCachedCapabilities();
  const TEST_GEN_ENDPOINT = "test-gen-endpoint";
  const testGenEndpoint = capabilities
    .find((f) => f.startsWith(TEST_GEN_ENDPOINT))
    ?.substring("test-gen-endpoint".length + 1);
  return axios.create({
    baseURL: testGenEndpoint,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function showResults(request: TestRequest, data: GenerateResponse) {
  const doc = await workspace.openTextDocument({
    language: request.languageId,
    content: data.tests.map((d) => d.text).join("\n"),
  });
  await window.showTextDocument(doc, ViewColumn.Beside, true);
}

function getBlockInfo(
  text: string,
  matches: RegExpExecArray,
  document: TextDocument,
  position: Position
): { block: string; blockRange: Range } {
  const endOfBlock = text.indexOf("\n\n\n", matches.index);
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

async function sendRequest(request: TestRequest, token: AuthenticationSession) {
  const instance = initAxiosInstance();
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
