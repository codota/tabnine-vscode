import { EOL } from "os";
import * as vscode from "vscode";
import { expect } from "chai";
import { afterEach, beforeEach, describe, it } from "mocha";
import { activate, getDocUri } from "./utils/helper";
import {
  getSnippetBlankRange,
  insertBlankSnippet,
} from "../../inlineSuggestions/snippets/blankSnippet";
import { clearDocument, makeAChangeInDocument } from "./utils/inline.utils";

const someSnippetLines = "const express = require('express');\nconst app = express(); \napp.get('/', (req, res".split(
  "\n"
);
const someLineText = "con";
const fileStartPosition = new vscode.Position(0, 0);

/**
 * Note: for some reason if this test runs before the file `snippet.test.ts` it makes the test fail.
 */
describe("Should calculate snippet blank range correctly", () => {
  const docUri = getDocUri("snippetCompletionBlankRange.txt");
  let editor: vscode.TextEditor | undefined;
  beforeEach(async () => {
    const res = await activate(docUri);
    editor = res?.editor;
  });

  afterEach(async () => {
    editor = editor as vscode.TextEditor;
    await clearDocument(editor);
  });

  it("should insert the correct amount of empty lines when inserting blank snippet at empty line", async () => {
    editor = editor as vscode.TextEditor;
    await insertBlankSnippet(someSnippetLines, fileStartPosition);

    const expectedRange = new vscode.Range(
      fileStartPosition,
      fileStartPosition.translate(someSnippetLines.length - 1)
    );
    const blankRange = getSnippetBlankRange();
    expect(blankRange).to.not.be.an("undefined");
    expect(blankRange).deep.equal(expectedRange);

    expect(editor.document?.getText()).to.equal(
      EOL.repeat(someSnippetLines.length - 1)
    );
  });

  it("should insert the correct amount of empty lines when inserting blank snippet at non empty line", async () => {
    editor = editor as vscode.TextEditor;
    await makeAChangeInDocument(
      editor,
      someLineText,
      new vscode.Range(fileStartPosition, fileStartPosition)
    );
    await insertBlankSnippet(
      someSnippetLines,
      fileStartPosition.translate(0, someLineText.length)
    );

    const expectedRange = new vscode.Range(
      fileStartPosition.translate(0, someLineText.length),
      fileStartPosition.translate(someSnippetLines.length - 1)
    );
    const blankRange = getSnippetBlankRange();
    expect(blankRange).to.not.be.an("undefined");
    expect(blankRange).deep.equal(expectedRange);

    expect(editor.document?.getText()).to.equal(
      `${someLineText}${EOL.repeat(someSnippetLines.length - 1)}`
    );
  });
});
