import { Command, InlineCompletionItem, Range } from "vscode";
import { CompletionKind } from "../binary/requests/requests";

export default class TabnineInlineCompletionItem extends InlineCompletionItem {
  isCached: boolean;

  completionKind?: CompletionKind;

  constructor(
    isCached: boolean,
    text: string,
    completionKind?: CompletionKind,
    range?: Range,
    command?: Command
  ) {
    super(text, range, command);
    this.isCached = isCached;
    this.completionKind = completionKind;
  }
}
