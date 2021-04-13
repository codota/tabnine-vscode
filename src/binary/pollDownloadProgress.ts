import { getState } from "./requests/requests";
import setState from "./requests/setState";
import { StatePayload, StateType } from "../globals/consts";
import { setDefaultStatus, setLoadingStatus } from "../statusBar/statusBar";
import { withPolling } from "../utils/utils";
import {
  DownloadProgress,
  DownloadState,
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
  setLoadingStatus(`Initializing... 0%`);

  const progressInterval = setInterval(() => {
    void getState().then((state) => {
      if (
        state?.download_state.status === DownloadStatus.FINISHED ||
        state?.download_state.last_failure
      ) {
        setDefaultStatus();
        clearInterval(progressInterval);
      } else {
        setLoadingStatus(
          `Initializing... ${downloadPercentage(state?.download_state)}%`
        );
      }
    });
  }, PROGRESS_BAR_POLLING_INTERVAL);
}

function downloadPercentage(download_state: DownloadState | undefined): string {
  if (!download_state) {
    return "0";
  }

  return download_state?.kind === DownloadProgress.DOWNLOADING
    ? Math.round(
        100 *
          (toMB(download_state.crnt_bytes || 0) /
            toMB(download_state.total_bytes || 1))
      ).toString()
    : "100";
}
function toMB(x: number): number {
  return Math.floor(x / 1024 / 1024);
}
