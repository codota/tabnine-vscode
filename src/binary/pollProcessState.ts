import { setDefaultStatus, setLoadingStatus } from "../statusBar/statusBar";
import { withPolling } from "../utils/utils";
import { getState } from "./requests/requests";
import { DownloadStatus, ProcessState } from "./state";

const PROCESS_STATE_POLL_INTERVAL = 5 * 1000;
const PROCESS_STATE_POLL_TIMEOUT = 5 * 60 * 1000;

export default function pollProcessState(): void {
  withPolling(
    async (stopPolling: () => void): Promise<void> => {
      const state = await getState();

      if (
        state?.process_state &&
        (state.download_state.status === DownloadStatus.NOT_STARTED ||
          state.download_state.status === DownloadStatus.FINISHED)
      ) {
        if (isConsideredDone(state?.process_state)) {
          stopPolling();
          setDefaultStatus();
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
  return Object.values(state.globalRestartStatus).every(
    ({ value }) => value !== "evaluating"
  );
}
