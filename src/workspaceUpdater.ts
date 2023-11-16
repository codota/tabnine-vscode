import * as vscode from "vscode";
import { BINARY_UPDATE_WORKSPACE_INTERVAL } from "./globals/consts";
import sendUpdateWorkspaceRequest from "./binary/requests/workspace";
import { Logger } from "./utils/logger";

const INITIAL_DELAY = 3000;

let updateInterval: NodeJS.Timeout | null = null;

export default function startWorkspaceUpdater() {
  setTimeout(() => {
    updateWorkspace();
    updateInterval = setInterval(
      updateWorkspace,
      BINARY_UPDATE_WORKSPACE_INTERVAL
    );
  }, INITIAL_DELAY);
}

function updateWorkspace() {
  const rootPaths = vscode.workspace.workspaceFolders
    ?.filter((wf) => wf.uri.scheme === "file")
    .map((wf) => wf.uri.path);
  if (!rootPaths) {
    Logger.debug(
      `No root paths for project ${vscode.workspace.name || "unknown"}`
    );
    return;
  }

  Logger.debug(
    `Updating root paths for project ${
      vscode.workspace.name || "unknown"
    }: ${JSON.stringify(rootPaths)}`
  );
  void sendUpdateWorkspaceRequest({
    root_paths: rootPaths,
  });
}

export function cancelWorkspaceUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
}
