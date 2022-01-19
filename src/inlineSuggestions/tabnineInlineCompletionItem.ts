import { Command, InlineCompletionItem, Range } from "vscode";
import { CompletionKind } from "../binary/requests/requests";

export default class TabnineInlineCompletionItem extends InlineCompletionItem {
  isCached?: boolean;

  completionKind?: CompletionKind;

  constructor(
    text: string,
    range?: Range,
    command?: Command,
    completionKind?: CompletionKind,
    isCached?: boolean
  ) {
    super(text, range, command);
    this.isCached = isCached;
    this.completionKind = completionKind;
  }
}
