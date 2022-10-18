import { Matcher } from "ts-mockito/lib/matcher/type/Matcher";
import { API_VERSION } from "../../../globals/consts";
import { AutocompleteRequest } from "./completion.utils";

// eslint-disable-next-line import/prefer-default-export
export class SimpleAutocompleteRequestMatcher extends Matcher {
  // eslint-disable-next-line  class-methods-use-this
  match(request: string): boolean {
    const completionRequest = JSON.parse(request) as AutocompleteRequest;

    return (
      request.endsWith("\n") &&
      completionRequest?.version === API_VERSION &&
      !!completionRequest?.request?.Autocomplete
    );
  }

  // eslint-disable-next-line  class-methods-use-this
  toString(): string {
    return "Simple Autocomplete Request";
  }
}
