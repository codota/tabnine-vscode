import { ProgressLocation, window, Progress, env, commands, Uri } from "vscode";
import { startSpinner, stopSpinner } from "./statusBar";
import { API_VERSION, TabNine, StateType, StatePayload } from "./TabNine";
import { handleErrorMessage, handleInfoMessage, onEnableCloudAction } from "./notificationsHandler";
import { EOL } from "os";

const FOUR_SECONDS = 4000;
const ONE_MINUTE = 60000;
const PROGRESS_BAR_TITLE = "TabNine local model is being downloaded";
const PROGRESS_BAR_MESSAGE = "Once it is downloaded you will be able to get the best of TabNine";
const DOWNLOAD_FAILED = "TabNine initialization is not completed, please check your internet connection and try to restart VS Code. If it doesn’t help, please contact support@tabnine.com";
const CONTACT_SUPPORT = "Contact TabNine Support";
const CPU_NOT_SUPPORTED = "TabNine Local Deep completions cannot work on your current hardware setup, This will decrease the quality of the TabNine suggestions. You can enable TabNine Deep Cloud from the TabNine settings page";
const DOWNLOAD_COMPLETED = "TabNine local model was downloaded successfully";

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
            handleErrorMessage(tabNine, CPU_NOT_SUPPORTED, onEnableCloudAction, CPU_NOT_SUPPORTED);
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
            !cloud_enabled && showErrorNotification(tabNine);
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
                let { download_state, cloud_enabled } = await tabNine.request(API_VERSION, { State: {} });

                if (download_state.status == status.Finished) {
                    completeProgress(progressInterval, resolve);
                    return;
                }
                if (download_state.last_failure) {
                    !cloud_enabled && showErrorNotification(tabNine);
                    completeProgress(progressInterval, resolve);
                    return;
                }
                handleDownloading(download_state, progress, tabNine);
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


function handleDownloading(download_state: any, progress: Progress<{ message?: string; increment?: number; }>, tabNine: TabNine) {
    if (download_state.kind == downloadProgress.Downloading) {
        let increment = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 10);
        let percentage = Math.floor((download_state.crnt_bytes / download_state.total_bytes) * 100);
        progress.report({ increment, message: `${percentage}%. ${EOL}${PROGRESS_BAR_MESSAGE}` });
    }
    if (download_state.kind == downloadProgress.VerifyingChecksum) {
        progress.report({ increment: 100, message: download_state.kind });
        handleInfoMessage(tabNine, DOWNLOAD_COMPLETED);
    }
}

function showErrorNotification(tabNine: TabNine) {
    handleErrorMessage(tabNine, DOWNLOAD_FAILED, (action: string) => {
        if (action === CONTACT_SUPPORT){
            commands.executeCommand('vscode.open', Uri.parse('mailto:support@tabnine.com'))
            .then(() => tabNine.setState({ [StatePayload.state]: { state_type: StateType.notification, state: CONTACT_SUPPORT } }));
        }
    }, CONTACT_SUPPORT);
}