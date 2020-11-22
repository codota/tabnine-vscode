
import { tabNineProcess } from "./requests";

export enum StatusBarActionActions {
  NONE = 0,
}

type StatusBarAction = Record<string, unknown>;

export type StatusBarStatus = {
    id: string;
    message: string;
    options: {
      key: string;
      action: StatusBarActionActions;
    }[];
  };
  
  export function getStatus(): Promise<StatusBarStatus | null | undefined> {
    return tabNineProcess.request<StatusBarStatus>({ StatusBar: {} });
  }
  export async function sendStatusBarAction(
    id: string,
    selected: string | undefined
  ): Promise<StatusBarAction | null | undefined> {
    return tabNineProcess.request<StatusBarAction>({
        StatusBarAction: { id, selected },
    });
  }