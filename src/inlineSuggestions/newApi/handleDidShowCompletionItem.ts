import { window } from "vscode";
import { CompletionKind } from "../../binary/requests/requests";
import setState from "../../binary/requests/setState";
import { StatePayload } from "../../globals/consts";
import TabnineInlineCompletionItem from "../tabnineInlineCompletionItem";

export default function handleDidShowCompletionItem(
  completionItem: TabnineInlineCompletionItem
): void {
  if (completionItem.isCached === undefined) return;

  const shouldSendSnippetShown =
    completionItem.completionKind === CompletionKind.Snippet &&
    !completionItem.isCached;

  if (shouldSendSnippetShown) {
    const filename = window.activeTextEditor?.document.fileName;
    const intent = completionItem.snippetIntent;

    if (!intent || !filename) {
      console.warn(
        `Could not send SnippetShown request. intent is null: ${!intent}, filename is null: ${!filename}`
      );
      return;
    }

    void setState({ [StatePayload.SNIPPET_SHOWN]: { filename, intent } });
  }
}
