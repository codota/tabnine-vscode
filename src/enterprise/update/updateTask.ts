import { commands, Uri, window, ProgressLocation } from "vscode";
import * as tmp from "tmp";
import { promisify } from "util";
import * as semver from "semver";
import { URL } from "url";
import { INSTALL_COMMAND, UPDATE_PREFIX } from "../consts";
import {
  downloadFileToDestination,
  downloadFileToStr,
} from "../../utils/download.utils";

const createTmpFile = promisify(tmp.file);

/**
 * Update vsix task
 * @returns updatedVersion in case of update, otherwise returns null
 */
export default async function updateTask(
  serverUrl: string,
  currentVersion: string | undefined
): Promise<string | null> {
  let latestVersion = await downloadFileToStr(
    new URL(`${UPDATE_PREFIX}/version`, serverUrl)
  );
  latestVersion = latestVersion.trim();
  if (!currentVersion || semver.gt(latestVersion, currentVersion)) {
    await window.withProgress(
      {
        location: ProgressLocation.Window,
        cancellable: true,
        title: "Updating Tabnine plugin",
      },
      async () => {
        const path = await createTmpFile();
        await downloadFileToDestination(
          new URL(
            `${UPDATE_PREFIX}/tabnine-vscode-${latestVersion}.vsix`,
            serverUrl
          ),
          path
        );
        await commands.executeCommand(INSTALL_COMMAND, Uri.file(path));
      }
    );
    return latestVersion;
  }

  return null;
}
