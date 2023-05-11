// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { expect } from "chai";
import { afterEach, describe, beforeEach, it, after } from "mocha";
import * as vscode from "vscode";
import { reset, verify } from "ts-mockito";
import {
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "tabnine-vscode-common";
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
  triggerSelectionAcceptance,
} from "./utils/completion.utils";
import { activate, getDocUri } from "./utils/helper";
import {
  A_COMPLETION_PREFIX,
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
import {
  mockAutocompleteAPI,
  teardownCompletionsTests,
  setupForCompletionsTests,
  mockGetDebounceConfig,
} from "./completion.driver";
import { SuggestionShownRequestMatcher } from "./utils/SuggestionShownRequestMatcher";

describe("Should do completion", () => {
  const SPACES_INDENTATION = "    ";
  const TAB_INDENTATION = "\t";
  const LONGER_THAN_SHORT_DEBOUNCE = 300;
  const SHORT_DEBOUNCE_VALUE = 150;
  const LONG_DEBOUNCE_VALUE = 600;
  const LONGER_THAN_LONG_DEBOUNCE = 750;

  beforeEach(() => {
    setupForCompletionsTests();
  });

  afterEach(() => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    requestResponseItems.length = 0;
    resetBinaryForTesting();
    teardownCompletionsTests();
  });

  after(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  it("Passes the correct request to binary process on completion", async () => {
    await mockAutocompleteAPI();
    const docUri = getDocUri("completion.txt");
    await activate(docUri);
    await completion(docUri, new vscode.Position(0, 6));

    verify(stdinMock.write(new AutocompleteRequestMatcher(), "utf8")).once();
  });

  it("Returns the completions in a correct way", async () => {
    await mockAutocompleteAPI();
    const docUri = getDocUri("completion.txt");
    await activate(docUri);
    mockAutocomplete(requestResponseItems, anAutocompleteResponse());

    const completions = await completion(docUri, new vscode.Position(0, 6));

    expect(completions?.items).to.shallowDeepEqual(aCompletionResult());
  });
  it("should accept an inline completion", async () => {
    await openADocWith(A_COMPLETION_PREFIX, "text");
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse(INLINE_PREFIX, INLINE_NEW_PREFIX)
    );
    await moveToActivePosition();
    await vscode.commands.executeCommand("type", {
      text: SINGLE_CHANGE_CHARACTER,
    });

    await sleep(1000);

    await acceptInline();

    expect(vscode.window.activeTextEditor?.document.getText()).to.equal(
      INLINE_NEW_PREFIX
    );
  });
  it("should escape $ when accepting an inline completion", async () => {
    const expected = `$array[0] = $i`;

    const currentText = `<?php
    $array = array();
    $`;
    await openADocWith(currentText);
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("$array", expected)
    );
    await vscode.commands.executeCommand("cursorMove", {
      to: "down",
      by: "line",
      value: 2,
    });
    await emulationUserInteraction();

    await vscode.commands.executeCommand("type", {
      text: `a`,
    });

    await sleep(2000);

    await triggerSelectionAcceptance();

    await sleep(2000);

    expect(
      vscode.window.activeTextEditor?.document
        .lineAt(vscode.window.activeTextEditor.selection.active)
        .text.trim()
    ).to.equal(expected);
  });
  it("should prefer the popup when only popup is visible and there is no inline suggestion", async () => {
    await openADocWith("cons", "javascript");
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: `o`,
    });
    await emulationUserInteraction();
    await triggerSelectionAcceptance();
    await emulationUserInteraction();
    assertTextIsCommitted("console");
  });
  it("should prefer an inline when both popup and inline are visible", async () => {
    await openADocWith("cons", "javascript");
    mockInlineResponse();
    await emulationUserInteraction();

    await vscode.commands.executeCommand("type", {
      text: `o`,
    });

    await emulationUserInteraction();

    await triggerSelectionAcceptance();

    assertTextIsCommitted("console.log");
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
      text: `\n`,
    });

    await emulationUserInteraction();

    verify(
      stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
    ).once();
  });
  it("should do completion on new line in python", async () => {
    await openADocWith("def binary_search(arr, target):", "python");

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
      suggestions?.items.find((i) => i.insertText === expectedPrefix)?.range
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
      suggestions?.items.find((i) => i.insertText === expectedPrefix)?.range
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
      await vscode.commands.executeCommand("deleteLeft");
      await emulationUserInteraction();

      verify(
        stdinMock.write(new SimpleAutocompleteRequestMatcher(), "utf8")
      ).once();
    });
  });
  it("should should query tabnine if the change is auto closed brackets", async () => {
    await openADocWith("console.log", "javascript");
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
  it("should keep suggesting on matching prefix of the selected item", async () => {
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("log", "log('hello')"),
      anAutocompleteResponse("log", "log('hello')"),
      anAutocompleteResponse("log", "log('hello')")
    );
    await openADocWith("console", "javascript");

    await emulationUserInteraction();
    // eslint-disable-next-line no-restricted-syntax
    for await (const char of [...".log"]) {
      await sleep(1000);
      await vscode.commands.executeCommand("type", {
        text: char,
      });
    }
    await triggerSelectionAcceptance();
    await emulationUserInteraction();

    expect(vscode.window.activeTextEditor?.document.getText()).to.equal(
      "console.log('hello')"
    );
  });
  it("should re-query the process on empty response", async () => {
    await openADocWith("console.", "javascript");

    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "l",
    });

    await waitForReQueryInterval();

    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("log", "log('hello')")
    );

    await waitForReQueryInterval();

    await triggerSelectionAcceptance();

    await emulationUserInteraction();

    expect(vscode.window.activeTextEditor?.document.getText()).to.equal(
      "console.log('hello')"
    );
  });
  it("should render suggestion after debounce", async () => {
    mockGetDebounceConfig(SHORT_DEBOUNCE_VALUE);
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("d", "data"),
      anAutocompleteResponse("d", "data")
    );
    await openADocWith("const ", "text");

    await vscode.commands.executeCommand("type", {
      text: "d",
    });
    await sleep(LONGER_THAN_SHORT_DEBOUNCE);
    await acceptInline();

    expect(vscode.window.activeTextEditor?.document.getText()).to.equal(
      "const data"
    );
  });
  it("should not render suggestion before debounce", async () => {
    mockGetDebounceConfig(LONG_DEBOUNCE_VALUE);
    mockAutocomplete(requestResponseItems, anAutocompleteResponse("d", "data"));
    await openADocWith("const ", "text");

    await vscode.commands.executeCommand("type", {
      text: "d",
    });
    await emulationUserInteraction();
    await acceptInline();

    expect(vscode.window.activeTextEditor?.document.getText()).to.equal(
      "const d"
    );
  });
  it("should cancel running debounce request upon new request", async () => {
    // the debounce is on the "rendering" (== before the suggestion is returned to the provider)
    // the binary is queried at most twice and at least once, at the following points :

    // 1. the completion provider is queried for competition
    // 2. after debouncing - in order to provide the latest cached results
    // if between the two calls a cancelation was issued the second request will be canceled
    mockGetDebounceConfig(LONG_DEBOUNCE_VALUE);
    const FIRST_PREFIX = "sometexti";
    const SECOND_PREFIX = "sometextis";
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse(FIRST_PREFIX, "sometextihere"),
      anAutocompleteResponse(SECOND_PREFIX, "sometextihere")
    );

    await openADocWith("sometext", "text");
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "i",
    });
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "s",
    });
    await sleep(LONG_DEBOUNCE_VALUE);
    await emulationUserInteraction();

    verify(
      stdinMock.write(
        new SimpleAutocompleteRequestMatcher(FIRST_PREFIX),
        "utf8"
      )
    ).once();
    verify(
      stdinMock.write(
        new SimpleAutocompleteRequestMatcher(SECOND_PREFIX),
        "utf8"
      )
    ).twice();
  });
  it("should report suggestion about to shown after debounce", async () => {
    mockGetDebounceConfig(SHORT_DEBOUNCE_VALUE);
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("blablablad", "data"),
      anAutocompleteResponse("blablablad", "data")
    );
    await openADocWith("blablabla", "text");
    await emulationUserInteraction();

    await vscode.commands.executeCommand("type", {
      text: "d",
    });
    await sleep(LONGER_THAN_SHORT_DEBOUNCE);

    verify(
      stdinMock.write(new SuggestionShownRequestMatcher("data"), "utf8")
    ).once();
  });
  it("should not report suggestion shown if the request was canceled", async () => {
    mockGetDebounceConfig(LONG_DEBOUNCE_VALUE);
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("d", "data"),
      anAutocompleteResponse("do", "dom"),
      anAutocompleteResponse("do", "dom")
    );
    await openADocWith("const ", "text");
    await emulationUserInteraction();

    await vscode.commands.executeCommand("type", {
      text: "d",
    });
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "o",
    });
    await sleep(LONGER_THAN_LONG_DEBOUNCE);

    verify(
      stdinMock.write(new SuggestionShownRequestMatcher("data"), "utf8")
    ).never();
    verify(
      stdinMock.write(new SuggestionShownRequestMatcher("dom"), "utf8")
    ).once();
  });
  it("should report suggestion shown only once for the same suggestion", async () => {
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("blibliblid", "data"),
      anAutocompleteResponse("blibliblida", "data"),
      anAutocompleteResponse("blibliblidat", "data")
    );
    await openADocWith("bliblibli", "text");
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "d",
    });
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "a",
    });
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "t",
    });
    await emulationUserInteraction();
    verify(
      stdinMock.write(new SuggestionShownRequestMatcher("data"), "utf8")
    ).once();
  });
  it("should report suggestion shown only once if previous suggestion end with the current", async () => {
    mockAutocomplete(
      requestResponseItems,
      anAutocompleteResponse("a", " = abc"),
      anAutocompleteResponse(" ", "= abc")
    );
    await openADocWith("", "text");
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: "a",
    });
    await emulationUserInteraction();
    await vscode.commands.executeCommand("type", {
      text: " ",
    });
    await emulationUserInteraction();
    verify(
      stdinMock.write(new SuggestionShownRequestMatcher(" = abc"), "utf8")
    ).once();
    verify(
      stdinMock.write(new SuggestionShownRequestMatcher("= abc"), "utf8")
    ).never();
  });
});

async function waitForReQueryInterval() {
  await sleep(200);
}

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

function mockInlineResponse(): void {
  mockAutocomplete(
    requestResponseItems,
    anAutocompleteResponse("console", "console.log")
  );
}
