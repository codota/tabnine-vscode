import { tabNineProcess } from "tabnine-vscode-common";
import { MessageAction } from "../../globals/consts";

type StatusBarAction = Record<string, unknown>;

export type StatusBarStatus = {
  id: string;
  message: string;
  title: string | undefined;
  actions: MessageAction[];
  notification_type: unknown;
  duration_seconds?: number;
  state: unknown;
};

export function getStatus(): Promise<StatusBarStatus | null | undefined> {
  return tabNineProcess.request<StatusBarStatus>({ StatusBar: {} });
}
export async function sendStatusBarAction(
  id: string,
  selected: string | undefined,
  notification_type: unknown,
  actions: MessageAction[],
  state: unknown
): Promise<StatusBarAction | null | undefined> {
  return tabNineProcess.request<StatusBarAction>({
    StatusBarAction: { id, selected, notification_type, actions, state },
  });
}
