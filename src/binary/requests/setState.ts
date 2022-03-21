import CompletionOrigin from "../../CompletionOrigin";
import { CompletionKind, tabNineProcess, UserIntent } from "./requests";

export type MessageStateRequest = {
  Message: {
    message_type: string;
    message?: string;
  };
};

export type StateStateRequest = {
  State: {
    state_type: string;
    state?: string;
  };
};

export type AssistantStateRequest = {
  ValidatorState: {
    num_of_diagnostics: number;
    num_of_locations: number;
  };
};

export type SetStateSuggestion = {
  length: number;
  strength?: string;
  origin: CompletionOrigin;
  completion_kind?: CompletionKind;
};
export type StatusShownRequest = {
  StatusShown: {
    id: string;
    text: string;
    notification_type: unknown;
    state: unknown;
  };
};
export type NotificationShownRequest = {
  NotificationShown: {
    id: string;
    text: string;
    notification_type: unknown;
    state: unknown;
  };
};
export type HoverShownRequest = {
  HoverShown: {
    id: string;
    text: string;
    notification_type: unknown;
    state: unknown;
  };
};

export type HintShownRequest = {
  HintShown: {
    id: string;
    text: string;
    notification_type: unknown;
    state: unknown;
  };
};

export type SnippetShownRequest = {
  SnippetShown: {
    filename: string;
    intent: UserIntent;
  };
};

export type SelectionStateRequest = {
  Selection: {
    // the file extension: rs | js etc.
    language: string;
    // suggestion total length ('namespace'.length)
    length: number;
    origin: CompletionOrigin;
    // length - what's already written ('space'.length)
    net_length: number;
    // the percentage showed with the suggestion
    strength?: string;
    // index of the selected suggestion (1)
    index: number;
    // text written before the suggestion start ('String name'.length)
    line_prefix_length: number;
    // line_prefix_length - the part of the text that's in the suggestion ('String '.length)
    line_net_prefix_length: number;
    // text written the place at which the suggestion showed (' = "L'.length)
    line_suffix_length: number;
    num_of_suggestions: number;
    num_of_vanilla_suggestions: number;
    num_of_deep_local_suggestions: number;
    num_of_deep_cloud_suggestions: number;
    num_of_lsp_suggestions: number;
    num_of_vanilla_keyword_suggestions: number;
    suggestions: SetStateSuggestion[];
    is_locked: boolean;
    completion_kind?: CompletionKind;
    snippet_intent?: UserIntent;
  };
};

export type AssistantSelectionStateRequest = {
  AssistantSelection: {
    // the file extension: rs | js etc.
    language: string;
    // suggestion total length ('namespace'.length)
    length: number;
    origin: CompletionOrigin;
    // the percentage showed with the suggestion
    strength?: string;
    // index of the selected suggestion (1)
    index: number;
    threshold: string;
    num_of_suggestions: number;
    suggestions: SetStateSuggestion[];
    selected_suggestion: string;
    reference: string;
    reference_length: number;
    is_ignore: boolean;
    assistant_version: string;
  };
};

export type StateRequest =
  | MessageStateRequest
  | StateStateRequest
  | AssistantStateRequest
  | SelectionStateRequest
  | AssistantSelectionStateRequest
  | NotificationShownRequest
  | StatusShownRequest
  | HoverShownRequest
  | HintShownRequest
  | SnippetShownRequest;

export default function setState(state: StateRequest): Promise<unknown> {
  return tabNineProcess.request({ SetState: { state_type: state } });
}
