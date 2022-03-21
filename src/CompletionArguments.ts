import { Position } from "vscode";
import { ResultEntry, UserIntent } from "./binary/requests/requests";

export type CompletionArguments = {
  currentCompletion: string;
  completions: ResultEntry[];
  position: Position;
  limited: boolean;
  snippetIntent?: UserIntent;
};
