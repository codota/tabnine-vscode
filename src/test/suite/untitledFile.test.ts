import * as vscode from "vscode";
import { describe, beforeEach, it, afterEach, after } from "mocha";
import { expect } from "chai";
import { activate, sleep } from "./utils/helper";
import { getLanguageFileExtension } from "../../runCompletion";
import languages from "../../globals/languages";

describe("Untitled file language detection", () => {
  let editor: vscode.TextEditor | undefined;
  let doc: vscode.TextDocument | undefined;

  beforeEach(async () => {
    const res = await activate();
    editor = res?.editor;
    doc = res?.doc;
  });

  afterEach(async () => {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  after(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  const testUndefinedFileWith = async (
    input: string,
    fileExtension: string
  ) => {
    editor = editor as vscode.TextEditor;
    doc = doc as vscode.TextDocument;
    await editor.edit((edit) => {
      edit.insert(new vscode.Position(0, 0), input);
    });
    await sleep(1000); // wait for editor to detect language
    expect(getLanguageFileExtension(doc.languageId)).to.equal(fileExtension);
  };

  const cases = [
    {
      input: "public static void main(String[] args)",
      fileExtension: languages.java,
      langName: "Java",
    },
    {
      input: "const arrowFunction = () => { return 1; }",
      fileExtension: languages.javascript,
      langName: "JavaScript",
    },
    {
      input: "def hello_world():",
      fileExtension: languages.python,
      langName: "Python",
    },
    {
      input:
        "#include <stdio.h>\n" +
        "int main() {\n" +
        '   printf("hello world");\n' +
        "   return 0;\n" +
        "}\n",
      fileExtension: languages.c,
      langName: "C",
    },
  ];

  cases.forEach((testCase) => {
    const { input, fileExtension, langName } = testCase;
    it(`should correctly identify an untitled file in ${langName}`, async () => {
      await testUndefinedFileWith(input, fileExtension);
    });
  });
});
