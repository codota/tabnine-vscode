import { getState, setState } from "./requests";
import { StatePayload, StateType } from "../consts";
import { setDefaultStatus, setLoadingStatus } from "../statusBar";
import { withPolling } from "../utils";
import { DownloadProgress, DownloadStatus, State } from "./state";

const PROGRESS_BAR_POLLING_INTERVAL = 1000; // one seconds
const POLLING_TIMEOUT = 60 * 1000; // one minutes

export function pollDownloadProgress() {
  withPolling(
    async (stop) => {
      let state = await getState();

      if (isNotInDownloadingState(state)) {
        stop();
        setDefaultStatus();
      } else if (
        state.download_state.status === DownloadStatus.IN_PROGRESS &&
        state.download_state.kind === DownloadProgress.DOWNLOADING
      ) {
        stop();
        handleDownloadingInProgress();
      }
    },
    PROGRESS_BAR_POLLING_INTERVAL,
    POLLING_TIMEOUT
  );
}

function isNotInDownloadingState(state: State): boolean {
  return (
    !state.local_enabled ||
    (state.local_enabled && !state.is_cpu_supported && !state.cloud_enabled) ||
    state.download_state.status === DownloadStatus.FINISHED ||
    (state.download_state.status === DownloadStatus.NOT_STARTED &&
      !!state.download_state.last_failure)
  );
}

function handleDownloadingInProgress() {
  setState({
    [StatePayload.MESSAGE]: { message_type: StateType.PROGRESS },
  });
  setLoadingStatus(`Initializing... 0%`);

  let progressInterval = setInterval(async () => {
    let { download_state } = await getState();

    if (
      download_state.status == DownloadStatus.FINISHED ||
      download_state.last_failure
    ) {
      setDefaultStatus();
      clearInterval(progressInterval);
    } else {
      setLoadingStatus(
        `Initializing... ${downloadPercentage(download_state)}%`
      );
    }
  }, PROGRESS_BAR_POLLING_INTERVAL);
}

function downloadPercentage(download_state: any): string {
  return download_state.kind == DownloadProgress.DOWNLOADING
    ? (
        Math.round(
          (download_state.crnt_bytes / download_state.total_bytes) * 100
        ) / 100
      ).toFixed(2)
    : "100";
}
