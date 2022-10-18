// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { expect } from "chai";
import { afterEach, beforeEach, describe, it, after } from "mocha";
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
  moveCursorToBeAfter,
  moveToActivePosition,
  openADocWith,
  triggerInline,
  triggerPopupSuggestion,
  triggerSelectionAcceptance,
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
import { SimpleAutocompleteRequestMatcher } from "./utils/SimpleAutocompleteRequestMatcher";

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

  after(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
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
    await openADocWith("cons");

    await makeAChange("o");

    await triggerPopupSuggestion();

    await triggerInline();

    await emulationUserInteraction();

    await triggerSelectionAcceptance();

    assertTextIsCommitted("console");
  });
  it("should prefer an inline when both popup and inline are visible", async () => {
    await openADocWith("cons");

    await makeAChange("o");

    await triggerPopupSuggestion();

    mockInlineResponse();

    await triggerInline();

    await triggerSelectionAcceptance();

    assertTextIsCommitted("console.log");

    await makeAndAssertFollowingChange();
  });
  it("should skip completion request on midline invalid position", async () => {
    await openADocWith("console s");

    await moveCursorToBeAfter("console");

    await triggerInline();

    await emulationUserInteraction();

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).never();
  });
  it("should request completion on midline valid position", async () => {
    await openADocWith("consol })");

    await moveCursorToBeAfter("consol");

    await makeAChange("e");

    await emulationUserInteraction();

    await triggerInline();

    await sleep(1000);

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).once();
  });
  it("should skip completion request on text deletion", async () => {
    await openADocWith("test deletion");

    await vscode.commands.executeCommand("deleteLeft");

    await triggerInline();

    await emulationUserInteraction();

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).never();
  });
  it("should skip completion request on text paste/selection (change length > 1 character)", async () => {
    await openADocWith("test paste");

    await makeAChange("inserted text");

    await triggerInline();

    await emulationUserInteraction();

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).never();
  });
  it("should skip completion request on Tab key (indention in)", async () => {
    await openADocWith("");

    await emulationUserInteraction();

    await vscode.commands.executeCommand("tab");

    await triggerInline();

    await emulationUserInteraction();

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).never();
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
