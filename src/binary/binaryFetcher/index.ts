import { commands, env, ProgressLocation, Uri, window } from "vscode";
import {
  BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
  OPEN_NETWORK_SETUP_HELP,
  RELOAD_BUTTON,
} from "../../globals/consts";
import { reportErrorEvent, reportException } from "../../reports/reporter";
import handleActiveFile from "./activeFileHandler";
import downloadAndExtractBundle from "./bundleDownloader";
import handleExistingVersion from "./existingVersionHandler";
import {
  installationState,
  InstallationState,
} from "../../events/installationStateChangedEmitter";
import EventName from "../../reports/EventName";

export default async function fetchBinaryPath(): Promise<string> {
  const activeVersionPath = handleActiveFile();
  if (activeVersionPath) {
    installationState.fire(InstallationState.ExistingInstallation);
    return activeVersionPath;
  }

  const existingVersion = await handleExistingVersion();
  if (existingVersion) {
    installationState.fire(InstallationState.ExistingInstallation);
    return existingVersion;
  }
  installationState.fire(InstallationState.NewInstallation);
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
    return handleErrorMessage(error as Error);
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
function getNetworkSettingsHelpLink(): Uri {
  return Uri.parse("https://code.visualstudio.com/docs/setup/network");
}
