
import { tabNineProcess } from "./requests";

export enum StatusBarActionActions {
  NONE = 0,
  OPEN_LP = 1,
}

type StatusBarAction = Record<string, unknown>;

export type StatusBarMessage = {
    id: string;
    message: string;
    options: {
      key: string;
      action: StatusBarActionActions;
    }[];
  };
  
  export function getStatusBarMessage(): Promise<StatusBarMessage | null | undefined> {
    return tabNineProcess.request<StatusBarMessage>({ StatusBar: {} });
  }
  export async function sendStatusBarAction(
    id: string,
    selected: string | undefined
  ): Promise<StatusBarAction | null | undefined> {
    return tabNineProcess.request<StatusBarAction>({
        StatusBarAction: { id, selected },
    });
  }