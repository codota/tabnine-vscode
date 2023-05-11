import { diff } from "deep-object-diff";
import { Matcher } from "ts-mockito/lib/matcher/type/Matcher";
import { API_VERSION } from "../../../globals/consts";
import { BinaryGenericRequest } from "./helper";

export default class RequestMatcher<T> extends Matcher {
  private content: T;

  constructor(content: T) {
    super();
    this.content = content;
  }

  match(request: string): boolean {
    const completionRequest = JSON.parse(request) as BinaryGenericRequest<T>;

    if (!request.endsWith("\n")) {
      console.error("Binary request recieved with no trailing line break");

      return false;
    }

    if (completionRequest.version !== API_VERSION) {
      console.error("Binary request recieved with wrong api version");

      return false;
    }

    const actual = JSON.stringify(completionRequest.request);
    const expected = JSON.stringify(this.content);
    if (actual !== expected) {
      const requestDiff = diff(
        // eslint-disable-next-line @typescript-eslint/ban-types
        (completionRequest.request as unknown) as object,
        // eslint-disable-next-line @typescript-eslint/ban-types
        (this.content as unknown) as object
      );

      console.error(
        `Binary request recieved with wrong content:\n\tExpected: ${JSON.stringify(
          this.content
        )}\n\tRecieved: ${JSON.stringify(
          completionRequest.request
        )}\n\tDiff: ${JSON.stringify(requestDiff)}`
      );

      return false;
    }

    return true;
  }

  toString(): string {
    return `Binary Request with: ${JSON.stringify(this.content)}`;
  }
}
