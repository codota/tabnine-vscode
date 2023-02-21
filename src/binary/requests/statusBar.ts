import { MessageAction } from "../../globals/consts";
import { tabNineProcess } from "./requests";

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

export function getStatus(): null {
  return null;
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
