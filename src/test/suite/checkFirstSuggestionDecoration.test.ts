import * as assert from "assert";
import { beforeEach, test, afterEach, suite } from "mocha";
import * as sinon from "sinon";
import { reset } from "ts-mockito";
import { EventEmitter, once } from "events";
import * as vscode from "vscode";
import { activate, getDocUri, sleep } from "./utils/helper";
import {
  isProcessReadyForTest,
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { resetBinaryForTesting } from "../../binary/requests/requests";
import {
  acceptInline,
  makeAChange,
  mockAutocomplete,
  moveToActivePosition,
  triggerInline,
} from "./utils/completion.utils";
import mockGetState from "./utils/mockGetState.utils";
import {
  anAutocompleteResponse,
  INLINE_NEW_PREFIX,
  INLINE_PREFIX,
  SINGLE_CHANGE_CHARACTER,
} from "./utils/testData";
import * as vscodeUtils from "../../vscode.api";
import { firstSuggestionDecorationType } from "../../firstSuggestionDecoration";

const nonEmptyArray = sinon.match((v) => Array.isArray(v) && v.length);

suite("First suggestion decoration", () => {
  const docUri = getDocUri("firstSuggestion.txt");

  beforeEach(async () => {
    await activate(docUri);
  });

  afterEach(async () => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    requestResponseItems.length = 0;
    resetBinaryForTesting();
    sinon.verifyAndRestore();
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("should display first suggestion on the first inline suggestion", async () => {
    const events: EventEmitter = new EventEmitter();
    const original = vscodeUtils.setDecoration;

    const setDecorationStub = sinon
      .stub(vscodeUtils, "setDecoration")
      .callsFake((...args) => {
        if (args[0] === firstSuggestionDecorationType) {
          if (args[1].length === 0) {
            events.emit("cleared");
          } else {
            events.emit("shown");
          }
        }
        original(...args);
      });
    const decorationShown = once(events, "shown");
    const decorationCleared = once(events, "cleared");
    await isProcessReadyForTest();
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse(INLINE_PREFIX, INLINE_NEW_PREFIX)
    );
    await mockGetState(requestResponseItems, {
      installation_time: new Date().toUTCString(),
    });
    await sleep(1000);
    await moveToActivePosition();
    await makeAChange(SINGLE_CHANGE_CHARACTER);
    await triggerInline();
    await decorationShown;

    assert(
      setDecorationStub.calledWith(
        firstSuggestionDecorationType,
        nonEmptyArray
      ),
      "first suggestion hint should be shown"
    );
    await sleep(1000);
    await acceptInline();
    await decorationCleared;
    assert(
      setDecorationStub.calledWith(firstSuggestionDecorationType, []),
      "first suggestion hint should be cleared on accept"
    );
    setDecorationStub.restore();
  });

  test("should not display first suggestion when more than 1 hour old installation", async () => {
    const setDecorations = sinon.spy(vscodeUtils, "setDecoration");
    await isProcessReadyForTest();
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse(INLINE_PREFIX, INLINE_NEW_PREFIX)
    );
    await mockGetState(requestResponseItems, {
      installation_time: new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toUTCString(),
    });
    await sleep(1000);
    await moveToActivePosition();
    await makeAChange(SINGLE_CHANGE_CHARACTER);
    await triggerInline();
    await sleep(3000);

    assert(
      !setDecorations.calledWith(firstSuggestionDecorationType, nonEmptyArray),
      "first suggestion should not show"
    );
  });
});
