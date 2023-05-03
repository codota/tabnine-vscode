import {
  Range,
  Selection,
  WorkspaceConfiguration,
  window,
  workspace,
  env,
  Uri
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

  void window.showInformationMessage("Highlighted code was found in the stack.",
    "Go to stack search"
  ).then(clicked => {
    if (clicked) {
      // open stack search url in browser
      void env.openExternal(Uri.parse("https://huggingface.co/spaces/bigcode/search"));
    }
  });

  // combine overlapping spans
  const combinedSpans: [number,number][] = spans.reduce((acc, span) => {
    const [s, e] = span;
    if(acc.length === 0) return [[s, e]];
    const [lastStart, lastEnd] = acc[acc.length - 1];
    if(s <= lastEnd) {
      acc[acc.length - 1] = [lastStart, Math.max(lastEnd, e)];
    }else{
      acc.push([s, e]);
    }
    return acc;
  }, [] as [number, number][]);
  
  const decorations = combinedSpans.map(([startChar, endChar]) => ({range: new Range(document.positionAt(startChar + start), document.positionAt(endChar + start)), hoverMessage: "This code is in the stack!"}))
  
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

