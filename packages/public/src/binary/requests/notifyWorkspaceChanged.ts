import { tabNineProcess } from "tabnine-vscode-common";

interface NotifyWorkspaceChangedRequest {
  NotifyWorkspaceChanged: {
    workspace_folders: string[];
  };
}

function notifyWorkspaceChanged(
  workspaceFolders: string[]
): Promise<void | null | undefined> {
  return tabNineProcess
    .request<null, NotifyWorkspaceChangedRequest>(
      {
        NotifyWorkspaceChanged: { workspace_folders: workspaceFolders },
      },
      5000
    )
    .catch(console.error);
}

export default notifyWorkspaceChanged;
