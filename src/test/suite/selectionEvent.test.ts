import { afterEach, beforeEach, describe, it, after } from "mocha";
import * as vscode from "vscode";
import { reset, verify } from "ts-mockito";
import {
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { activate, getDocUri } from "./utils/helper";
import { anAutocompleteResponse } from "./utils/testData";
import { resetBinaryForTesting } from "../../binary/requests/requests";
import { SelectionStateRequestMatcher } from "./utils/SelectionStateRequestMatcher";
import { COMPLETION_IMPORTS } from "../../selectionHandler";
import { sleep } from "../../utils/utils";
import { selectionCommandArgs } from "./utils/completion.utils";

describe("Selection request", () => {
  const docUri = getDocUri("selection.txt");

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

  it("Computes lengths correctly for a simple selection", async () => {
    const result = anAutocompleteResponse("b", "bcdef");
    const position = new vscode.Position(0, 2);

    await vscode.commands.executeCommand(
      COMPLETION_IMPORTS,
      selectionCommandArgs(result, position)
    );

    // wait for setState request to be fired
    await sleep(500);

    verify(
      stdinMock.write(
        new SelectionStateRequestMatcher(
          (selection) =>
            selection?.Selection?.length === 5 &&
            selection.Selection.net_length === 4 &&
            selection.Selection.line_prefix_length === 2 &&
            selection.Selection.line_net_prefix_length === 1 &&
            selection.Selection.line_suffix_length === 1
        ),
        "utf8"
      )
    ).once();
  });

  it("Computes lengths correctly for a multiline selection", async () => {
    const result = anAutocompleteResponse("b", "bcdef\na");
    const position = new vscode.Position(0, 2);

    await vscode.commands.executeCommand(
      COMPLETION_IMPORTS,
      selectionCommandArgs(result, position)
    );

    // wait for setState request to be fired
    await sleep(500);

    verify(
      stdinMock.write(
        new SelectionStateRequestMatcher(
          (selection) =>
            selection?.Selection.length === 7 &&
            selection.Selection.net_length === 6 &&
            selection.Selection.line_prefix_length === 2 &&
            selection.Selection.line_net_prefix_length === 1 &&
            selection.Selection.line_suffix_length === 0
        ),
        "utf8"
      )
    ).once();
  });
});
