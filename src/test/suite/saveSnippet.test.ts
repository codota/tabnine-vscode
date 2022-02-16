import { afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { ADD_SNIPPET_COMMAND as SAVE_SNIPPET_COMMAND } from "../../commandsHandler";
import {
  NO_RESPONSE_ERROR_MESSAGE,
  OK_BUTTON,
  SUCCESS_MESSAGE,
} from "../../saveSnippetHandler";
import {
  AN_ERROR_MESSAGE,
  assertNotification,
  cleanup,
  mockSaveSnippetResponse,
  setup,
} from "./utils/saveSnippet.utils";
import {
  anErrorSnippetSuccessResponse,
  aSaveSnippetSuccessResponse,
} from "./utils/testData";

suite("Save Snippets", () => {
  beforeEach(setup);
  afterEach(cleanup);

  test("Shows a success notification when saving snippet is successful", async () => {
    mockSaveSnippetResponse(aSaveSnippetSuccessResponse());

    await vscode.commands.executeCommand(`${SAVE_SNIPPET_COMMAND}`);

    assertNotification((stub) =>
      stub.calledWithExactly(SUCCESS_MESSAGE, OK_BUTTON)
    );
  });

  test("Shows an error notification when saving snippet fails", async () => {
    mockSaveSnippetResponse(anErrorSnippetSuccessResponse(AN_ERROR_MESSAGE));

    await vscode.commands.executeCommand(`${SAVE_SNIPPET_COMMAND}`);

    assertNotification((stub) =>
      stub.calledWith(
        sinon.match((message: string) => message.includes(AN_ERROR_MESSAGE))
      )
    );
  });

  test("Shows an error notification when binary is not responding", async () => {
    await vscode.commands.executeCommand(`${SAVE_SNIPPET_COMMAND}`);

    assertNotification((stub) =>
      stub.calledWith(
        sinon.match((message: string) =>
          message.includes(NO_RESPONSE_ERROR_MESSAGE)
        )
      )
    );
  });
});
