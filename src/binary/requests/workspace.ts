import { tabNineProcess } from "./requests";

export interface Workspace {
    root_paths: string[];
}

export default function sendUpdateWorkspaceRequest(
    request: Workspace
): Promise<unknown | undefined | null> {
    return tabNineProcess.request<unknown, Workspace>(request);
}