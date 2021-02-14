// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { expect } from "chai";
import { afterEach, beforeEach, describe, it } from "mocha";
import * as vscode from "vscode";
import { reset, verify } from "ts-mockito";
import {
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { AutocompleteRequest, completion } from "./utils/completion.utils";
import { activate, getDocUri } from "./utils/helper";
import { aCompletionResult, anAutocompleteResponse } from "./utils/testData";
import { AutocompleteRequestMatcher } from "./utils/matchers";
import { resetBinaryForTesting } from "../../binary/requests/requests";

describe("Should do completion", () => {
  const docUri = getDocUri("completion.txt");

  beforeEach(async () => {
    await activate(docUri);
  });

  afterEach(() => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    requestResponseItems.length = 0;
    resetBinaryForTesting();
  });

  test("Passes the correct request to binary process on completion", async () => {
    await completion(docUri, new vscode.Position(0, 6));

    verify(stdinMock.write(new AutocompleteRequestMatcher(), "utf8")).once();
  });

  it("Returns the completions in a correct way", async () => {
    requestResponseItems.push({
      isQualified: (request) => {
        const completionRequest = JSON.parse(request) as AutocompleteRequest;

        return !!completionRequest?.request?.Autocomplete;
      },
      result: anAutocompleteResponse(),
    });

    const completions = await completion(docUri, new vscode.Position(0, 6));

    expect(completions?.items).to.shallowDeepEqual(aCompletionResult());
  });
});
