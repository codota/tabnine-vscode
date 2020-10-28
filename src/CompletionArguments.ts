import { Position } from "vscode";
import { ResultEntry } from "./binary/requests/requests";

export type CompletionArguments = {
  currentCompletion: string;
  completions: ResultEntry[];
  position: Position;
};
