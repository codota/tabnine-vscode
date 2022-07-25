import { Item } from "../../../binary/mockedRunProcess";
import { State } from "../../../binary/state";
import { getState } from "../../../binary/requests/requests";
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
