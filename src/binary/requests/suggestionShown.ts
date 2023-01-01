import CompletionOrigin from "../../CompletionOrigin";
import { CompletionKind, tabNineProcess } from "./requests";

export interface SuggestionShown {
  SuggestionShown: {
    origin: CompletionOrigin;
    net_length: number;
    completion_kind?: CompletionKind;
    filename: string;
  };
}

function suggestionShown(
  request: SuggestionShown
): Promise<unknown | undefined | null> {
  return tabNineProcess.request<unknown, SuggestionShown>(request);
}

export default suggestionShown;
