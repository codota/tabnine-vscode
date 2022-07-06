import { setDefaultStatus, setLoadingStatus } from "../statusBar/statusBar";
import { MINUTE_IN_MS, SECOND_IN_MS } from "../utils/time.utils";
import { withPolling } from "../utils/utils";
import { getState } from "./requests/requests";
import { DownloadStatus, ProcessState } from "./state";

const PROCESS_STATE_POLL_INTERVAL = 5 * SECOND_IN_MS;
const PROCESS_STATE_POLL_TIMEOUT = 5 * MINUTE_IN_MS;

export default function pollProcessState(
  onProcessDoneState: () => void | Promise<void>
): void {
  withPolling(
    async (stopPolling: () => void): Promise<void> => {
      const state = await getState();

      if (
        state?.process_state &&
        (state.download_state.status === DownloadStatus.NOT_STARTED ||
          state.download_state.status === DownloadStatus.FINISHED)
      ) {
        if (isConsideredDone(state.process_state)) {
          stopPolling();
          setDefaultStatus();
          void onProcessDoneState();
        } else {
          setLoadingStatus("Initializing...");
        }
      }
    },
    PROCESS_STATE_POLL_INTERVAL,
    PROCESS_STATE_POLL_TIMEOUT,
    true
  );
}

function isConsideredDone(state: ProcessState) {
  return (
    state.globalRestartStatus &&
    Object.values(state.globalRestartStatus).every(
      ({ value }) => value !== "evaluating"
    )
  );
}
