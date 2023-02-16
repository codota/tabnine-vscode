import {
  authentication,
  AuthenticationSession,
  Position,
  ProgressLocation,
  Range,
  ViewColumn,
  window,
  workspace,
} from "vscode";
import axios from "axios";
import TabnineCodeLens from "./TabnineCodeLens";
import { BRAND_NAME } from "../globals/consts";
import isTestGenEnabled from "./isTestGenEnabled";
import { getCachedCapabilities } from "../capabilities/capabilities";

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

export default async function generateTests(codeLens: TabnineCodeLens) {
  if (isTestGenEnabled()) {
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

async function getToken(): Promise<AuthenticationSession> {
  return authentication.getSession(BRAND_NAME, [], {
    createIfNone: true,
  });
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
async function showResults(request: TestRequest, data: GenerateResponse) {
  const doc = await workspace.openTextDocument({
    language: request.languageId,
    content: data.tests.map((d) => d.text).join("\n"),
  });
  await window.showTextDocument(doc, ViewColumn.Beside, true);
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
function initAxiosInstance() {
  const capabilities = getCachedCapabilities();
  const TEST_GEN_ENDPOINT = "test-gen-endpoint";
  const testGenEndpoint = capabilities
    .find((f) => f.startsWith(TEST_GEN_ENDPOINT))
    ?.split("=")[1];
  return axios.create({
    baseURL: testGenEndpoint,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
