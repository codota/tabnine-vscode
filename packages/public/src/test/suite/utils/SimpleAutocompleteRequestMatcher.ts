import { Matcher } from "ts-mockito/lib/matcher/type/Matcher";
import { API_VERSION } from "../../../globals/consts";
import { AutocompleteRequest } from "./completion.utils";

// eslint-disable-next-line import/prefer-default-export
export class SimpleAutocompleteRequestMatcher extends Matcher {
  constructor(private prefix = "") {
    super();
  }

  // eslint-disable-next-line  class-methods-use-this
  match(request: string): boolean {
    const completionRequest = JSON.parse(request) as AutocompleteRequest;

    return (
      request.endsWith("\n") &&
      completionRequest?.version === API_VERSION &&
      !!completionRequest?.request?.Autocomplete &&
      completionRequest?.request?.Autocomplete.before.endsWith(this.prefix)
    );
  }

  // eslint-disable-next-line  class-methods-use-this
  toString(): string {
    return `"Simple Autocomplete Request with [${this.prefix}] prefix`;
  }
}
