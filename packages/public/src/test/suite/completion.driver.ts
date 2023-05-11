import * as vscode from "vscode";
import * as sinon from "sinon";
import { fetchCapabilitiesOnFocus } from "../../capabilities/capabilities";
import * as suggestionMode from "../../capabilities/getSuggestionMode";

let sandbox: sinon.SinonSandbox;
let modeMock: sinon.SinonStub;

export async function mockAutocompleteAPI(): Promise<void> {
  sandbox.reset();

  modeMock?.returns(suggestionMode.SuggestionsMode.AUTOCOMPLETE);
  await fetchCapabilitiesOnFocus();
}
export function mockGetDebounceConfig(debounceValue: number): void {
  const getConfigurationMock = sandbox.stub(
    vscode.workspace,
    "getConfiguration"
  );
  getConfigurationMock.returns({
    get: (key: string) => {
      if (key === "tabnine.debounceMilliseconds") {
        return debounceValue;
      }
      return undefined;
    },
    update: sinon.fake(),
    inspect: sinon.fake(),
    has: sinon.fake(),
  });
}

export function setupForCompletionsTests(): void {
  sandbox = sinon.createSandbox();
  modeMock = sandbox.stub(suggestionMode, "default");

  modeMock.returns(suggestionMode.SuggestionsMode.INLINE);
}

export function teardownCompletionsTests(): void {
  sandbox.restore();
}
