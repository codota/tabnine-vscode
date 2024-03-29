import * as vscode from "vscode";

let tabnineExtensionContext: vscode.ExtensionContext | null = null;

export function setTabnineExtensionContext(
  context: vscode.ExtensionContext
): void {
  tabnineExtensionContext = context;
}

export function getTabnineExtensionContext(): vscode.ExtensionContext {
  if (!tabnineExtensionContext) {
    throw new Error("Extension context not set");
  }
  return tabnineExtensionContext;
}
