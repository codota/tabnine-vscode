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

export default async function handlePreReleaseChannels(
  context: ExtensionContext
): Promise<void> {
  try {
    void showSettingsForBetaChannelIfNeeded(context);
    if (userConsumesPreReleaseChannelUpdates()) {
      const artifactUrl = await getArtifactUrl();
      const availableVersion = getAvailableAlphaVersion(artifactUrl);

      if (isNewerAlphaVersionAvailable(context, availableVersion)) {
        const { name } = await createTempFileWithPostfix(".vsix");
        await downloadFileToDestination(artifactUrl, name);
        await commands.executeCommand(INSTALL_COMMAND, Uri.file(name));
        await updatePersistedAlphaVersion(context, availableVersion);

        void showMessage({
          messageText: `TabNine has been updated to ${availableVersion} version. Please reload the window for the changes to take effect.`,
          buttonText: "Reload",
          action: () =>
            void commands.executeCommand("workbench.action.reloadWindow"),
        });
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

async function showSettingsForBetaChannelIfNeeded(context: ExtensionContext) {
  const didShowMessage = context.globalState.get<boolean>(
    BETA_CHANNEL_MESSAGE_SHOWN_KEY
  );
  const shouldNotShowMessage =
    !isPreReleaseChannelSupported() ||
    !tabnineExtensionProperties.isVscodeInsiders ||
    didShowMessage ||
    tabnineExtensionProperties.isExtentionBetaChannelEnabled;

  if (shouldNotShowMessage) {
    return;
  }

  await context.globalState.update(BETA_CHANNEL_MESSAGE_SHOWN_KEY, true);

  void showMessage({
    messageText:
      "Do you wish to help Tabnine get better? Opt in to the Tabnine's extension beta channel if so!",
    buttonText: "Open Settings",
    action: () =>
      void commands.executeCommand(
        "workbench.action.openSettings",
        "tabnine.receiveBetaChannelUpdates"
      ),
  });
}
