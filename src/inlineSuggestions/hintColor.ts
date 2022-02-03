import { workspace } from "vscode";

export default function getHintColor(): string {
  return (
    workspace.getConfiguration().get<string>("tabnine.inlineHintColor") ||
    "gray"
  );
}
