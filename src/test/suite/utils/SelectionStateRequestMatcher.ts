import { Matcher } from "ts-mockito/lib/matcher/type/Matcher";
import { SelectionRequest } from "./completion.utils";

export type StateMatchingFunction = (
  request?: any
) => boolean;

export class SelectionStateRequestMatcher extends Matcher {
  matchingFunction: StateMatchingFunction;

  constructor(matchingFunction: StateMatchingFunction) {
    super();
    this.matchingFunction = matchingFunction;
  }

  match(request: string): boolean {
    const completionRequest = JSON.parse(request) as SelectionRequest;

    return this.matchingFunction(
      completionRequest.request?.SetState?.state_type
    );
  }

  // eslint-disable-next-line  class-methods-use-this
  toString(): string {
    return "Set State Selection Request";
  }
}
