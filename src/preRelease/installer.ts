import * as semver from "semver";
import { commands, Uri } from "vscode";
import {
  BETA_CHANNEL_MESSAGE_SHOWN_KEY,
  INSTALL_COMMAND,
  LATEST_RELEASE_URL,
} from "../globals/consts";
import {
  downloadFileToDestination,
  downloadFileToStr,
} from "../utils/download.utils";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import createTempFileWithPostfix from "../utils/file.utils";
import showMessage from "./messages";
import {
  getAvailableAlphaVersion,
  getCurrentVersion,
  isPreReleaseChannelSupported,
  updatePersistedAlphaVersion,
  userConsumesPreReleaseChannelUpdates,
} from "./versions";
import { ExtensionContext, GitHubReleaseResponse } from "./types";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";

const badVersion = "9999.9999.9999";

export default async function handlePreReleaseChannels(
  context: ExtensionContext
): Promise<void> {
  try {
    void showNotificationForBetaChannelIfNeeded(context);
    if (userConsumesPreReleaseChannelUpdates()) {
      if (await hotfixVersion9999(context)) {
        return;
      }

      const artifactUrl = await getArtifactUrl();
      const availableVersion = getAvailableAlphaVersion(artifactUrl);

      if (isNewerAlphaVersionAvailable(context, availableVersion)) {
        const { name } = await createTempFileWithPostfix(".vsix");
        await downloadFileToDestination(artifactUrl, name);
        await commands.executeCommand(INSTALL_COMMAND, Uri.file(name));
        await updatePersistedAlphaVersion(context, availableVersion);

        showMessageFor(availableVersion);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function showMessageFor(availableVersion: string) {
  void showMessage({
    messageId: "prerelease-installer-update",
    messageText: `TabNine has been updated to ${availableVersion} version. Please reload the window for the changes to take effect.`,
    buttonText: "Reload",
    action: () => void commands.executeCommand("workbench.action.reloadWindow"),
  });
}

async function hotfixVersion9999(context: ExtensionContext): Promise<boolean> {
  const currentVersion = getCurrentVersion(context);

  if (semver.eq(semver.coerce(currentVersion) || "", badVersion)) {
    const lastAlphaArtifactUrl =
      "https://github.com/codota/tabnine-vscode/releases/download/v3.5.3/tabnine-vscode.vsix";
    const goodAlphaVersion = "3.5.4";
    const { name } = await createTempFileWithPostfix(".vsix");
    await downloadFileToDestination(lastAlphaArtifactUrl, name);
    await commands.executeCommand(INSTALL_COMMAND, Uri.file(name));
    await updatePersistedAlphaVersion(context, goodAlphaVersion);

    showMessageFor(goodAlphaVersion);
    return true;
  }

  return false;
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
  const availableSemverCoerce = semver.coerce(availableVersion)?.version;
  const isNewerVersion =
    !!currentVersion &&
    semver.gt(availableVersion, currentVersion) &&
    semver.neq(availableSemverCoerce || "", badVersion);

  const isAlphaAvailable = !!semver
    .prerelease(availableVersion)
    ?.includes("alpha");
  const isSameWithAlphaAvailable =
    !!currentVersion &&
    semver.eq(availableSemverCoerce || "", currentVersion) &&
    isAlphaAvailable;

  return (isAlphaAvailable && isNewerVersion) || isSameWithAlphaAvailable;
}

async function showNotificationForBetaChannelIfNeeded(
  context: ExtensionContext
) {
  const didShowMessage = context.globalState.get<boolean>(
    BETA_CHANNEL_MESSAGE_SHOWN_KEY
  );

  const shouldShowMessage =
    isPreReleaseChannelSupported() &&
    (tabnineExtensionProperties.isVscodeInsiders ||
      isCapabilityEnabled(Capability.ALPHA_CAPABILITY)) &&
    !didShowMessage &&
    !tabnineExtensionProperties.isExtentionBetaChannelEnabled;

  if (!shouldShowMessage) {
    return;
  }

  await showMessage({
    messageId: "vscode-join-beta-channel",
    messageText:
      "Do you wish to help Tabnine get better? Enable Tabnine's extension beta channel if so!",
    buttonText: "Open Settings",
    action: () =>
      void commands.executeCommand(
        "workbench.action.openSettings",
        "tabnine.receiveBetaChannelUpdates"
      ),
  });

  await context.globalState.update(BETA_CHANNEL_MESSAGE_SHOWN_KEY, true);
}
