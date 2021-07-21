import { afterEach, beforeEach, describe, it } from "mocha";
import * as vscode from "vscode";
import { reset } from "ts-mockito";
import * as sinon from "sinon";
import {
  isProcessReadyForTest,
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { activate, getDocUri } from "./utils/helper";
import { resetBinaryForTesting } from "../../binary/requests/requests";
import {
  prepareSuggestionResponse,
  makeAChangeInDocument,
  acceptTheSuggestion,
  assertTextIncludesTheSuggestion,
} from "./utils/inline.utils";

describe("Should do inline", () => {
  const docUri = getDocUri("completion.txt");
  let editor: vscode.TextEditor | undefined;
  beforeEach(async () => {
    requestResponseItems.length = 0;
    resetBinaryForTesting();
    const res = await activate(docUri);
    editor = res?.editor;
  });

  afterEach(() => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    sinon.reset();
  });

  it("should suggest an inline on text change and accept it", async () => {
    editor = editor as vscode.TextEditor;
    prepareSuggestionResponse();
    await isProcessReadyForTest();
    await makeAChangeInDocument(editor);
    await acceptTheSuggestion();

    assertTextIncludesTheSuggestion(editor);
  });
});
