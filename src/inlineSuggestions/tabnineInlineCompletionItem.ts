import { Command, InlineCompletionItem, Range } from "vscode";
import { CompletionKind, UserIntent } from "../binary/requests/requests";

export default class TabnineInlineCompletionItem extends InlineCompletionItem {
  isCached?: boolean;

  completionKind?: CompletionKind;

  snippetIntent?: UserIntent;

  constructor(
    text: string,
    range?: Range,
    command?: Command,
    completionKind?: CompletionKind,
    isCached?: boolean,
    snippetIntent?: UserIntent
  ) {
    super(text, range, command);
    this.isCached = isCached;
    this.completionKind = completionKind;
    this.snippetIntent = snippetIntent;
  }
}
