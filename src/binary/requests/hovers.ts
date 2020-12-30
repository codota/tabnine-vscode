import { MessageActions } from "../../consts";
import { tabNineProcess } from "./requests";

export enum HoverActions {
    NONE = 0,
}
export type Hover = {
    id: string;
    message: string;
    title: string,
    actions: MessageActions[],
    notification_type: unknown,
    state: unknown,
  };

  export function getHover(): Promise<Hover | null | undefined> {
    return tabNineProcess.request<Hover>({ Hover: {} });
  }
  export async function sendHoverAction(
    id: string,
    actions: MessageActions[],
    notification_type: unknown,
    state: unknown,
  ): Promise<unknown> {
    return tabNineProcess.request({
        HoverAction: { id, actions, notification_type, state },
    });
  }