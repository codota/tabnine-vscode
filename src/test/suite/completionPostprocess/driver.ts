import { expect } from "chai";
import {
  AutocompleteParams,
  AutocompleteResult,
  CompletionKind,
} from "../../../binary/requests/requests";

export function request(value: string): AutocompleteParams {
  return {
    before: value,
    filename: "",
    after: "",
    region_includes_beginning: true,
    region_includes_end: true,
    max_num_results: 5,
    offset: 1,
    line: 3,
    character: 1,
  };
}

export function snippetResult(value: string): AutocompleteResult {
  return {
    old_prefix: "",
    results: [
      {
        new_prefix: value,
        old_suffix: "",
        new_suffix: "",
        completion_kind: CompletionKind.Snippet,
      },
    ],
    user_message: [],
    is_locked: false,
  };
}

export function nonSnippetResult(value: string): AutocompleteResult {
  return {
    old_prefix: "",
    results: [
      {
        new_prefix: value,
        old_suffix: "",
        new_suffix: "",
        completion_kind: CompletionKind.Classic,
      },
    ],
    user_message: [],
    is_locked: false,
  };
}
export function expectResult(
  result: AutocompleteResult,
  expected: string
): void {
  expect(result.results[0].new_prefix).to.equal(expected);
}
