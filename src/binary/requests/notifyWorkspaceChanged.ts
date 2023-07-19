import { Logger } from "../../utils/logger";
import { tabNineProcess } from "./requests";

interface NotifyWorkspaceChangedRequest {
  NotifyWorkspaceChanged: {
    workspace_folders: string[];
  };
}

function notifyWorkspaceChanged(
  workspaceFolders: string[]
): Promise<void | null | undefined> {
  return (
    tabNineProcess
      .request<null, NotifyWorkspaceChangedRequest>(
        {
          NotifyWorkspaceChanged: { workspace_folders: workspaceFolders },
        },
        5000
      )
      // eslint-disable-next-line @typescript-eslint/unbound-method
      .catch(Logger.error)
  );
}

export default notifyWorkspaceChanged;
