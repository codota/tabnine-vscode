import {
  Range,
  Selection,
  WorkspaceConfiguration,
  window,
  workspace,
} from "vscode";

import fetch from "node-fetch";

export default async function highlightStackAttributions(): Promise<void> {
  const document = window.activeTextEditor?.document
  if (!document) return;

  type Config = WorkspaceConfiguration & {
    attributionWindowSize: number;
  };
  const config: Config = workspace.getConfiguration("HuggingFaceCode") as Config;
  const { attributionWindowSize } = config;

  // get cursor postion and offset
  const cursorPosition = window.activeTextEditor?.selection.active;
  if (!cursorPosition) return;
  const cursorOffset = document.offsetAt(cursorPosition);

  const start = Math.max(0, cursorOffset - attributionWindowSize);
  const end = Math.min(document.getText().length, cursorOffset + attributionWindowSize);

  // Select the start to end span
  if (!window.activeTextEditor) return;
  window.activeTextEditor.selection = new Selection(document.positionAt(start), document.positionAt(end));
  // new Range(document.positionAt(start), document.positionAt(end));
  

  const text = document.getText();
  const textAroundCursor = text.slice(start, end);

  const url = "https://stack-dev.dataportraits.org/overlap";
  const body = { document: textAroundCursor };

  // notify user request has started
  void window.showInformationMessage("Sending request to stack-dev");
    
  const resp = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  const json = await resp.json() as any as {spans: [number, number][]}      
  const {spans} = json

  if(spans.length === 0) {
    void window.showInformationMessage("No code found in the stack");
    return;
  }

  void window.showInformationMessage("Highlighting code was found in the stack");
  
  // console.log("Sent body", body)
  // console.log("Got response", json)
  
  const decorations = spans.map(([startChar, endChar]) => ({range: new Range(document.positionAt(startChar + start), document.positionAt(endChar + start)), hoverMessage: "This code is in the stack!"}))
  
  // console.log("Highlighting", decorations.map(d => [d.range.start, d.range.end]));

  const decorationType = window.createTextEditorDecorationType({
    color: 'red',
    textDecoration: 'underline',
    
  });

  window.activeTextEditor?.setDecorations(decorationType, decorations);

  setTimeout(() => {
    window.activeTextEditor?.setDecorations(decorationType, []);
  }, 5000);
}

