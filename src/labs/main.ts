import * as vscode from "vscode";
import { generateTests, GenTestRequest } from "./api";

const LABS_GENERATE_TESTS = "Tabnine.labs.generateTests";

export default function registerLabs(): void {
  vscode.commands.registerCommand(LABS_GENERATE_TESTS, () => {
    const editor = vscode.window.activeTextEditor;
    const selectedText = editor?.document.getText(editor.selection);
    const fileName = editor?.document.fileName;
    const languageId = editor?.document.languageId;
    if (selectedText === undefined) {
      return;
    }
    const payload: GenTestRequest = {
      code: selectedText,
      filename: fileName,
    };

    void generateTests(payload).then((response) =>
      vscode.workspace
        .openTextDocument({
          content: response.tests.map((t) => t.text).join("\n\n\n\n"),
          language: languageId,
        })
        .then((document) =>
          vscode.window.showTextDocument(document, {
            viewColumn: vscode.ViewColumn.Beside,
          })
        )
    );
  });
}
