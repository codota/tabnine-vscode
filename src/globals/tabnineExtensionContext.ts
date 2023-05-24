import * as vscode from "vscode";

let tabnineExtensionContext: vscode.ExtensionContext | null = null;

export function setTabnineExtensionContext(
  context: vscode.ExtensionContext
): void {
  console.info("setTabnineExtensionContext called with");
  console.info(context.extension.packageJSON);
  tabnineExtensionContext = context;
}

export function getTabnineExtensionContext(): vscode.ExtensionContext {
  console.info("getTabnineExtensionContext called");
  if (!tabnineExtensionContext) {
    throw new Error("Extension context not set");
  }
  return tabnineExtensionContext;
}
