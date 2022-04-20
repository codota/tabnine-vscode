import axios from "axios";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";

const instance = axios.create({
  baseURL: tabnineExtensionProperties.codeReviewBaseUrl,
  timeout: 30000,
});

interface ExtensionsResponse {
  extensions: string[];
}

export interface Range {
  start: number;
  end: number;
}

export interface SuggestionsRequest {
  filename: string;
  buffer: string;
  ranges: Range[];
  threshold: string;
}

export interface Suggestion {
  value: string;
  classification: { type: string; description: string };
}

export interface Suggestions {
  start: number;
  old_value: string;
  suggestions: Suggestion[];
}

export interface SuggestionsResponse {
  filename: string;
  focus: Suggestions[];
}

export async function supportedExtensions(): Promise<ExtensionsResponse> {
  return (await instance.get<ExtensionsResponse>("languages/extensions")).data;
}

export async function querySuggestions(
  payload: SuggestionsRequest
): Promise<SuggestionsResponse> {
  return (await instance.post<SuggestionsResponse>("suggestions", payload))
    .data;
}
