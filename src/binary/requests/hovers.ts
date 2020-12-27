import { tabNineProcess } from "./requests";

export enum HoverActions {
    NONE = 0,
}
export type Hover = {
    id: string;
    hover_message: string;
    decoration_message: string
    actions: {
      key: string;
      action: HoverActions;
      state: unknown;
    }[];
  };

  export function getHover(): Promise<Hover | null | undefined> {
    return tabNineProcess.request<Hover>({ Hover: {} });
  }
  export async function sendHoverAction(
    id: string,
    action: {
        key: string;
        action: HoverActions;
        state: unknown;
      } | undefined,
  ): Promise<unknown> {
    return tabNineProcess.request({
        HoverAction: { id, action },
    });
  }