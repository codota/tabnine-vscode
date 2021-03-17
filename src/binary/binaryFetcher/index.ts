import { env, ProgressLocation, window } from "vscode";
import {
  BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
  DOWNLOAD_RETRY,
  getNetworkSettingsHelpLink,
  getOpenDownloadIssueLink,
  OPEN_ISSUE_BUTTON,
  OPEN_NETWORK_SETUP_HELP,
} from "../../consts";
import handleActiveFile from "./activeFileHandler";
import downloadAndExtractBundle from "./bundleDownloader";
import handleExistingVersion from "./existingVersionHandler";

export default async function fetchBinaryPath(): Promise<string> {
  const activeVersionPath = handleActiveFile();
  if (activeVersionPath) {
    return activeVersionPath;
  }
  const existingVersion = await handleExistingVersion();
  if (existingVersion) {
    return existingVersion;
  }
  return tryDownloadVersion();
}

async function tryDownloadVersion(): Promise<string> {
  try {
    return await downloadVersion();
  } catch (error) {
    return handleErrorMessage(error);
  }
}
async function downloadVersion(): Promise<string> {
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: `Initializing Tabnine`,
    },
    downloadAndExtractBundle
  );
}
async function handleErrorMessage(error: string): Promise<string> {
  return new Promise((resolve, reject) => {
    void window
      .showErrorMessage(
        DOWNLOAD_RETRY,
        BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
        OPEN_ISSUE_BUTTON,
        OPEN_NETWORK_SETUP_HELP
      )
      .then((result) => {
        if (result === OPEN_ISSUE_BUTTON) {
          void env.openExternal(getOpenDownloadIssueLink(error));
          reject(error);
        } else if (result === OPEN_NETWORK_SETUP_HELP) {
          void env.openExternal(getNetworkSettingsHelpLink());
          reject(error);
        } else if (result === DOWNLOAD_RETRY) {
          resolve(tryDownloadVersion());
        } else {
          reject(error);
        }
      }, reject);
  });
}
