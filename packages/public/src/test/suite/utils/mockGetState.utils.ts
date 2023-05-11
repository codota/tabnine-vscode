import { Item, State, getState } from "tabnine-vscode-common";
import { StateRequest } from "./completion.utils";

async function mockGetState(
  requestResponseItems: Item[],
  result: Partial<State>
): Promise<void> {
  const state = await getState();
  const mockedState = { ...state, ...result };
  requestResponseItems.push({
    isQualified: (request) => {
      const stateRequest = JSON.parse(request) as StateRequest;
      return !!stateRequest?.request?.State;
    },
    result: mockedState,
  });
}

export default mockGetState;
