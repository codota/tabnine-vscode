import { CompletionMetadata, tabNineProcess } from "./requests";

export interface SuggestionShown {
  SuggestionShown: {
    net_length: number;
    filename: string;
    metadata?: CompletionMetadata;
  };
}

export default function suggestionShown(
  request: SuggestionShown
): Promise<unknown | undefined | null> {
  return tabNineProcess.request<unknown, SuggestionShown>(request);
}
