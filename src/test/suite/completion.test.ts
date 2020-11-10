// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as TypeMoq from "typemoq";
import { expect } from "chai";
import { beforeEach, afterEach } from "mocha";
import { activate, getDocUri } from "./utils/helper";
import {
  readLineMock,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { matchesAutocompleteRequest } from "./utils/matchers";
import { anAutocompleteResponse, aCompletionResult } from "./utils/testData";
import { completion, setCompletionResult } from "./utils/completion.utils";

suite("Should do completion", () => {
  const docUri = getDocUri("completion.txt");

  beforeEach(async () => {
    await activate(docUri);
  });

  afterEach(() => {
    stdinMock.reset();
    stdoutMock.reset();
    readLineMock.reset();
  });

  test("Passes the correct request to binary process on completion", async () => {
    await completion(docUri, new vscode.Position(0, 6));

    stdinMock.verify(
      (x) => x.write(TypeMoq.It.is<string>(matchesAutocompleteRequest), "utf8"),
      TypeMoq.Times.once()
    );
  });

  test("Returns the completions in a correct way", async () => {
    setCompletionResult(anAutocompleteResponse());

    const completions = await completion(docUri, new vscode.Position(0, 6));

    expect(completions?.items).to.shallowDeepEqual(aCompletionResult());
  });
});
