import { STATE_POLLING_INTERVAL } from "../globals/consts";
import { getState } from "../binary/requests/requests";
import { State } from "../binary/state";
import { onStateChangedEmitter } from "../events/onStateChangedEmitter";

let statePollingInterval: NodeJS.Timeout | null;
let lastStateResponse: State | undefined | null;

export async function pollState(): Promise<void> {
  lastStateResponse = await getState();
  if (lastStateResponse) {
    onStateChangedEmitter.fire(lastStateResponse);
  }

  statePollingInterval = setInterval(
    () => void doPollState(),
    STATE_POLLING_INTERVAL
  );
}

async function doPollState(): Promise<void> {
  const state = await getState();
  if (state && !equals(state, lastStateResponse)) {
    lastStateResponse = state;
    onStateChangedEmitter.fire(state);
  }
}

export function cancelStatePolling(): void {
  if (statePollingInterval) {
    clearInterval(statePollingInterval);
  }
}

function equals(state1: State, state2?: State | null): boolean {
  if (!state2) {
    return true;
  }

  return (
    state1.api_key === state2.api_key &&
    state1.service_level === state2.service_level &&
    state1.version === state2.version &&
    state1.target === state2.target &&
    state1.cloud_connection_health_status ===
      state2.cloud_connection_health_status &&
    state1.installation_time === state2.installation_time
  );
}
