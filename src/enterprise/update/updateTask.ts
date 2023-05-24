import { commands, Uri, window, ProgressLocation } from "vscode";
import * as tmp from "tmp";
import { promisify } from "util";
import * as semver from "semver";
import { INSTALL_COMMAND, UPDATE_PREFIX } from "../consts";
import createClient from "./client";
import downloadUrl from "./downloadUrl";

const createTmpFile = promisify(tmp.file);

/**
 * Update vsix task
 * @returns updatedVersion in case of update, otherwise returns null
 */
export default async function updateTask(
  serverUrl: string,
  currentVersion: string | undefined
): Promise<string | null> {
  console.info("this version: ", currentVersion);
  const client = await createClient(serverUrl);
  let { data: latestVersion } = await client.get<string>(
    `${UPDATE_PREFIX}/version`
  );
  latestVersion = latestVersion.trim();
  console.info("remote version: ", latestVersion);
  if (!currentVersion || semver.gt(latestVersion, currentVersion)) {
    await window.withProgress(
      {
        location: ProgressLocation.Window,
        cancellable: true,
        title: "Updating Tabnine plugin",
      },
      async () => {
        const path = await createTmpFile();
        console.info("downloading ", currentVersion);
        await downloadUrl(
          client,
          `${UPDATE_PREFIX}/tabnine-vscode-${latestVersion}.vsix`,
          path
        );
        await commands.executeCommand(INSTALL_COMMAND, Uri.file(path));
      }
    );
    return latestVersion;
  }

  return null;
}
