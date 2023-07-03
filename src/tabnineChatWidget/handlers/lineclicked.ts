import * as vscode from "vscode";

export function lineClicked({
  code,
  lineNumber,
}: {
  code: string;
  lineNumber: number;
}): void {
  //   const editor = vscode.window.activeTextEditor;
  //   const position = new vscode.Position(lineNumber, 0);
  //   const range = editor.document.lineAt(position).range;
  //   const uri = editor.document.uri;

  const editor = vscode.window.activeTextEditor;
  // eslint-disable-next-line prefer-destructuring
  const document = editor?.document;
  const text = document?.getText();
  const position = new vscode.Position(
    document?.lineCount || 0 + lineNumber,
    0
  );

  void vscode.workspace
    .openTextDocument({
      content: `${text || ""}\n${code}`,
      language: document?.languageId,
    })
    .then((doc) => {
      //   void vscode.commands.executeCommand("vscode.open", doc.uri).then(() => {
      // editor.action.revealDefinition
      //   void vscode.window.showTextDocument(doc, { preview: false }).then((editor) => {
      void vscode.commands.executeCommand(
        "editor.action.peekLocations",
        doc.uri,
        position,
        [
          doc.lineAt(document?.lineCount || 0 + lineNumber).range,
          //   new vscode.Range(
          //     position,
          //     position.translate(0, doc.lineAt(doc.lineCount + lineNumber).range)
          //   ),
        ]
      );
      //   });
      //   });
      // void vscode.window.showTextDocument(doc, { preview: true });
    });
}
