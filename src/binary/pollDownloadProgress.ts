import { getState } from "./requests/requests";
import setState from "./requests/setState";
import { StatePayload, StateType } from "../consts";
import { setDefaultStatus, setLoadingStatus } from "../statusBar/statusBar";
import { withPolling } from "../utils";
import {
  DownloadProgress,
  DownloadStatus,
  State,
} from "./state";

const PROGRESS_BAR_POLLING_INTERVAL = 1500; // just enough for the spinner to not blink
const POLLING_TIMEOUT = 60 * 1000; // one minutes

export default function pollDownloadProgress(): void {
  withPolling(
    (stop) => {
      void getState().then((state) => {
        if (isNotInDownloadingState(state)) {
          stop();
          setDefaultStatus();
        } else if (
          state?.download_state?.status === DownloadStatus.IN_PROGRESS &&
          state?.download_state?.kind === DownloadProgress.DOWNLOADING
        ) {
          stop();
          handleDownloadingInProgress();
        }
      });
    },
    PROGRESS_BAR_POLLING_INTERVAL,
    POLLING_TIMEOUT
  );
}

function isNotInDownloadingState(state: State | undefined | null): boolean {
  return (
    !state?.local_enabled ||
    (state?.local_enabled &&
      !state?.is_cpu_supported &&
      !state?.cloud_enabled) ||
    state?.download_state?.status === DownloadStatus.FINISHED ||
    (state?.download_state?.status === DownloadStatus.NOT_STARTED &&
      !!state?.download_state?.last_failure)
  );
}

function handleDownloadingInProgress() {
  void setState({
    [StatePayload.MESSAGE]: { message_type: StateType.PROGRESS },
  });
  setLoadingStatus(`Initializing`);

  const progressInterval = setInterval(() => {
    void getState().then((state) => {
      if (
        state?.download_state.status === DownloadStatus.FINISHED ||
        state?.download_state.last_failure
      ) {
        setDefaultStatus();
        clearInterval(progressInterval);
      } else {
        setLoadingStatus(`Initializing`);
      }
    });
  }, PROGRESS_BAR_POLLING_INTERVAL);
}
