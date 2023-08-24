import { tabNineProcess } from "./requests";

export type RefreshResponse = {
  is_successful: boolean;
  error?: string;
};

export function refreshRemote(): Promise<RefreshResponse | null | undefined> {
  return tabNineProcess.request<RefreshResponse>({
    RefreshRemoteProperties: {},
  });
}
