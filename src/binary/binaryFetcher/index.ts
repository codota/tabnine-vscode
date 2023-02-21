import { commands, env, ProgressLocation, Uri, window } from "vscode";
import {
  BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
  OPEN_NETWORK_SETUP_HELP,
  RELOAD_BUTTON,
} from "../../globals/consts";
import handleActiveFile from "./activeFileHandler";
import downloadAndExtractBundle from "./bundleDownloader";
import handleExistingVersion from "./existingVersionHandler";
import { onPluginInstalledEmitter } from "../../events/onPluginInstalledEmitter";

export default async function fetchBinaryPath(): Promise<string> {
  const activeVersionPath = handleActiveFile();
  if (activeVersionPath) {
    return activeVersionPath;
  }
  const existingVersion = await handleExistingVersion();
  if (existingVersion) {
    return existingVersion;
  }
  onPluginInstalledEmitter.fire();
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
