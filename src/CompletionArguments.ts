import { Position } from "vscode";
import { ResultEntry, SnippetContext } from "./binary/requests/requests";

export type CompletionArguments = {
  currentCompletion: string;
  completions: ResultEntry[];
  position: Position;
  limited: boolean;
  snippetContext?: SnippetContext;
  oldPrefix?: string;
};
