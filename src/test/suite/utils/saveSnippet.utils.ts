import * as assert from "assert";
import { window } from "vscode";
import { reset } from "ts-mockito";
import * as sinon from "sinon";
import {
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../../binary/mockedRunProcess";
import { resetBinaryForTesting } from "../../../binary/requests/requests";
import { activate, BinaryGenericRequest, getDocUri } from "./helper";
import {
  SaveSnippetRequest,
  SaveSnippetResponse,
} from "../../../binary/requests/saveSnippet";

export const AN_ERROR_MESSAGE = "some mock error";
type SaveSnippetBinaryRequest = BinaryGenericRequest<{
  SaveSnippet: SaveSnippetRequest;
}>;

const docUri = getDocUri("saveSnippet.txt");
let showInformationMessage: sinon.SinonStub;

export async function setup(): Promise<void> {
  await activate(docUri);
  showInformationMessage = sinon.stub(window, "showInformationMessage");
}

export function cleanup(): void {
  reset(stdinMock);
  reset(stdoutMock);
  reset(readLineMock);
  requestResponseItems.length = 0;
  resetBinaryForTesting();
  sinon.verifyAndRestore();
}

export function mockSaveSnippetResponse(response: SaveSnippetResponse): void {
  requestResponseItems.push({
    isQualified: (request) => {
      const saveSnippetRequest = JSON.parse(
        request
      ) as SaveSnippetBinaryRequest;

      return !!saveSnippetRequest?.request?.SaveSnippet;
    },
    result: response,
  });
}

export function assertNotification(
  assertion: (stub: sinon.SinonStub) => void
): void {
  assert(assertion(showInformationMessage));
}
