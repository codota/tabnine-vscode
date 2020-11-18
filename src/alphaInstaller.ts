import * as semver from 'semver';
import {window, commands, Uri,} from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities";
import { INSTALL_COMMAND, LATEST_RELEASE_URL, MINIMAL_SUPPORTED_VSCODE_API } from "./consts";
import { downloadFileToDestination, downloadFileToStr } from './download.utils';
import { tabnineContext } from "./extensionContext";
import createTempFileWithPostfix from './file.utils';

type GitHubAsset = {
  browser_download_url: string
}
type GitHubReleaseResponse = {
  assets: GitHubAsset[],
}
export default async function handleAlpha(): Promise<void> {
  try {

    if (userConsumesAlphaVersions()) {

      const artifactUrl = await getArtifactUrl();
      const availableVersion = getAvailableAlphaVersion(artifactUrl);

      if (isNewerAlphaVersionAvailable(availableVersion)) {

        const { name } = await createTempFileWithPostfix(".vsix");
        await downloadFileToDestination(artifactUrl, name);
        await commands.executeCommand(INSTALL_COMMAND, Uri.file(name));
        void promptReloadWindow(`TabNine has been updated to ${availableVersion} version. Please reload the window for the changes to take effect.`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
async function getArtifactUrl() : Promise<string> {
  const response = JSON.parse(await downloadFileToStr(LATEST_RELEASE_URL)) as GitHubReleaseResponse;
  return response.assets[0].browser_download_url;
}

function isNewerAlphaVersionAvailable(availableVersion: string): boolean {
  const currentVersion = tabnineContext.version;
  const isNewerVersion = !!currentVersion && semver.gt(availableVersion, currentVersion);
  const isAlphaAvailable = !!semver.prerelease(availableVersion)?.includes("alpha");

  return isAlphaAvailable &&  isNewerVersion;
}
function getAvailableAlphaVersion(artifactUrl: string): string{
  const versionPattern = /(?<=download\/)(.*)(?=\/tabnine-vscode)/ig;
  const match = artifactUrl.match(versionPattern);
  return match && match[0] || "";
}
function userConsumesAlphaVersions() : boolean {
  const isVersionSupported = semver.gte(
    tabnineContext.vscodeVersion,
    MINIMAL_SUPPORTED_VSCODE_API
  );
  const isAlpha = isCapabilityEnabled(Capability.ALPHA_CAPABILITY);
  return isVersionSupported && isAlpha;

}
async function promptReloadWindow(message: string): Promise<void> {
  const reload = "Reload";
  const value = await window.showInformationMessage(message, reload);
  if (value === reload) {
    void commands.executeCommand("workbench.action.reloadWindow");
  }
}
