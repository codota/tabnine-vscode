import { commands, extensions } from "vscode";
import DocumentTextChangeContent from "./DocumentTextChangeContent";

const PYTHON_INDENT_EXTENSION_ID = "KevinRose.vsc-python-indent";

function isPythonIndentExtensionEnabled() {
  return extensions.all.find((x) => x.id.includes(PYTHON_INDENT_EXTENSION_ID))
    ?.isActive;
}
export default function tryApplyPythonIndentExtensionFix(
  contentChange: DocumentTextChangeContent
): void {
  if (
    contentChange.isPythonNewLineChange() &&
    isPythonIndentExtensionEnabled()
  ) {
    void commands.executeCommand("editor.action.inlineSuggest.trigger");
  }
}
