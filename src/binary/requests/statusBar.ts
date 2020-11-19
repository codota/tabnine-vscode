import { NotificationAction, NotificationActions } from "./notifications";
import { tabNineProcess } from "./requests";

export type StatusBarMessage = {
    id: string;
    message: string;
    options: {
      key: string;
      action: NotificationActions;
    }[];
  };
  
  export function getStatusBarMessage(): Promise<StatusBarMessage | null | undefined> {
    return tabNineProcess.request<StatusBarMessage>({ StatusBar: {} });
  }
  export async function sendStatusBarAction(
    id: string,
    selected: string | undefined
  ): Promise<NotificationAction | null | undefined> {
    return tabNineProcess.request<NotificationAction>({
        StatusBarAction: { id, selected },
    });
  }