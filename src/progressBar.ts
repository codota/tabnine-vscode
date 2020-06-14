import { ProgressLocation, window, Progress } from "vscode";
import { startSpinner, stopSpinner } from "./statusBar";

const fourSeconds = 4000;
const oneMinute = 60000;
const progressBarTitle = "TabNine model downloading";
const downloadingFinishedMessage = "TabNine finished downloading model";
const downloadingFailedMessage = "TabNine failed downloading model";
let isInProgress = false;

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

export function setProgressBar(tabNine) {
    if (isInProgress){
        return;
    }
    isInProgress = true;

    let pollingInterval = setInterval(async () => {
        let { 
            download_state, 
            local_enabled, 
        } = await tabNine.request("1.7.0", { State: { } });

        if (!local_enabled){
            return;
        }

        if (download_state.status == status.Finished) {
            clearPolling();
            isInProgress = false;
            return;
        }
        if (download_state.status == status.NotStarted && download_state.last_failure) {
            clearPolling();
            showErrorNotification(download_state);
            isInProgress = false;
            return;
        }

        if (download_state.status == status.InProgress) {
            clearPolling();
            handleDownloadingInProgress(tabNine);
        }
    }, fourSeconds);

    let pollingTimeout = setTimeout(() => {
        clearInterval(pollingInterval);
    }, oneMinute);

    function clearPolling() {
        clearInterval(pollingInterval);
        clearTimeout(pollingTimeout);
    }
}


function handleDownloadingInProgress(tabNine: any) {
    window.withProgress({
        location: ProgressLocation.Notification,
        title: progressBarTitle
    }, progress => {
        progress.report({ increment: 0 });
        startSpinner();
        return new Promise(resolve => {
            let progressInterval = setInterval(async () => {
                let { download_state } = await tabNine.request("1.7.0", { State: {} });

                if (download_state.status == status.Finished) {
                    showDownloadFinishedNotification();
                    completeProgress(progressInterval, resolve);
                    return;
                }
                if (download_state.last_failure) {
                    showErrorNotification(download_state);
                    completeProgress(progressInterval, resolve);
                    return;
                }
                handleDownloading(download_state, progress);
            }, fourSeconds);
        });
    });
}

function completeProgress(progressInterval: NodeJS.Timer, resolve: (value?: unknown) => void) {
    stopSpinner();
    clearInterval(progressInterval);
    resolve();
    isInProgress = false;
}
function showDownloadFinishedNotification() {
    window.showInformationMessage(downloadingFinishedMessage);
}


function handleDownloading(download_state: any, progress: Progress<{ message?: string; increment?: number; }>) {
    if (download_state.kind == downloadProgress.RetrievingMetadata) {
        progress.report({ increment: 0, message: download_state.kind });
    }
    if (download_state.kind == downloadProgress.Downloading) {
        let increment = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 10);
        let percentage = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 100);
        progress.report({ increment, message: `${percentage}%` });
    }
    if (download_state.kind == downloadProgress.VerifyingChecksum) {
        progress.report({ increment: 100, message: download_state.kind });
    }
}

function showErrorNotification({last_failure}) {
    window.showErrorMessage(`${downloadingFailedMessage}: ${last_failure}`);
}
function mb(x) {
    return Math.floor(x / 1024 / 1024) + ' MB';
}