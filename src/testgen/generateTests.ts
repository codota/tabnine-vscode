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
import { BRAND_NAME, TEST_GENERATION_HEADER } from "../globals/consts";
import isTestGenEnabled from "./isTestGenEnabled";
import { getCachedCapabilities } from "../capabilities/capabilities";
import { fireEvent } from "../binary/requests/requests";

const TEST_GEN_ACTION = "testgen";

type Test = {
  text: string;
  index: number;
  logprobs: number;
  finish_reason: string;
};

type GenerateResponse = {
  results: Test[];
};
type TestRequest = {
  block: string;
  filename: string;
  blockRange: Range;
  startPosition: Position;
  text: string;
  languageId: string;
  framework: string;
};

export default async function generateTests(codeLens: TabnineCodeLens) {
  if (isTestGenEnabled()) {
    try {
      void fireEvent({
        name: "test-generation-requested",
        language: codeLens.languageId,
      });
      const token = await getToken();
      const request: TestRequest = toRequest(codeLens);

      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: `Tabnine - generating tests, please wait...`,
        },
        async () => {
          try {
            const data = await sendRequest(request, token);
            await showResults(request, data);
            void fireEvent({
              name: "test-generation-rendered",
              language: codeLens.languageId,
            });
          } catch (error: unknown) {
            void fireEvent({
              name: "test-generation-failed",
              language: codeLens.languageId,
            });
            void window.showErrorMessage(error as string);
          }
        }
      );
    } catch (error: unknown) {
      void fireEvent({
        name: "test-generation-failed",
        language: codeLens.languageId,
      });
      void window.showErrorMessage(error as string);
    }
  }
}

async function getToken(): Promise<AuthenticationSession> {
  return authentication.getSession(BRAND_NAME, [], {
    createIfNone: true,
  });
}

function toRequest(codeLens: TabnineCodeLens): TestRequest {
  return {
    block: codeLens.block,
    filename: codeLens.filename,
    blockRange: codeLens.blockRange,
    startPosition: codeLens.startPosition,
    text: codeLens.text,
    languageId: codeLens.languageId,
    framework: "",
  };
}
async function showResults(request: TestRequest, data: GenerateResponse) {
  const doc = await workspace.openTextDocument({
    language: request.languageId,
    content: `${TEST_GENERATION_HEADER}\n ${data.results
      .map((d) => d.text)
      .join("\n")}`,
  });

  await window.showTextDocument(doc, ViewColumn.Beside, true);
}

async function sendRequest(
  request: TestRequest,
  token: AuthenticationSession
): Promise<GenerateResponse> {
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
    baseURL: "https://labs.p.tabnine.com" || testGenEndpoint,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
