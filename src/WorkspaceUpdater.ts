import * as vscode from "vscode";
import { BINARY_UPDATE_WORKSPACE_INTERVAL } from "./globals/consts";
import sendUpdateWorkspaceRequest from "./binary/requests/workspace";
import { Logger } from "./utils/logger";
import { tabNineProcess } from "./binary/requests/requests";
import { getWorkspaceRootPaths } from "./utils/workspaceFolders";

const INITIAL_DELAY = 3000;

export class WorkspaceUpdater implements vscode.Disposable {
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    void tabNineProcess.onReady.then(() => {
      setTimeout(() => {
        updateWorkspace();
        this.updateInterval = setInterval(
          updateWorkspace,
          BINARY_UPDATE_WORKSPACE_INTERVAL
        );
      }, INITIAL_DELAY);
    });
  }

  dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

function updateWorkspace() {
  const rootPaths = getWorkspaceRootPaths() || [];

  Logger.debug(
    `Updating root paths for project ${
      vscode.workspace.name || "unknown"
    }: ${JSON.stringify(rootPaths)}`
  );

  void sendUpdateWorkspaceRequest({
    root_paths: rootPaths,
  });
}
