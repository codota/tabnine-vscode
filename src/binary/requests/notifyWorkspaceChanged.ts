import { tabNineProcess } from "./requests";

interface NotifyWorkspaceChangedRequest {
  NotifyWorkSpaceChanged: {
    workspace_folders: string[];
  };
}

function notifyWorkspaceChanged(workspaceFolders: string[]) {
  return tabNineProcess.request<null, NotifyWorkspaceChangedRequest>({
    NotifyWorkSpaceChanged: { workspace_folders: workspaceFolders },
  });
}

export default notifyWorkspaceChanged;
