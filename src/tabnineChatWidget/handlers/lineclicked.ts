import * as vscode from "vscode";
// import { sleep } from "../../utils/utils";

export async function lineClicked({
  code,
  lineNumber,
}: {
  code: string;
  lineNumber: number;
}): Promise<void> {
  // const editor = vscode.window.activeTextEditor;
  //   const position = new vscode.Position(lineNumber, 0);
  //   const range = editor.document.lineAt(position).range;
  //   const uri = editor.document.uri;

  // const editor = vscode.window.activeTextEditor;
  // eslint-disable-next-line prefer-destructuring
  // const document = editor?.document;
  // const text = document?.getText();
  // const position = new vscode.Position(
  //   document?.lineCount || 0 + lineNumber,
  //   0
  // );

  const line = code.split("\n")[lineNumber - 1];

  // const wordSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?";
  // const wordSeparators = vscode.workspace
  //   .getConfiguration()
  //   .get<RegExp>("editor.wordSeparators");

  // const doc = await vscode.workspace.openTextDocument({
  //   content: line,
  //   language: document?.languageId,
  // });

  // const words = doc.getWordRangeAtPosition(new vscode.Position(0, 0));

  // await sleep(5000);
  // const tokens =
  //   (await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
  //     "vscode.executeDocumentSymbolProvider",
  //     doc.uri
  //   )) || [];
  // await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

  const tokens = line
    .trim()
    .split(new RegExp(`[ ,=,.]`))
    .filter((token) => !!token);

  const allSymbols = await Promise.all(
    tokens.map(async (token) => {
      const symbols = await vscode.commands.executeCommand<
        vscode.SymbolInformation[]
      >("vscode.executeWorkspaceSymbolProvider", token);
      if (symbols?.length === 1) {
        return symbols[0];
      }
      return undefined;
    })
  );
  const clear = allSymbols.filter((symbol) => !!symbol);

  if (clear && clear[0]) {
    void vscode.commands.executeCommand(
      "editor.action.peekLocations",
      clear[0].location.uri,
      clear[0].location.range
    );
  }

  // tokens.forEach((token) => {
  //   void vscode.commands
  //     .executeCommand<vscode.SymbolInformation[]>(
  //       "vscode.executeWorkspaceSymbolProvider",
  //       token
  //     )
  //     .then((symbols) => {
  //       if (symbols?.length === 1) {
  //         console.log("symbols: ", JSON.stringify(symbols));
  //         void vscode.commands.executeCommand(
  //           "editor.action.peekLocations",
  //           symbols?.[0].location.uri,
  //           symbols?.[0].location.range
  //         );
  //       }
  //     });
  // });

  // void vscode.commands.executeCommand(
  //   "editor.action.peekLocations",
  //   doc.uri,
  //   position,
  //   [
  //     doc.lineAt(document?.lineCount || 0 + lineNumber).range,
  //     //   new vscode.Range(
  //     //     position,
  //     //     position.translate(0, doc.lineAt(doc.lineCount + lineNumber).range)
  //     //   ),
  //   ]
  // );

  // void vscode.workspace
  //   .openTextDocument({
  //     content: `${text || ""}\n${code}`,
  //     language: document?.languageId,
  //   })
  //   .then((doc) => {
  //     //   void vscode.commands.executeCommand("vscode.open", doc.uri).then(() => {
  //     // editor.action.revealDefinition
  //     //   void vscode.window.showTextDocument(doc, { preview: false }).then((editor) => {
  //     void vscode.commands.executeCommand(
  //       "editor.action.peekLocations",
  //       doc.uri,
  //       position,
  //       [
  //         doc.lineAt(document?.lineCount || 0 + lineNumber).range,
  //         //   new vscode.Range(
  //         //     position,
  //         //     position.translate(0, doc.lineAt(doc.lineCount + lineNumber).range)
  //         //   ),
  //       ]
  //     );
  //     //   });
  //     //   });
  //     // void vscode.window.showTextDocument(doc, { preview: true });
  //   });
}
