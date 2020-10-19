import {
  ProgressLocation,
  window,
  Progress,
  commands,
  ExtensionContext,
} from "vscode";
import { startSpinner, stopSpinner } from "./statusBar";
import { TabNine } from "./TabNine";
import { handleInfoMessage } from "./notificationsHandler";
import { EOL } from "os";
import { CONFIG_COMMAND } from "./commandsHandler";
import { once } from "./utils";
import { StatePayload, StateType } from "./consts";
import {
  DownloadProgress,
  DownloadStatus,
  getState,
  setState,
} from "./requests";

const PROGRESS_BAR_POLLING_INTERVAL = 4000; // four seconds
const POLLING_TIMEOUT = 60 * 1000; // one minutes
const PROGRESS_BAR_TITLE = "TabNine local model is being downloaded";
const PROGRESS_BAR_MESSAGE =
  "Once it is downloaded you will be able to get the best of TabNine";
const OPEN_SETTINGS = "Open TabNine Settings";
const DOWNLOAD_SUCCESS =
  "YAY! TabNine Local model was downloaded successfully!! Now you can work with TabNine Deep Completion!! for more information go to TabNine Settings";
const DOWNLOAD_FAILED =
  "YOU ARE GOOD TO GO! You can work with TabNine AutoCompletion, for more information go to TabNine Settings";
const FAILED_NOTIFICATION_KEY = "tabnine.hide.failed.notification";
const SUCCESS_NOTIFICATION_KEY = "tabnine.hide.success.notification";

let isInProgress = false;

export function setProgressBar(context: ExtensionContext) {
  if (isInProgress) {
    return;
  }
  isInProgress = true;

  let pollingInterval = setInterval(async () => {
    let {
      download_state,
      local_enabled,
      cloud_enabled,
      is_cpu_supported,
    } = await getState();

    if (!local_enabled) {
      clearPolling();
      isInProgress = false;
      return;
    }
    if (local_enabled && !is_cpu_supported && !cloud_enabled) {
      showErrorNotification(context);
      clearPolling();
      isInProgress = false;
      return;
    }
    if (download_state.status === DownloadStatus.FINISHED) {
      clearPolling();
      isInProgress = false;
      return;
    }
    if (
      download_state.status === DownloadStatus.NOT_STARTED &&
      download_state.last_failure
    ) {
      clearPolling();
      !cloud_enabled && showErrorNotification(context);
      isInProgress = false;
      return;
    }

    if (
      download_state.status === DownloadStatus.IN_PROGRESS &&
      download_state.kind === DownloadProgress.DOWNLOADING
    ) {
      clearPolling();
      handleDownloadingInProgress(context);
    }
  }, PROGRESS_BAR_POLLING_INTERVAL);

  let pollingTimeout = setTimeout(() => {
    clearInterval(pollingInterval);
  }, POLLING_TIMEOUT);

  function clearPolling() {
    clearInterval(pollingInterval);
    clearTimeout(pollingTimeout);
  }
}

function handleDownloadingInProgress(context: ExtensionContext) {
  setState({
    [StatePayload.MESSAGE]: { message_type: StateType.PROGRESS },
  });
  window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: PROGRESS_BAR_TITLE,
    },
    (progress) => {
      progress.report({ increment: 0 });
      startSpinner();
      return new Promise((resolve) => {
        let progressInterval = setInterval(async () => {
          let { download_state, cloud_enabled } = await getState();

          if (download_state.status == DownloadStatus.FINISHED) {
            completeProgress(progressInterval, resolve);

            return;
          }

          if (download_state.last_failure) {
            !cloud_enabled && showErrorNotification(context);
            completeProgress(progressInterval, resolve);

            return;
          }

          handleDownloading(download_state, progress, context);
        }, PROGRESS_BAR_POLLING_INTERVAL);
      });
    }
  );
}

function completeProgress(
  progressInterval: NodeJS.Timer,
  resolve: (value?: unknown) => void
) {
  stopSpinner();
  clearInterval(progressInterval);
  resolve();
  isInProgress = false;
}

function handleDownloading(
  download_state: any,
  progress: Progress<{ message?: string; increment?: number }>,
  context: ExtensionContext
) {
  if (download_state.kind == DownloadProgress.DOWNLOADING) {
    let increment = Math.floor(
      (download_state.crnt_bytes / download_state.total_bytes) * 10
    );
    let percentage = Math.floor(
      (download_state.crnt_bytes / download_state.total_bytes) * 100
    );
    progress.report({
      increment,
      message: `${percentage}%. ${EOL}${PROGRESS_BAR_MESSAGE}`,
    });
  }
  if (download_state.kind == DownloadProgress.VERIFYING_CHECKSUM) {
    progress.report({ increment: 100, message: download_state.kind });

    once(SUCCESS_NOTIFICATION_KEY, context).then(() => {
      handleInfoMessage(DOWNLOAD_SUCCESS, openSettingsAction, OPEN_SETTINGS);
    });
  }
}

function showErrorNotification(context: ExtensionContext) {
  once(FAILED_NOTIFICATION_KEY, context).then(() => {
    handleInfoMessage(DOWNLOAD_FAILED, openSettingsAction, OPEN_SETTINGS);
  });
}
function openSettingsAction(action: string) {
  if (action === OPEN_SETTINGS) {
    commands.executeCommand(
      CONFIG_COMMAND,
      StateType.NOTIFICATION,
      OPEN_SETTINGS
    );
  }
}
