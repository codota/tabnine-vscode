/* eslint-disable import/no-mutable-exports */
import * as vscode from "vscode";
import { TextDocument, TextEditor } from "vscode";
import * as path from "path";

export const SOME_MORE_TIME = 1000; // ms

export type BinaryGenericRequest<T> = {
  version: string;
  request: T;
};

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(
  docUri?: vscode.Uri
): Promise<{ editor: TextEditor; doc: TextDocument } | null> {
  try {
    const doc = docUri
      ? await vscode.workspace.openTextDocument(docUri)
      : await vscode.workspace.openTextDocument(); // opens an untitled document
    const editor = await vscode.window.showTextDocument(doc);
    await sleep(1); // Wait for server activation

    return { editor, doc };
  } catch (e) {
    console.error(e);

    return null;
  }
}
let isLspStarted = false;
async function waitForLspToStart(): Promise<void> {
  await sleep(isLspStarted ? 0 : 2500);
  isLspStarted = true;
}

export async function openDocument(
  language: string,
  content: string
): Promise<void> {
  const doc = await vscode.workspace.openTextDocument({
    language,
    content,
  });
  await vscode.window.showTextDocument(doc);
  await waitForLspToStart();
}

export async function sleep(ms: number): Promise<number> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDocPath(p: string): string {
  return path.resolve(__dirname, "../../fixture", p);
}

export function getDocUri(p: string): vscode.Uri {
  return vscode.Uri.file(getDocPath(p));
}

export async function clearUnsavedChanges(): Promise<void> {
  await vscode.commands.executeCommand("undo");
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
