import { ProgressLocation, window, Progress } from "vscode";
import { startSpinner, stopSpinner } from "./statusBar";
import { API_VERSION, TabNine, StateType, StatePayload } from "./TabNine";
import { handleErrorMessage } from "./notificationsHandler";

const FOUR_SECONDS = 4000;
const ONE_MINUTE = 60000;
const PROGRESS_BAR_TITLE = "TabNine local model is being downloaded";
const DOWNLOAD_FAILED = "TabNine failed downloading model";
const CPU_NOT_SUPPORTED = "TabNine installation is not completed due to technical limitations";

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

export function setProgressBar(tabNine: TabNine) {
    if (isInProgress){
        return;
    }
    isInProgress = true;

    let pollingInterval = setInterval(async () => {
        let { 
            download_state, 
            local_enabled,
            cloud_enabled,
            is_cpu_supported,
        } = await tabNine.request(API_VERSION, { State: { } });

        if (!local_enabled){
            clearPolling();
            isInProgress = false;
            return;
        }
        if (local_enabled && !is_cpu_supported && !cloud_enabled){
            handleErrorMessage(tabNine, CPU_NOT_SUPPORTED)
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
            showErrorNotification(tabNine, download_state);
            isInProgress = false;
            return;
        }

        if (download_state.status === status.InProgress && download_state.kind === downloadProgress.Downloading) {
            clearPolling();
            handleDownloadingInProgress(tabNine);
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


function handleDownloadingInProgress(tabNine: TabNine) {
    tabNine.setState({ [StatePayload.message]: {message_type: StateType.progress}});
    window.withProgress({
        location: ProgressLocation.Notification,
        title: PROGRESS_BAR_TITLE
    }, progress => {
        progress.report({ increment: 0 });
        startSpinner();
        return new Promise(resolve => {
            let progressInterval = setInterval(async () => {
                let { download_state } = await tabNine.request(API_VERSION, { State: {} });

                if (download_state.status == status.Finished) {
                    completeProgress(progressInterval, resolve);
                    return;
                }
                if (download_state.last_failure) {
                    showErrorNotification(tabNine, download_state);
                    completeProgress(progressInterval, resolve);
                    return;
                }
                handleDownloading(download_state, progress);
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


function handleDownloading(download_state: any, progress: Progress<{ message?: string; increment?: number; }>) {
    if (download_state.kind == downloadProgress.Downloading) {
        let increment = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 10);
        let percentage = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 100);
        progress.report({ increment, message: `${percentage}%` });
    }
    if (download_state.kind == downloadProgress.VerifyingChecksum) {
        progress.report({ increment: 100, message: download_state.kind });
    }
}

function showErrorNotification(tabNine, {last_failure}) {
    handleErrorMessage(tabNine, `${DOWNLOAD_FAILED}: ${last_failure}`)
}