
import { MessageActions } from "../../consts";
import { tabNineProcess } from "./requests";


type StatusBarAction = Record<string, unknown>;

export type StatusBarStatus = {
    id: string;
    message: string;
    actions: MessageActions[];
    notification_type: unknown;
  };
  
  export function getStatus(): Promise<StatusBarStatus | null | undefined> {
    return tabNineProcess.request<StatusBarStatus>({ StatusBar: {} });
  }
  export async function sendStatusBarAction(
    id: string,
    selected: string | undefined,
    notification_type: unknown,
    actions: MessageActions[],
  ): Promise<StatusBarAction | null | undefined> {
    return tabNineProcess.request<StatusBarAction>({
        StatusBarAction: { id, selected, notification_type, actions },
    });
  }