import { Command, InlineCompletionItem, Range, SnippetString } from "vscode";
import { CompletionKind, SnippetContext } from "../binary/requests/requests";

export default class TabnineInlineCompletionItem extends InlineCompletionItem {
  isCached?: boolean;

  completionKind?: CompletionKind;

  snippetContext?: SnippetContext;

  constructor(
    text: SnippetString | string,
    range?: Range,
    command?: Command,
    completionKind?: CompletionKind,
    isCached?: boolean,
    snippetContext?: SnippetContext
  ) {
    super(text, range, command);
    this.isCached = isCached;
    this.completionKind = completionKind;
    this.snippetContext = snippetContext;
  }
}
