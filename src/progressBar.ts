import { ProgressLocation, window, Progress, env, commands, Uri, ExtensionContext } from "vscode";
import { startSpinner, stopSpinner } from "./statusBar";
import { API_VERSION, TabNine, StateType, StatePayload } from "./TabNine";
import { handleInfoMessage } from "./notificationsHandler";
import { EOL } from "os";
import { CONFIG_COMMAND } from "./commandsHandler";
import { once } from "./utils";

const FOUR_SECONDS = 4000;
const ONE_MINUTE = 60000;
const PROGRESS_BAR_TITLE = "TabNine local model is being downloaded";
const PROGRESS_BAR_MESSAGE = "Once it is downloaded you will be able to get the best of TabNine";
const OPEN_SETTINGS = "Open TabNine Settings";
const DOWNLOAD_SUCCESS = "YAY! TabNine Local model was downloaded successfully!! Now you can work with TabNine Deep Completion!! for more information go to TabNine Settings";
const DOWNLOAD_FAILED = "YOU ARE GOOD TO GO! You can work with TabNine AutoCompletion, for more information go to TabNine Settings";
const FAILED_NOTIFICATION_KEY = "tabnine.hide.failed.notification";
const SUCCESS_NOTIFICATION_KEY = "tabnine.hide.success.notification";
const status = {
    Finished: "Finished",
    NotStarted: "NotStarted",
    InProgress: "InProgress"
}
const downloadProgress = {
    Downloading: "Downloading",
    RetrievingMetadata: "RetrievingMetadata",
    VerifyingChecksum: "VerifyingChecksum",
}
let isInProgress = false;

export function setProgressBar(tabNine: TabNine, context: ExtensionContext) {
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
        } = await tabNine.request(API_VERSION, { State: {} });

        if (!local_enabled) {
            clearPolling();
            isInProgress = false;
            return;
        }
        if (local_enabled && !is_cpu_supported && !cloud_enabled) {
            showErrorNotification(tabNine, context);
            clearPolling();
            isInProgress = false;
            return;
        }
        if (download_state.status === status.Finished) {
            clearPolling();
            isInProgress = false;
            return;
        }
        if (download_state.status === status.NotStarted && download_state.last_failure) {
            clearPolling();
            !cloud_enabled && showErrorNotification(tabNine, context);
            isInProgress = false;
            return;
        }

        if (download_state.status === status.InProgress && download_state.kind === downloadProgress.Downloading) {
            clearPolling();
            handleDownloadingInProgress(tabNine, context);
        }
    }, FOUR_SECONDS);

    let pollingTimeout = setTimeout(() => {
        clearInterval(pollingInterval);
    }, ONE_MINUTE);

    function clearPolling() {
        clearInterval(pollingInterval);
        clearTimeout(pollingTimeout);
    }
}


function handleDownloadingInProgress(tabNine: TabNine, context: ExtensionContext) {
    tabNine.setState({ [StatePayload.message]: {message_type: StateType.progress}});
    window.withProgress({
        location: ProgressLocation.Notification,
        title: PROGRESS_BAR_TITLE
    }, progress => {
        progress.report({ increment: 0 });
        startSpinner();
        return new Promise(resolve => {
            let progressInterval = setInterval(async () => {
                let { download_state, cloud_enabled } = await tabNine.request(API_VERSION, { State: {} });

                if (download_state.status == status.Finished) {
                    completeProgress(progressInterval, resolve);
                    return;
                }
                if (download_state.last_failure) {
                    !cloud_enabled && showErrorNotification(tabNine, context);
                    completeProgress(progressInterval, resolve);
                    return;
                }
                handleDownloading(download_state, progress, tabNine, context);
            }, FOUR_SECONDS);
        });
    });
}

function completeProgress(progressInterval: NodeJS.Timer, resolve: (value?: unknown) => void) {
    stopSpinner();
    clearInterval(progressInterval);
    resolve();
    isInProgress = false;
}


function handleDownloading(download_state: any, progress: Progress<{ message?: string; increment?: number; }>, tabNine: TabNine, context: ExtensionContext) {
    if (download_state.kind == downloadProgress.Downloading) {
        let increment = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 10);
        let percentage = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 100);
        progress.report({ increment, message: `${percentage}%. ${EOL}${PROGRESS_BAR_MESSAGE}` });
    }
    if (download_state.kind == downloadProgress.VerifyingChecksum) {
        progress.report({ increment: 100, message: download_state.kind });

        once(SUCCESS_NOTIFICATION_KEY, context).then(() => {
            handleInfoMessage(tabNine, DOWNLOAD_SUCCESS, openSettingsAction, OPEN_SETTINGS);
        })
    }
}

function showErrorNotification(tabNine: TabNine, context: ExtensionContext) {
    once(FAILED_NOTIFICATION_KEY, context).then(() => {
        handleInfoMessage(tabNine, DOWNLOAD_FAILED, openSettingsAction, OPEN_SETTINGS);
    });
}
function openSettingsAction(action: string){
    if (action === OPEN_SETTINGS){
        commands.executeCommand(CONFIG_COMMAND, StateType.notification, OPEN_SETTINGS);
    }
}