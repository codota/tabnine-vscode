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
  acceptTheSuggestion,
  assertTextIncludesTheSuggestion,
  requestSnippet,
  prepareSnippetSuggestionResponse,
} from "./utils/snippet.utils";

describe("Should do snippet", () => {
  const docUri = getDocUri("snippetCompletion.txt");
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

  it("should suggest a snippet on empty line and accept it", async () => {
    editor = editor as vscode.TextEditor;
    prepareSnippetSuggestionResponse();
    await isProcessReadyForTest();
    await requestSnippet();
    await acceptTheSuggestion();

    assertTextIncludesTheSuggestion(editor);
  });
});
