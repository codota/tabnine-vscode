// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { expect } from "chai";
import { afterEach, beforeEach, describe, it } from "mocha";
import * as vscode from "vscode";
import { reset, verify } from "ts-mockito";
import {
  isProcessReadyForTest,
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import {
  acceptInline,
  assertTextIsCommitted,
  completion,
  emulationUserInteraction,
  makeAChange,
  mockAutocomplete,
  moveToActivePosition,
  moveToStartOfLinePosition,
  openADocWith,
  triggerInline,
  triggerPopupSuggestion,
  triggerSelectionAppetence,
} from "./utils/completion.utils";
import { activate, getDocUri } from "./utils/helper";
import {
  aCompletionResult,
  anAutocompleteResponse,
  INLINE_NEW_PREFIX,
  INLINE_PREFIX,
  SINGLE_CHANGE_CHARACTER,
} from "./utils/testData";
import { AutocompleteRequestMatcher } from "./utils/AutocompleteRequestMatcher";
import { resetBinaryForTesting } from "../../binary/requests/requests";
import { sleep } from "../../utils/utils";

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
    mockAutocomplete(requestResponseItems, anAutocompleteResponse());

    const completions = await completion(docUri, new vscode.Position(0, 6));

    expect(completions?.items).to.shallowDeepEqual(aCompletionResult());
  });
  it("should accept an inline completion", async () => {
    await isProcessReadyForTest();
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse(INLINE_PREFIX, INLINE_NEW_PREFIX)
    );
    await moveToActivePosition();
    await makeAChange(SINGLE_CHANGE_CHARACTER);
    await triggerInline();

    await sleep(1000);

    await acceptInline();

    expect(vscode.window.activeTextEditor?.document.getText()).to.equal(
      INLINE_NEW_PREFIX
    );
  });
  it("should prefer the popup when only popup is visible and there is no inline suggestion", async () => {
    (await openADocWith("cons")).makeAChange("o");

    await triggerPopupSuggestion();

    await triggerInline();

    await triggerSelectionAppetence();

    assertTextIsCommitted("console");
  });
  it("should prefer an inline when both popup and inline are visible", async () => {
    (await openADocWith("cons")).makeAChange("o");

    await triggerPopupSuggestion();

    mockInlineResponse();

    await triggerInline();

    await triggerSelectionAppetence();

    assertTextIsCommitted("console.log");

    await makeAndAssertFollowingChange();
  });
  it("should skip completion request on midline invalid position", async () => {
    await openADocWith(" s");

    await moveToStartOfLinePosition();

    mockInlineResponse();

    await makeAChange("console");

    await triggerInline();

    await emulationUserInteraction();

    await acceptInline();

    assertTextIsCommitted("console s");
  });
});

async function makeAndAssertFollowingChange() {
  await makeAChange("o");

  assertTextIsCommitted("console.logo");
}

function mockInlineResponse(): void {
  mockAutocomplete(
    requestResponseItems,
    anAutocompleteResponse("console", "console.log")
  );
}
