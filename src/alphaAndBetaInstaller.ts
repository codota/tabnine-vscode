import * as semver from "semver";
import { window, commands, Uri, Memento, env } from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities";
import {
  ALPHA_VERSION_KEY,
  BETA_CHANNEL_MESSAGE_SHOWN_KEY,
  INSTALL_COMMAND,
  LATEST_RELEASE_URL,
  MINIMAL_SUPPORTED_VSCODE_API,
} from "./globals/consts";
import {
  downloadFileToDestination,
  downloadFileToStr,
} from "./utils/download.utils";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";
import createTempFileWithPostfix from "./utils/file.utils";

type GitHubAsset = {
  browser_download_url: string;
};
type GitHubReleaseResponse = {
  assets: GitHubAsset[];
}[];

export type ExtensionContext = { globalState: Memento };

export default async function handleAlphaAndBetaChannels(
  context: ExtensionContext
): Promise<void> {
  try {
    void showSettingsForBetaChannelIfNeeded(context);
    if (
      userConsumesAlphaVersions() ||
      tabnineExtensionProperties.isExtentionBetaChannelEnabled
    ) {
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
  return persistedAlphaVersion || tabnineExtensionProperties.version;
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
    tabnineExtensionProperties.vscodeVersion,
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

async function showSettingsForBetaChannelIfNeeded(context: ExtensionContext) {
  if (env.appName.toLocaleLowerCase().indexOf("insider") > -1) {
    const didShowMessage = context.globalState.get<boolean>(
      BETA_CHANNEL_MESSAGE_SHOWN_KEY
    );
    if (
      !(
        didShowMessage ||
        tabnineExtensionProperties.isExtentionBetaChannelEnabled
      )
    ) {
      await context.globalState.update(BETA_CHANNEL_MESSAGE_SHOWN_KEY, true);

      const openSettings = "Open Settings";
      const value = await window.showInformationMessage(
        "Do you wish to help Tabnine get better? Opt in to the Tabnine's extension beta channel if so!",
        openSettings
      );
      if (value === openSettings) {
        void commands.executeCommand(
          "workbench.action.openSettings",
          "tabnine.receiveBetaChannelUpdates"
        );
      }
    }
  }
}
