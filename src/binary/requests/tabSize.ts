import { window } from "vscode";

export default function getTabSize(): number {
  let tabSize = window.activeTextEditor?.options.tabSize;
  if (typeof tabSize !== "number") {
    return 4;
  }
  return tabSize;
}
