import {
  Range,
  window,
} from "vscode";

import fetch from "node-fetch";

export default async function highlightStackAttributions(): Promise<void> {
  const document = window.activeTextEditor?.document
  if (!document) return;

  const text = document.getText();
  const url = "https://stack-dev.dataportraits.org/overlap";
  const body = { document: text };
    
  const resp = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

    
  const json = await resp.json() as any as {spans: [[number, number]]}      
  const {spans} = json

  // find the biggest span
  const [startChar, endChar] = spans.reduce((acc, curr) => {
    const [accStart, accEnd] = acc;
    const [currStart, currEnd] = curr;
    const accLength = accEnd - accStart;
    const currLength = currEnd - currStart;
    if (currLength > accLength) {
      return curr;
    }
    return acc;
  }, [0, 0]);

  const decorations = [{range: new Range(document.positionAt(startChar), document.positionAt(endChar)), hoverMessage: "This code is in the stack!"}]

  const decorationType = window.createTextEditorDecorationType({
    color: 'red',
    textDecoration: 'underline',
    
  });
  window.activeTextEditor?.setDecorations(decorationType, decorations);

  setTimeout(() => {
    window.activeTextEditor?.setDecorations(decorationType, []);
  }, 3000);
}

