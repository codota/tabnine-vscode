import * as assert from "assert";
import { beforeEach, it, afterEach } from "mocha";
import * as sinon from "sinon";
import { reset } from "ts-mockito";
import { Range } from "vscode";
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
  makeAChange,
  mockAutocomplete,
  moveToActivePosition,
  triggerInline,
} from "./utils/completion.utils";
import {
  anAutocompleteResponse,
  INLINE_NEW_PREFIX,
  INLINE_PREFIX,
  SINGLE_CHANGE_CHARACTER,
} from "./utils/testData";
import * as vscodeUtils from "../../vscode.api";

suite("Should show attribution item on inline suggestion", () => {
  const docUri = getDocUri("completion.txt");

  beforeEach(async () => {
    await activate(docUri);
  });

  afterEach(async () => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    requestResponseItems.length = 0;
    await resetBinaryForTesting();
    sinon.verifyAndRestore();
  });
  it("should display attribution item on inline suggestion", async () => {
    const setDecorations = sinon.spy(vscodeUtils, "setDecoration");
    await isProcessReadyForTest();
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse(INLINE_PREFIX, INLINE_NEW_PREFIX)
    );
    await sleep(1000);
    await moveToActivePosition();
    await makeAChange(SINGLE_CHANGE_CHARACTER);
    await triggerInline();

    await sleep(1000);
    assert(
      setDecorations.calledWith(sinon.match.any, [new Range(0, 0, 0, 0)]),
      "attribution should show"
    );
  });
});
