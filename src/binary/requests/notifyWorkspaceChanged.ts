import { tabNineProcess } from "./requests";

interface NotifyWorkspaceChangedRequest {
  NotifyWorkspaceChanged: {
    workspace_folders: string[];
  };
}

function notifyWorkspaceChanged(
  workspaceFolders: string[]
): Promise<null | undefined> {
  return tabNineProcess.request<null, NotifyWorkspaceChangedRequest>({
    NotifyWorkspaceChanged: { workspace_folders: workspaceFolders },
  });
}

export default notifyWorkspaceChanged;
