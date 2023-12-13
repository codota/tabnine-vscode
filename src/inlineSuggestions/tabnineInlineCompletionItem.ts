import { Command, InlineCompletionItem, Range } from "vscode";
import {
  CompletionKind,
  ResultEntry,
  SnippetContext,
} from "../binary/requests/requests";

export default class TabnineInlineCompletionItem extends InlineCompletionItem {
  isCached?: boolean;

  suggestionEntry: ResultEntry;

  completionKind?: CompletionKind;

  snippetContext?: SnippetContext;

  constructor(
    text: string,
    suggestionEntry: ResultEntry,
    range?: Range,
    command?: Command,
    completionKind?: CompletionKind,
    isCached?: boolean,
    snippetContext?: SnippetContext
  ) {
    super(text, range, command);
    this.isCached = isCached;
    this.suggestionEntry = suggestionEntry;
    this.completionKind = completionKind;
    this.snippetContext = snippetContext;
  }
}
