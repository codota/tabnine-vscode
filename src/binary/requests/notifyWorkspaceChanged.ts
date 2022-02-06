import { tabNineProcess } from "./requests";

interface NotifyWorkspaceChangedRequest {
  NotifyWorkSpaceChanged: {
    workspace_folders: string[];
  };
}

function notifyWorkspaceChanged(
  workspaceFolders: string[]
): Promise<null | undefined> {
  return tabNineProcess.request<null, NotifyWorkspaceChangedRequest>({
    NotifyWorkSpaceChanged: { workspace_folders: workspaceFolders },
  });
}

export default notifyWorkspaceChanged;
