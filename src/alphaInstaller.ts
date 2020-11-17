import {window, commands, Uri,} from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities";
import { tabnineContext } from "./extensionContext";
import { greater, greaterOrEqual } from "./semverUtils";
import { createTempFileWithPostfix, downloadFileToDestination, downloadFileToStr} from "./utils";


const uninstallCommand = "workbench.extensions.uninstallExtension";
const installCommand = "workbench.extensions.installExtension";
const latestReleaseUrl = "https://api.github.com/repos/codota/tabnine-vscode/releases/latest";
const minimalSupportedVscodeAPI = "1.35.0";
const versionPattern = /(?<=download\/)(.*)(?=\/tabnine-vscode)/ig;

type Asset = {
  browser_download_url: string,
  updated_at: string
}
type Response = {
  assets: Asset[],
}
export default async function handleAlpha(): Promise<void> {
  try {
    const {vscodeVersion, version, id} = tabnineContext;

    const isVersionSupported = greaterOrEqual(
      vscodeVersion,
      minimalSupportedVscodeAPI
    );
    const isAlpha = isCapabilityEnabled(Capability.VALIDATOR_CAPABILITY);
    if (isVersionSupported && isAlpha && version && id) {

      const latestRelease = await downloadFileToStr(latestReleaseUrl);
      const response = JSON.parse(latestRelease) as Response;
      const {browser_download_url: artifactUrl, updated_at: updatedAt} = response.assets[0];
      const match = artifactUrl.match(versionPattern);
      const availableVersion = match && match[0] || "";
      const isNewerVersion = greater(availableVersion, version);
      const isUpdatedVersion = new Date(updatedAt) > new Date();
      if (isNewerVersion || isUpdatedVersion) {

        const { name } = await createTempFileWithPostfix(".vsix");
        await downloadFileToDestination(artifactUrl, name);
        await commands.executeCommand(uninstallCommand, id)
        await commands.executeCommand(installCommand, Uri.file(name));
        const message = `TabNine has been updated to ${availableVersion} - ${updatedAt} version. Please reload the window for the changes to take effect.`;
        void promptReloadWindow(message);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function promptReloadWindow(message: string): Promise<void> {
  const reload = "Reload";
  const value = await window.showInformationMessage(message, reload);
  if (value === reload) {
    void commands.executeCommand("workbench.action.reloadWindow");
  }
}
