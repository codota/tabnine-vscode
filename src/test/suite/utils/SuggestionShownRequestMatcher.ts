import { Matcher } from "ts-mockito/lib/matcher/type/Matcher";
import { SuggestionShown } from "../../../binary/requests/suggestionShown";
import { API_VERSION } from "../../../globals/consts";
import { BinaryGenericRequest } from "./helper";

export type SuggestionShownRequest = BinaryGenericRequest<SuggestionShown>;
// eslint-disable-next-line import/prefer-default-export
export class SuggestionShownRequestMatcher extends Matcher {
  constructor(private suggestion = "") {
    super();
  }

  // eslint-disable-next-line  class-methods-use-this
  match(request: string): boolean {
    const shownRequest = JSON.parse(request) as SuggestionShownRequest;
    return (
      request.endsWith("\n") &&
      shownRequest?.version === API_VERSION &&
      !!shownRequest?.request?.SuggestionShown &&
      shownRequest?.request?.SuggestionShown.net_length ===
        this.suggestion.length
    );
  }

  // eslint-disable-next-line  class-methods-use-this
  toString(): string {
    return `"suggestion request with [${this.suggestion}] prefix`;
  }
}
