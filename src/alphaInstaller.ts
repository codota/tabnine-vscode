import * as semver from "semver";
import { window, commands, Uri, Memento } from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities";
import {
  ALPHA_VERSION_KEY,
  INSTALL_COMMAND,
  LATEST_RELEASE_URL,
  MINIMAL_SUPPORTED_VSCODE_API,
} from "./consts";
import { downloadFileToDestination, downloadFileToStr } from "./download.utils";
import { tabnineContext } from "./extensionContext";
import createTempFileWithPostfix from "./file.utils";

type GitHubAsset = {
  browser_download_url: string;
};
type GitHubReleaseResponse = {
  assets: GitHubAsset[];
}[];

export type ExtensionContext = { globalState: Memento };

export default async function handleAlpha(
  context: ExtensionContext
): Promise<void> {
  try {
    if (userConsumesAlphaVersions()) {
      const artifactUrl = await getArtifactUrl();
      const availableVersion = getAvailableAlphaVersion(artifactUrl);

      if (isNewerAlphaVersionAvailable(context, availableVersion)) {
        const { name } = await createTempFileWithPostfix(".vsix");
        await downloadFileToDestination(artifactUrl, name);
        await commands.executeCommand(INSTALL_COMMAND, Uri.file(name));
        await updatePersistedAlphaVersion(context, availableVersion);

        void promptReloadWindow(
          `TabNine has been updated to ${availableVersion} version. Please reload the window for the changes to take effect.`
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
}
async function getArtifactUrl(): Promise<string> {
  const response = JSON.parse(
    await downloadFileToStr(LATEST_RELEASE_URL)
  ) as GitHubReleaseResponse;
  return response[0].assets[0].browser_download_url;
}

function isNewerAlphaVersionAvailable(
  context: ExtensionContext,
  availableVersion: string
): boolean {
  const currentVersion = getCurrentVersion(context);
  const isNewerVersion =
    !!currentVersion && semver.gt(availableVersion, currentVersion);
  const isAlphaAvailable = !!semver
    .prerelease(availableVersion)
    ?.includes("alpha");
  const isSameWithAlphaAvailable =
    !!currentVersion &&
    semver.eq(semver.coerce(availableVersion)?.version || "", currentVersion) &&
    isAlphaAvailable;

  return (isAlphaAvailable && isNewerVersion) || isSameWithAlphaAvailable;
}
function getCurrentVersion(context: ExtensionContext): string | undefined {
  const persistedAlphaVersion = getPersistedAlphaVersion(context);
  return persistedAlphaVersion || tabnineContext.version;
}
export function getPersistedAlphaVersion(
  context: ExtensionContext
): string | undefined {
  return context.globalState.get<string | undefined>(ALPHA_VERSION_KEY);
}
export function updatePersistedAlphaVersion(
  context: ExtensionContext,
  installedVersion: string | undefined
): Thenable<void> {
  return context.globalState.update(ALPHA_VERSION_KEY, installedVersion);
}

function getAvailableAlphaVersion(artifactUrl: string): string {
  const versionPattern = /(?<=download\/)(.*)(?=\/tabnine-vscode)/gi;
  const match = artifactUrl.match(versionPattern);
  return (match && match[0]) || "";
}
function userConsumesAlphaVersions(): boolean {
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
