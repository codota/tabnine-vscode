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
  getInlineCompletions,
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
import getTabSize from "../../binary/requests/tabSize";

describe("Should do completion", () => {
  const docUri = getDocUri("completion.txt");
  const SPACES_INDENTATION = "    ";
  const TAB_INDENTATION = "\t";

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
    const jsBlock = `function test() {
    
}`;
    await runSkipIndentInTest(jsBlock, "javascript");
  });
  it("should skip completion request on Tab key (indention in) where indentation is \t", async () => {
    const goBlock = `func main() {\n\t\n}`;
    await runSkipIndentInTest(goBlock, "go");
  });
  it("should suggest completions on new line ", async () => {
    await openADocWith("console.log");

    await vscode.commands.executeCommand("type", {
      text: `
    `,
    });

    await emulationUserInteraction();

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).once();
  });
  it("should do completion on new line in python", async () => {
    await openADocWith("def binary_search(arr, target):", "python");
    await moveToActivePosition();

    await vscode.commands.executeCommand("type", { text: "\n" });
    await emulationUserInteraction();

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).once();
  });
  it("should not change the replace range end in case of multiline suffix", async () => {
    const editor = await openADocWith("consol");

    const expectedPrefix = "console.log";
    const multilineSuffix = "a\n\na  ";
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("console", expectedPrefix, multilineSuffix, "")
    );
    await emulationUserInteraction();
    await makeAChange("e");

    const suggestions = await getInlineCompletions(editor);

    expect(
      suggestions.items.find((i) => i.insertText === expectedPrefix)?.range
        ?.end,
      "should equal to current position"
    ).to.deep.equal(editor.selection.active);
  });
  it("should change the replace range end in case of single line prefix", async () => {
    const editor = await openADocWith("consol");

    const expectedPrefix = "console.log";
    const singleLineSuffix = ")}";
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("console", expectedPrefix, singleLineSuffix, "")
    );
    await emulationUserInteraction();
    await makeAChange("e");

    const suggestions = await getInlineCompletions(editor);

    expect(
      suggestions.items.find((i) => i.insertText === expectedPrefix)?.range
        ?.end,
      "should equal to position after the suffix"
    ).to.deep.equal(
      editor.selection.active.translate(0, singleLineSuffix.length)
    );
  });
  it("should accept completion with indentation ", async () => {
    const INDENTED_SUGGESTION = "    return false;";
    const CURRENT_INDENTATION = " ".repeat(getTabSize());
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("", INDENTED_SUGGESTION)
    );
    await openADocWith("function test(){");
    await moveToActivePosition();

    await vscode.commands.executeCommand("type", { text: "\n" });

    await emulationUserInteraction();

    await acceptInline();

    expect(
      vscode.window.activeTextEditor?.document.lineAt(
        vscode.window.activeTextEditor.selection.active
      ).text
    ).to.equal(`${CURRENT_INDENTATION}${INDENTED_SUGGESTION}`);
  });
  [SPACES_INDENTATION, TAB_INDENTATION].forEach((indentation) => {
    it(`should trigger suggestions on indentation of type "${indentation}" out (backspace)`, async () => {
      await openADocWith(indentation);
      await moveToActivePosition();
      await vscode.commands.executeCommand("deleteLeft");
      await emulationUserInteraction();

      verify(
        stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
      ).once();
    });
  });
  it("should should query tabnine if the change is auto closed brackets", async () => {
    await openADocWith("console.log", "javascript");
    await moveToActivePosition();
    await vscode.commands.executeCommand("type", {
      text: "(",
    });
    await sleep(400);

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).atLeast(1);
  });
  it("should not try to suggest if the prefix is not matching the focused item", async () => {
    await openADocWith("function test(){ֿ\n  rtu", "javascript");
    await emulationUserInteraction();
    await vscode.commands.executeCommand("cursorBottom");
    await vscode.commands.executeCommand("type", {
      text: "n",
    });

    await emulationUserInteraction();
    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher("return"), "utf8")
    ).never();
  });
});

async function runSkipIndentInTest(
  codeBlock: string,
  language: string
): Promise<void> {
  await openADocWith(codeBlock, language);

  await vscode.commands.executeCommand("cursorMove", {
    to: "down",
    by: "line",
  });
  await emulationUserInteraction();

  await vscode.commands.executeCommand("tab");

  await triggerInline();

  await emulationUserInteraction();

  verify(
    stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
  ).never();
}

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
