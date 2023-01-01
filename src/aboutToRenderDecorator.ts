import * as vscode from "vscode";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import suggestionShown from "./binary/requests/suggestionShown";
import CompletionOrigin from "./CompletionOrigin";

type DecoratedFunction<R, T1 extends vscode.TextDocument, T2, T3, T4> = (
  document: T1,
  ...args: [T2, T3, T4]
) => Promise<R>;

export default function aboutToRenderDecorator<
  R extends
    | vscode.InlineCompletionList<TabnineInlineCompletionItem>
    | undefined,
  T1 extends vscode.TextDocument,
  T2,
  T3,
  T4
>(
  target: DecoratedFunction<R, T1, T2, T3, T4>
): DecoratedFunction<R, T1, T2, T3, T4> {
  return async (document: T1, ...args: [T2, T3, T4]): Promise<R> => {
    const completions = await target.apply(undefined, [document, ...args]);
    const item = completions?.items[0]?.suggestionEntry;

    if (item) {
      void suggestionShown({
        SuggestionShown: {
          origin: item.origin ?? CompletionOrigin.UNKNOWN,
          net_length: item?.new_prefix.length,
          completion_kind: item?.completion_kind,
          filename: document.fileName,
        },
      });
    }
    return completions;
  };
}
