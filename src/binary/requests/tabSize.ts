import { window } from "vscode";

export default function getTabSize(): number {
  const tabSize = window.activeTextEditor?.options.tabSize;
  if (typeof tabSize !== "number") {
    return 4;
  }
  return tabSize;
}
export function getTabsCount(): number {
  return getTabSize() / 4;
}
