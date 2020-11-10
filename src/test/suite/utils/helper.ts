/* eslint-disable import/no-mutable-exports */
import * as vscode from "vscode";
import { TextDocument, TextEditor } from "vscode";
import * as path from "path";

export const SOME_MORE_TIME = 100; // 100ms

export type BinaryGenericRequest<T> = {
  version: string;
  request: T;
};

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(
  docUri: vscode.Uri
): Promise<{ editor: TextEditor; doc: TextDocument } | null> {
  try {
    const doc = await vscode.workspace.openTextDocument(docUri);
    const editor = await vscode.window.showTextDocument(doc);
    await sleep(1); // Wait for server activation

    return { editor, doc };
  } catch (e) {
    console.error(e);

    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDocPath(p: string): string {
  return path.resolve(__dirname, "../../fixture", p);
}

export function getDocUri(p: string): vscode.Uri {
  return vscode.Uri.file(getDocPath(p));
}

export async function setTestContent(
  doc: TextDocument,
  editor: TextEditor,
  content: string
): Promise<boolean> {
  const all = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length)
  );
  return editor.edit((eb) => eb.replace(all, content));
}
