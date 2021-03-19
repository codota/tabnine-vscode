import { commands, env, ProgressLocation, window } from "vscode";
import {
  BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
  getNetworkSettingsHelpLink,
  OPEN_NETWORK_SETUP_HELP,
  RELOAD_BUTTON,
} from "../../consts";
import { EventName, reportErrorEvent, reportException } from "../../reporter";
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
    const existingVersion = await handleExistingVersion();
    if (existingVersion) {
      return existingVersion;
    }
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
async function handleErrorMessage(error: Error): Promise<string> {
  reportErrorEvent(EventName.BUNDLE_DOWNLOAD_FAILURE, error);
  reportException(error);
  return new Promise((resolve, reject) => {
    void window
      .showErrorMessage(
        BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
        RELOAD_BUTTON,
        OPEN_NETWORK_SETUP_HELP
      )
      .then((result) => {
        if (result === OPEN_NETWORK_SETUP_HELP) {
          void env.openExternal(getNetworkSettingsHelpLink());
          reject(error);
        } else if (result === RELOAD_BUTTON) {
          void commands.executeCommand("workbench.action.reloadWindow");
          reject(error);
        } else {
          reject(error);
        }
      }, reject);
  });
}
