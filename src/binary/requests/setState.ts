import CompletionOrigin from "../../CompletionOrigin";
import { tabNineProcess } from "./requests";

export function setState(state: StateRequest) {
  return tabNineProcess.request({ SetState: { state_type: state } });
}

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

export type ValidatorStateRequest = {
  ValidatorState: {
    num_of_diagnostics: number;
    num_of_locations: number;
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
    suggestions: SetStateSuggestion[];
  };
};

export type SetStateSuggestion = {
  length: number;
  strength?: string;
  origin: CompletionOrigin;
};

export type ValidatorSelectionStateRequest = {
  ValidatorSelection: {
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
    validator_version: string;
  };
};

export type StateRequest =
  | MessageStateRequest
  | StateStateRequest
  | ValidatorStateRequest
  | SelectionStateRequest
  | ValidatorSelectionStateRequest;
