import * as vscode from "vscode";
import { BINARY_UPDATE_WORKSPACE_INTERVAL } from "./globals/consts";
import sendUpdateWorkspaceRequest from "./binary/requests/workspace";
import { Logger } from "./utils/logger";
import { fireEvent, tabNineProcess } from "./binary/requests/requests";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";

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

async function sendEvent(event: string, payload: Record<string, unknown> = {}) {
  if (isCapabilityEnabled(Capability.WORKSPACE_TRACE)) {
    fireEvent({
      name: event,
      ...payload,
    });
  }
}

function updateWorkspace() {
  void sendEvent("workspace_starting");
  const rootPaths = vscode.workspace.workspaceFolders
    ?.filter((wf) => {
      const isFileUrl = wf.uri.scheme === "file";
      if (!isFileUrl) {
        void sendEvent("workspace_protocol_not_file", {
          path: wf.uri.toString(),
        });
      }
      return isFileUrl;
    })
    .map((wf) => wf.uri.path);
  if (!rootPaths) {
    void sendEvent("workspace_no_root_paths");
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

  void sendEvent("workspace_sending_request", {
    root_paths_len: rootPaths.length,
  });

  void sendUpdateWorkspaceRequest({
    root_paths: rootPaths,
  });
}
