import * as semver from 'semver';
import {window, commands, Uri,} from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities";
import { installCommand, latestReleaseUrl, minimalSupportedVscodeAPI } from "./consts";
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

    if (shouldCheckAvailableVersion(tabnineContext.vscodeVersion)) {

      const artifactUrl = await getArtifactUrl();
      const availableVersion = getAvailableVersion(artifactUrl);

      if (isNewerVersionAvailable(availableVersion, tabnineContext.version)) {

        const { name } = await createTempFileWithPostfix(".vsix");
        await downloadFileToDestination(artifactUrl, name);
        await commands.executeCommand(installCommand, Uri.file(name));
        void promptReloadWindow(`TabNine has been updated to ${availableVersion} version. Please reload the window for the changes to take effect.`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
async function getArtifactUrl() : Promise<string> {
  const response = JSON.parse(await downloadFileToStr(latestReleaseUrl)) as GitHubReleaseResponse;
  return response.assets[0].browser_download_url;
}

function isNewerVersionAvailable(availableVersion: string, contentVersion: string | undefined): boolean {
  const isNewerVersion = !!contentVersion && semver.gt(availableVersion, contentVersion);
  const isAlphaAvailable = !!semver.prerelease(availableVersion)?.includes("alpha");

  return isAlphaAvailable &&  isNewerVersion;
}
function getAvailableVersion(artifactUrl: string): string{
  const versionPattern = /(?<=download\/)(.*)(?=\/tabnine-vscode)/ig;
  const match = artifactUrl.match(versionPattern);
  return match && match[0] || "";
}
function shouldCheckAvailableVersion(vscodeVersion: string) : boolean {
  const isVersionSupported = semver.gte(
    vscodeVersion,
    minimalSupportedVscodeAPI
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
