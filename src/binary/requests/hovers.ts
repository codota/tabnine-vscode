import { MessageAction } from "../../globals/consts";
import { tabNineProcess } from "./requests";

export type Hover = {
  id: string;
  message: string;
  title: string;
  options: {
    key: string;
    actions: MessageAction[];
  }[];
  notification_type: unknown;
  state: unknown;
};

export function getHover(): Promise<Hover | null | undefined> {
  return tabNineProcess.request<Hover>({ Hover: {} });
}
export async function sendHoverAction(
  id: string,
  selected: string,
  actions: MessageAction[],
  notification_type: unknown,
  state: unknown
): Promise<unknown> {
  return tabNineProcess.request({
    HoverAction: { id, actions, notification_type, state, selected },
  });
}
